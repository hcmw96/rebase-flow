## Goal

Confirm the OAuth `subscriber_id` fix actually binds your token to site `57361889` — without you having to complete (and pay for) a real booking.

## Approach

We don't need to call Mindbody's `AddClientToClass` / `BookAppointment` endpoints to know whether the token is now scoped to the right site. The site mismatch is visible directly in the JWT we get back from the `/connect/token` exchange. We add a verification path that decodes the token and reports back, and we exercise it via a dry-run.

## Steps

1. **Add a `verify-mindbody-session` edge function** (read-only).
   - Loads the current user's row from `mb_sessions`.
   - Decodes the `access_token` JWT payload.
   - Returns `{ site_ids, siteid, subscriberId, aud, exp, matches_expected_site }` where `matches_expected_site` compares against `MINDBODY_SITE_ID` (57361889).
   - Does NOT call any Mindbody booking endpoint, so zero risk of charges.

2. **Add a tiny "Check Mindbody session" debug button** (only visible to you, e.g. behind a `?debug=1` query flag on the account page).
   - Calls the verify function and shows the JSON result inline.
   - Pure diagnostic — no booking, no payment.

3. **Dry-run the booking call without confirming payment.**
   - In `mindbody-book`, add a `dryRun: true` request flag that performs the `GET /sale/contracts` style pre-check or calls `BookingWindow`/availability validation only — i.e. exercises the same auth path (which is what 401s today) but stops before any `Add*` mutation. If Mindbody's auth accepts the token for site 57361889, we know the fix worked.
   - Wire a hidden "Test booking auth (no charge)" action in the booking drawer that sends `dryRun: true`.

4. **You log in fresh, then click the two debug buttons.**
   - Button 1 confirms the token's `site_ids` claim is `57361889`.
   - Button 2 confirms Mindbody accepts the token on the booking endpoint without a "site id does not match" error — and without booking anything.

5. **Remove the debug buttons** once verified, keep `verify-mindbody-session` around as an internal diagnostic.

## Out of scope

- No real bookings, no payments, no schema changes.
- No further changes to OAuth flow beyond what's already deployed.

## Technical notes

- JWT decode is just `JSON.parse(atob(token.split('.')[1]))` in the edge function — no extra deps.
- The `dryRun` path in `mindbody-book` should branch BEFORE any `POST` to `AddClientToClass` / `AddAppointment`. Safest probe is `GET /staff/staff` or `GET /client/clients?ClientIds=<self>` with the user token + `SiteId: 57361889` header — if that returns 200, the token is correctly scoped; if it returns the same "site id does not match" error, we know the fix didn't take.
