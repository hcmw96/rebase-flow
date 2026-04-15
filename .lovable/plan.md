

# Debug Mindbody "Inactive Account" Error

## Problem
The Mindbody API returns `"Your account is inactive"` when requesting a staff token. The password was updated but the error persists, suggesting the issue is with the **API key**, **username**, or **site ID** — not the password.

## Root Cause Hypothesis
From the screenshot, there are two API keys ("Rebase" and "Leopold") and source credentials ("EchoLondon"). The stored `MINDBODY_API_KEY` may not match the correct key for the staff account, or the `MINDBODY_STAFF_USERNAME` may be mismatched.

## Plan

### 1. Add diagnostic logging to the edge function
Update `mindbody-services/index.ts` to log **non-sensitive metadata** when the token request fails:
- Length of API key, first 4 chars
- Length of username (not the value)
- Site ID value
- The full error response body from Mindbody

This will help pinpoint which credential is wrong without exposing secrets.

### 2. User action required
After deploying, we test the function and check logs to see which credentials are being sent. Then update whichever secret is mismatched:
- `MINDBODY_API_KEY` — should match the visible "Rebase" key (`73477ac9290346e98e47e7322207f27f`)
- `MINDBODY_STAFF_USERNAME` — confirm the exact value
- `MINDBODY_SITE_ID` — confirm the exact value

### Technical detail
The only code change is adding 4 `console.log` lines to `getStaffToken()` before the fetch call, logging credential metadata (lengths/prefixes only). This is a temporary diagnostic — once fixed, these lines can be removed.

One file modified: `supabase/functions/mindbody-services/index.ts`

