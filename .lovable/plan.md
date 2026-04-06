

# Show Account Page When Clicking "Members" on Website

## What
When a logged-in user clicks the "Members" button in the website navigation, show the Account page within the website layout (with Navigation + Footer) instead of navigating to the mobile app shell. If not logged in, trigger the Mindbody OAuth login flow.

## Changes

### 1. New route: `/account` in `src/App.tsx`
Add a new route for `/account` that renders a new wrapper page.

### 2. New page: `src/pages/WebsiteAccount.tsx`
A website-context wrapper that:
- Uses `Navigation` and `Footer` (matching the `/website` and `/membership` pages)
- Checks Mindbody auth via `useAuth()`
- If authenticated: renders `AccountPage` content inside the website layout
- If not authenticated: triggers the Mindbody OAuth login (`login()` from AuthContext)

### 3. Update Navigation "Members" button
In `src/components/Navigation.tsx`, change the "Members" button `Link` from `/login` to `/account`. Both desktop and mobile versions.

## Files modified
- `src/App.tsx` — add `/account` route
- `src/pages/WebsiteAccount.tsx` — new wrapper page
- `src/components/Navigation.tsx` — update Members link to `/account`

