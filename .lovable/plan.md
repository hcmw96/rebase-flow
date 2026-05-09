## Diagnosis

Mindbody's error `User token site id does not match requested site` means the OAuth access token's `site_ids` claim doesn't include `57361889` (the SiteId we send on the booking call).

`MINDBODY_SITE_ID` and the OAuth client are both unchanged since September, so the env values are correct. The most likely culprit is in **`mindbody-oauth-callback`**: the `/connect/token` exchange does **not** pass `subscriber_id`. With Mindbody's consumer OAuth, the authorize step accepts `subscriber_id` as a *hint*, but the issued token's site claim is determined at token exchange. Without `subscriber_id` on `/connect/token`, the token gets bound to the OAuth app's default site — not necessarily 57361889 — which is exactly what produces this error.

A second contributing factor: the existing `mb_sessions` row for your account still holds that old, wrongly-scoped access token, so even after a fresh "login" the upserted refresh token may have been carrying the wrong site since day one.

## Plan

### 1. Fix the OAuth token exchange
In `supabase/functions/mindbody-oauth-callback/index.ts`, add `subscriber_id` (= `MINDBODY_SITE_ID`) to the body of the `POST https://signin.mindbodyonline.com/connect/token` request, alongside the existing `grant_type`, `code`, `redirect_uri`, `client_id`, `client_secret`. This binds the issued access + refresh tokens to site `57361889`.

### 2. Add diagnostic logging to confirm the fix
In `supabase/functions/mindbody-book/index.ts`, before the Mindbody fetch:
- Decode the JWT payload of `session.access_token` and `console.log` the `site_ids` (or equivalent) claim alongside the env `siteId`.
- On a non-OK response, log the raw response body, not just `Error.Message`.

This gives us a single edge-log line that proves the token now carries `57361889`.

### 3. Force a clean session
The currently saved row in `mb_sessions` still has the bad token. Two options, both small:
- Delete your `mb_sessions` row (one-line SQL) so the next login creates a brand-new session bound to the correct site, **or**
- Clear all rows in `mb_sessions` since this bug would have affected every user.

Recommended: clear all rows — every existing session is poisoned by the same root cause.

### 4. UX safety net
In `BookingDrawer` and `ClassScheduleFlow`, when the booking error message contains `"site id does not match"` or `"Session not found"`, automatically call `logout()` and re-prompt sign-in instead of leaving the toast alone. Prevents future "stuck" states if a token ever drifts.

### 5. Deploy and re-test
After step 1, redeploy `mindbody-oauth-callback` and `mindbody-book`. You log in again, then try booking the Members Suite. Diagnostic logs from step 2 will confirm the token's `site_ids` is `57361889` and the booking should succeed.

## Out of scope
- No schema changes to `mb_sessions`.
- No changes to OAuth init (`subscriber_id` is already passed correctly there).
- No changes to pricing, services config, or unrelated flows.
