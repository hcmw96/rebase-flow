

# Show Membership & Credits on Account Page

## What
Create a new edge function that calls the Mindbody API to fetch the client's active contracts (memberships) and remaining service credits. Display a membership card on the Account page only when the client has an active membership.

## Mindbody API
- **`GET /public/v6/client/clientcontracts`** with `ClientId` param — returns active memberships (contract name, start/end dates, autopay status)
- **`GET /public/v6/client/clientservices`** with `ClientId` param — returns remaining credits/packages (name, remaining count, expiration)

Both use the same auth pattern as `mindbody-my-bookings` (API key + site ID + client access token from `mb_sessions`).

## Changes

### 1. New edge function: `supabase/functions/mindbody-client-membership/index.ts`
- Same auth pattern as `mindbody-my-bookings` — accepts `sessionId`, looks up `mb_sessions` for access token and client ID
- Calls both Mindbody endpoints
- Returns `{ contracts: [...], clientServices: [...] }` — empty arrays if the client has no membership
- Only returns active/non-expired contracts

### 2. New hook: `src/hooks/useMindbodyMembership.ts`
- `useClientMembership()` react-query hook, enabled when authenticated
- Returns the membership data (contracts + credits)

### 3. Update: `src/pages/AccountPage.tsx`
- Import and call `useClientMembership()`
- Between profile info and session history, conditionally render a "Membership" card **only if** `contracts` has entries
- Show: membership name, status (active/expiring), remaining credits with expiry dates
- Matches existing card styling (rounded-lg, border, bg-white/40)

## Files
- `supabase/functions/mindbody-client-membership/index.ts` (new)
- `src/hooks/useMindbodyMembership.ts` (new)
- `src/pages/AccountPage.tsx` (updated)

