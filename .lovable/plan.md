# Pick up Mindbody Memberships properly

## Problem

The Account page's "Membership" card only shows up when the current `mindbody-client-membership` edge function returns `contracts` (from `GET /client/clientcontracts`) or `clientServices` (from `GET /client/clientservices`).

For the test client (`6487908fc81f08a9865ba30e`) — a real Rebase member — both arrays come back empty. That's because Mindbody splits "membership" into multiple concepts:

- **Contracts** — the autopay agreement document. Often only present for newly-signed contracts; legacy/manually-created memberships have no contract row.
- **Client Services** — pre-paid packages and class credits. Not used for unlimited memberships.
- **Memberships** — the actual recurring "Membership" entitlement attached to a client (gym/recovery memberships). Lives on `GET /client/activeclientmemberships` and on the `Client` object's `MembershipIcon` / `ActiveMemberships` fields. We currently never query these, so Rebase memberships are invisible.

## Fix

Extend the existing `mindbody-client-membership` edge function and surface the result on the Account page.

### 1. Edge function (`supabase/functions/mindbody-client-membership/index.ts`)

In addition to the existing two calls, also call:

- `GET /client/activeclientmemberships?ClientId=<id>` — returns active Memberships (`ClientMemberships[]`) with `Name`, `MembershipId`, `PaymentDate`, `LastPaymentAmountPaid`, `Remaining`, `Count`, `ActiveDate`, `ExpirationDate`, `AutoRenewing`, `ProgramId`, `SiteId`.
- `GET /client/clients?ClientIds=<id>&limit=1` — read the `Client` record to get `MembershipIcon` (a small int the Mindbody UI uses to flag tier/level) and any `ActiveClientMemberships` field present on the v6 Client payload.

Filter active memberships server-side (`ExpirationDate` null or in future) and normalise into a new `memberships` array in the response:

```ts
type Membership = {
  id: number;            // ClientMembershipId
  membershipId: number;  // Mindbody MembershipId (catalog row)
  name: string;          // brand-normalised (Rebase)
  programId: number | null;
  active: boolean;
  autoRenewing: boolean;
  activeDate: string | null;
  expirationDate: string | null;
  remaining: number | null;
  paymentDate: string | null;
};
```

Apply the existing `normaliseBrand` regex (`/re[\s-]?base/gi → 'Rebase'`) to `name` so "REBASE Unlimited" displays as "Rebase Unlimited".

Response shape becomes:
```json
{ "contracts": [...], "clientServices": [...], "memberships": [...], "membershipIcon": 0 }
```

Keep all existing fields so nothing else breaks. Each Mindbody fetch must be wrapped in its own try/catch so a 404 on one endpoint doesn't break the other two (current code already tolerates non-OK; keep that pattern and add it for the new calls).

### 2. Hook (`src/hooks/useMindbodyMembership.ts`)

Add a `Membership` interface and `memberships: Membership[]` + `membershipIcon?: number` to `MembershipData`.

Also export a small derived helper:

```ts
export function useHasActiveMembership() {
  const { data } = useClientMembership();
  return Boolean(
    (data?.memberships?.length ?? 0) > 0 ||
    (data?.contracts?.length ?? 0) > 0
  );
}
```

This gives the rest of the app a clean "is this user a member?" boolean.

### 3. Account page (`src/pages/AccountPage.tsx`)

Show the Membership card when **either** `memberships` **or** `contracts` is non-empty (today it only checks contracts). Render memberships above contracts:

- Headline: membership `name`
- Subline: `Active since {ActiveDate}` · `Renews {PaymentDate}` (if `autoRenewing`)
- Show "Auto-renew" badge when `autoRenewing` is true
- If `expirationDate` is set and within 30 days, show a soft "Expires {date}" line in muted brown

Keep existing "Credits" subsection (clientServices) unchanged.

### 4. Sanity check

After deploy, hit:
```
GET /functions/v1/mindbody-client-membership?sessionId=81dad74b-83f6-469d-81ba-13f07d28ad56
```
and confirm `memberships` is populated for the known test member. If still empty, fall back to inspecting the raw Mindbody response in edge logs to confirm which field name Mindbody is using on this site (some sites return `ClientMemberships`, others `ActiveClientMemberships`) and adjust the parser accordingly.

## Files touched

- `supabase/functions/mindbody-client-membership/index.ts` — add memberships + client lookup
- `src/hooks/useMindbodyMembership.ts` — add types + `useHasActiveMembership`
- `src/pages/AccountPage.tsx` — show card when memberships exist, render memberships list

## Out of scope

- Gating bookings/pricing by membership tier (separate follow-up once the data is reliably visible).
- Admin/reception views of other clients' memberships.
