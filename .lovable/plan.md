
Goal: fix the Mindbody outage at the backend boundary, not the website UI.

What I found
- Nothing in the frontend suggests a new regression. The failure is still happening inside the edge functions before any service data is returned.
- `mindbody-services`, `mindbody-classes`, and `mindbody-availability` all use the same staff-token flow: `Api-Key + SiteId + Username + Password` against `public/v6/usertoken/issue`.
- None of those functions send `SourceName` / `SourcePassword`.
- The logs consistently show a 401 `DeniedAccess` / `"Your account is inactive"` even after re-entering the staff credentials, which strongly points to an upstream Mindbody auth requirement/config issue rather than stale app state.
- Because the same auth code is duplicated in 3 functions, even if one screen is the first to fail, the rest of the booking flow is at risk too.

Plan
1. Add source-credential support to the staff-token request
- Update the three affected edge functions to optionally read:
  - `MINDBODY_SOURCE_NAME`
  - `MINDBODY_SOURCE_PASSWORD`
- Include those headers in the token request when present.
- Trim accidental whitespace from all credential values before sending.

2. Improve error reporting so failures are actionable
- Replace the generic `Failed to get staff token` response with a clearer backend error message that preserves the upstream Mindbody code/message.
- Keep logs non-sensitive: no raw secrets, only masked metadata when needed.
- Remove the temporary verbose debug logs once the new auth path is in place.

3. Apply the fix everywhere the same auth path is used
- `supabase/functions/mindbody-services/index.ts`
- `supabase/functions/mindbody-classes/index.ts`
- `supabase/functions/mindbody-availability/index.ts`
This keeps the services page, class schedule, and booking availability aligned.

4. Make the website fail gracefully instead of feeling broken
- Update the client fetch/error handling so a vendor auth outage shows a clear “temporarily unavailable” state instead of a blank/broken experience.
- Keep the rest of the page usable even if Mindbody data is unavailable.

5. Validate after secrets are added
- Prompt for the two new runtime secrets first.
- Deploy the affected edge functions.
- Test `mindbody-services`, then verify `mindbody-classes` and `mindbody-availability`.
- If Mindbody still returns the same inactive-account error even with source credentials, we’ll know the remaining issue is fully upstream and can add a temporary static/fallback data path next.

Technical details
- Primary likely root cause: the current code only supports staff username/password auth, while your Mindbody setup likely now expects source credentials as part of business-data access.
- Existing OAuth files are unrelated to this specific failure; they handle client sign-in, not the staff token used for site/services/classes/availability reads.
- Files likely to change:
  - `supabase/functions/mindbody-services/index.ts`
  - `supabase/functions/mindbody-classes/index.ts`
  - `supabase/functions/mindbody-availability/index.ts`
  - `src/hooks/useMindbodyServices.ts`
  - any page/component currently showing a hard failure state for service loading
