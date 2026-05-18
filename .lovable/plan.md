## Goal
Eliminate the blank white screen Apple reviewers see when the Mindbody OAuth login redirect happens on native (Despia) — and ensure the return trip to the app also paints something immediately, before React boots.

## Scope (what actually triggers a redirect)
Only one place in the app navigates externally:
- `src/contexts/AuthContext.tsx` → native branch does `window.location.href = data.authUrl` (Mindbody login).
- The return trip is `https://rebase.echo.london/#auth-session=…` served by `index.html` (React then parses the hash). Booking itself is fully in-app via Supabase edge functions — no external redirect there, so no overlay needed for booking actions.

So we need a fix on **two surfaces**:
1. The outbound transition (tap "Sign in" → Mindbody loads).
2. The inbound transition (Mindbody → app reloads with hash → before React mounts).

## Changes

### 1. Branded full-screen loading overlay component
Create `src/components/AuthRedirectOverlay.tsx`:
- Fixed inset-0, z-[9999], background `#0A0A0A`, white Rebase wordmark centred, subtle spinner below.
- Uses the existing Rebase logo asset already in the app (re-use whatever `Navigation`/`Footer` uses).
- Tailwind only, no new deps.

### 2. Show overlay in `AuthContext.login()`
- Add `isRedirecting` state to `AuthContext` and expose it via the provider value.
- Set `isRedirecting = true` immediately when `login()` is called (before the `fetch` to `mindbody-oauth-init`, so the screen covers the network round-trip too).
- Keep it true through `window.location.href = data.authUrl` (the page will unload while showing the overlay — no white flash).
- On the web popup branch, also flip it on briefly then off once popup opens, so desktop users get the same affordance.
- Reset it in the `catch` block on error.

### 3. Render the overlay at app root
In `src/App.tsx` (or wherever `AuthProvider` wraps children), add `{isRedirecting && <AuthRedirectOverlay />}` so it sits above all routes.

### 4. Inbound: pre-React HTML loader in `index.html`
Add a tiny inline `<style>` + `<div id="boot-loader">` inside `<body>` *before* the React root div, using the exact CSS from the brief (dark `#0a0a0a` bg, 40px teal-rimmed spinner, centred). Add a one-line inline script in `<head>` that only shows the loader when the URL contains `#auth-session=` or `#auth-error=` (so normal cold starts still show the existing app shell, not a generic spinner).

Then in `src/main.tsx` (or `AuthContext` after it parses the hash), remove the `#boot-loader` element once React has mounted and the hash has been consumed.

This means: when Mindbody redirects back to the app, the browser repaints instantly with the spinner from raw HTML — no white screen — and it disappears the moment AuthContext has stored the session and React renders the home screen.

### 5. (No /native-callback route needed)
The native callback is handled server-side by the edge function which 302s back to `/#auth-session=…`. The pre-React HTML loader in step 4 covers that landing.

## Files touched
- `src/components/AuthRedirectOverlay.tsx` (new)
- `src/contexts/AuthContext.tsx` (add `isRedirecting` + setter calls)
- `src/App.tsx` (render overlay at root, inside `AuthProvider`)
- `index.html` (inline spinner + conditional show script)
- `src/main.tsx` (remove `#boot-loader` after mount)

## Out of scope
- Booking flow (no external redirect exists).
- Apple Sign In / social auth (confirmed absent last turn).
- Any visual change to existing screens; the overlay is additive only.