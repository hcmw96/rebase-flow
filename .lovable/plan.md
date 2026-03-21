

# Fix: Mindbody OAuth "Something went wrong" Error

## Problem
The Mindbody OAuth popup shows "OOPS! Something went wrong please try again later" on `signin.mindbodyonline.com/Error`. This is a Mindbody-side error, likely caused by an invalid `redirect_uri`.

The current `redirectUri` is set to `window.location.origin` (e.g. `https://id-preview--c536b9fb-8c1f-4fa2-810c-33c53bae7340.lovable.app`), but Mindbody OAuth requires `redirect_uri` to match exactly what's registered in the Mindbody developer portal. The preview URL changes and won't match.

Additionally, `response_mode: "form_post"` requires a server endpoint to receive the POST callback, but the redirect URI points to the client-side app root which can't handle form POST data.

## Solution

### 1. Create a callback edge function endpoint
The `redirect_uri` should point to the edge function `mindbody-oauth-callback` so the server receives the authorization code via form POST. Update:

**`supabase/functions/mindbody-oauth-init/index.ts`**
- Change `redirect_uri` to use the Supabase functions URL: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mindbody-oauth-callback`
- Remove the client-provided `redirectUri` parameter since the callback URL is server-determined

**`supabase/functions/mindbody-oauth-callback/index.ts`**
- Update to handle both `form_post` (POST with form data containing `code`) and the existing JSON POST from client
- After successful token exchange, redirect the popup to the app origin with session data as URL params, or use `postMessage` via an HTML response
- Return an HTML page that calls `window.opener.postMessage(...)` with the session data, then closes itself

**`src/contexts/MindbodyContext.tsx`**
- Remove `redirectUri` from the POST body to `mindbody-oauth-init`

### 2. Register the correct redirect URI in Mindbody
The user needs to register `https://ipmrdxtgrxvwzbrbiuvz.supabase.co/functions/v1/mindbody-oauth-callback` as an allowed redirect URI in their Mindbody developer portal.

### Files to modify
- `supabase/functions/mindbody-oauth-init/index.ts` — use server-side redirect URI
- `supabase/functions/mindbody-oauth-callback/index.ts` — handle form POST, return HTML with postMessage
- `src/contexts/MindbodyContext.tsx` — remove redirectUri from request body

