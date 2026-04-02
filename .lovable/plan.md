

# Fix Mindbody Login for Native Despia (TestFlight)

## Problem
The current login flow uses `window.open()` to open a popup for Mindbody OAuth, then relies on `window.opener.postMessage()` to pass session data back. In the Despia native WebView (iOS WKWebView), `window.open()` is blocked or returns `null`, so tapping "Sign in with Mindbody" does nothing.

## Solution
Detect the native environment and use a **redirect-based flow** instead of a popup. In native mode, navigate the full page to Mindbody's auth URL. After authentication, the callback edge function redirects back to the app with session data encoded in the URL fragment.

## Changes

### 1. `supabase/functions/mindbody-oauth-init/index.ts`
- Accept an optional `native` flag in the request body
- When native, store a `native=true` marker in the `state` parameter so the callback knows to redirect instead of postMessage

### 2. `supabase/functions/mindbody-oauth-callback/index.ts`
- Parse the `state` parameter to detect native flow
- When native: instead of returning HTML with `window.opener.postMessage`, return a **302 redirect** to the app origin with session data Base64-encoded in the URL hash fragment (e.g., `https://app-url/#auth-session=BASE64_JSON`)
- When not native: keep existing popup/postMessage behavior unchanged

### 3. `src/contexts/AuthContext.tsx`
- In the `login` function, detect native via `navigator.userAgent.includes('despia')`
- When native: navigate the current page (`window.location.href = authUrl`) instead of `window.open()`
- Add a `useEffect` that checks `window.location.hash` on mount for `#auth-session=...`, decodes the session, saves to localStorage, clears the hash, and sets the session state

### 4. `supabase/functions/mindbody-oauth-init/index.ts` (additional)
- Accept an optional `origin` parameter from the client so the callback knows where to redirect back to in native mode

## Flow Comparison

```text
Current (web/popup):
  App -> window.open(authUrl) -> Mindbody login -> form_post to callback
  -> callback returns HTML -> window.opener.postMessage(session) -> popup closes

Native (redirect):
  App -> window.location.href = authUrl -> Mindbody login -> form_post to callback
  -> callback returns 302 redirect to app#auth-session=BASE64 -> app reads hash on load
```

## Files modified
- `supabase/functions/mindbody-oauth-init/index.ts`
- `supabase/functions/mindbody-oauth-callback/index.ts`
- `src/contexts/AuthContext.tsx`

