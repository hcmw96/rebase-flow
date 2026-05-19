Five focused hardening fixes to the booking flow. No visual redesign — just safer behavior and clearer messaging.

## 1. Pre-check for a valid pass before allowing confirm

**Where:** `src/components/booking/BookingDrawer.tsx`, using existing `useClientMembership` hook.

- On entering the Confirm step (and only then, to avoid an extra call on browse), read `useClientMembership()`.
- A booking is payable when the client has **at least one** of: active membership, active contract, or a `clientServices` entry with `remaining > 0` whose `name` plausibly covers the selected variant (start simple: any `remaining > 0` counts).
- If none qualify, replace the "Confirm Booking" CTA with a soft block:
  - Heading: "You'll need a pass to book this"
  - Body: one line explaining single-use passes / memberships
  - Primary button → navigate to `/membership`
  - Secondary "Contact reception" mailto fallback
- This avoids hitting Mindbody just to surface a payment error.

## 2. Friendlier error messages on confirm

**Where:** `handleConfirmBooking` catch block in `BookingDrawer.tsx`.

Map known Mindbody error shapes to plain copy via a small helper:

| Mindbody signal (case-insensitive substring) | User-facing toast |
|---|---|
| `payment`, `pricing option`, `no sessions remaining`, `package` | "You don't have a pass that covers this. Tap Membership to get one." (action button → `/membership`) |
| `already booked`, `duplicate`, `client is already` | "You already have this booking." |
| `no longer available`, `not available`, `slot`, `time conflict`, `overlap` | "That time was just taken. Pick another slot." + auto-pop back to time step + invalidate availability query |
| session expired (already handled) | unchanged |
| anything else | current generic toast |

## 3. Idempotency on confirm

**Where:** client side + `supabase/functions/mindbody-book/index.ts` + DB.

- Generate a client-side `idempotencyKey` (uuid) when the Confirm step is first reached for a given slot; pass it in the book request.
- DB: add a nullable `idempotency_key text unique` column on `bookings` (migration).
- Edge function flow:
  1. If a row with this key already exists → return it as success (no second Mindbody call).
  2. Otherwise insert a `pending` row with the key, then call Mindbody, then update to `confirmed` (or `failed` with the error stored).
- Frontend: disable the Confirm button while mutation is pending (already done) and keep the same key on retry so a flaky network can't double-book.

## 4. Cleaner local-booking metadata

**Where:** `mindbody-book/index.ts` insert payload.

- After Mindbody success, build `staff_name` / `location_name` from the response, falling back to the values we already have client-side (passed in the request body: `staffName`, `locationName` from `selectedSlot`).
- Frontend: add `staffName` and `locationName` to the book request payload.
- This guarantees the My Bookings list never shows "null".

## 5. Upsells: clarify intent (no behavior change yet)

The current upsell UI in success state is purely a navigation aid — it doesn't auto-book. That's a defensible UX (each booking needs its own slot pick), but the labels are misleading: in pre-confirm mode users see a checkbox-style toggle that suggests "add to my booking".

Two options — pick one:
- **(a) Keep as suggestions only.** Remove the checkbox/Plus affordance in pre-confirm mode; show a single "Book next" button identical to success mode. Removes the implied promise.
- **(b) Implement sequential booking.** On confirm success, if any upsells are toggled, automatically open a fresh booking drawer pre-filled with the first upsell's next available slot; user reviews & confirms each.

Recommend **(a)** — it's the small, safe change and matches what the code actually does. (b) is a larger feature and worth its own discussion.

## Technical details

- Migration:
  ```sql
  ALTER TABLE public.bookings
    ADD COLUMN idempotency_key text;
  CREATE UNIQUE INDEX bookings_idempotency_key_uidx
    ON public.bookings (idempotency_key)
    WHERE idempotency_key IS NOT NULL;
  ```
- New helper file: `src/lib/bookingErrors.ts` exporting `classifyBookingError(msg: string): { kind, message, action? }`.
- `mindbody-book` edge function: wrap insert in upsert-by-key logic; on Mindbody non-OK, persist `status='failed'` with the raw error JSON in a new `provider_data jsonb` column? — out of scope; we'll just leave the pending row and update to failed in the same call.
- No new env vars or secrets needed.

## Out of scope

- Real-time slot lock during browse (would need server-side reservation).
- Auto-buying a pass inline (still routes to `/membership`).
- Sequential auto-booking of upsells (option 5b above).
