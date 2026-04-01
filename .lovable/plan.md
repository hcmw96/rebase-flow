

# Replace Dual Auth with Mindbody-Only OAuth Login

## Problem
Users currently must create a separate email/password account (Supabase Auth), then additionally link their Mindbody account via OAuth before they can book. This is friction-heavy. Users should log in once with their Mindbody account and immediately be able to book.

## Architecture Change

Remove Supabase email/password auth entirely. Mindbody OAuth becomes the sole authentication method. The `mb_sessions` table already stores everything needed (user info, tokens). No Supabase Auth session is needed.

```text
Current:  SignUp/SignIn → Supabase Auth → Link Mindbody → Book
New:      "Sign in with Mindbody" → OAuth popup → mb_session → Book
```

## Changes

### 1. Merge AuthContext + MindbodyContext → single AuthContext
**File: `src/contexts/AuthContext.tsx`** (rewrite)

- Remove all Supabase Auth calls (signUp, signIn, signOut, onAuthStateChange)
- State: `mbSession` (from localStorage), `isAuthenticated = !!mbSession`
- `login()`: calls `mindbody-oauth-init` edge function → opens popup → listens for `postMessage` callback → stores session in localStorage + state
- `logout()`: clears localStorage + state
- Expose: `mbSession`, `isAuthenticated`, `isLoading`, `login`, `logout`
- Profile info comes from `mbSession` (firstName, lastName, email)

### 2. Remove MindbodyContext
**File: `src/contexts/MindbodyContext.tsx`** — delete (all consumers switch to new AuthContext)

### 3. Simplify AuthPage
**File: `src/pages/AuthPage.tsx`**

- Remove SignIn/SignUp form toggle
- Show logo + single "Sign in with Mindbody" button over the video background
- Button calls `login()` from AuthContext

### 4. Remove SignIn.tsx and SignUp.tsx
No longer needed — auth is a single OAuth button.

### 5. Update AppShell
**File: `src/components/AppShell.tsx`**

- Import from new AuthContext only (no MindbodyContext)
- `isAuthenticated` check stays the same

### 6. Update BookingDrawer
**File: `src/components/booking/BookingDrawer.tsx`**

- Import from AuthContext instead of both contexts
- Remove `isMindbodyLinked` / `linkMindbody` checks — user is always linked if authenticated
- `handleConfirmBooking`: just check `mbSession` exists (it always will if logged in)

### 7. Update AccountPage
**File: `src/pages/AccountPage.tsx`**

- Remove Mindbody link section (always linked)
- Profile info from `mbSession` (firstName, lastName, email)
- Remove SignIn/SignUp imports
- If not authenticated, show a "Sign in" button that calls `login()`

### 8. Update useMindbodyBookings hook
**File: `src/hooks/useMindbodyBookings.ts`**

- Import from new AuthContext instead of MindbodyContext
- `mbSession` comes from AuthContext now

### 9. Update MyBookings page
**File: `src/pages/MyBookings.tsx`** — update imports from MindbodyContext → AuthContext

### 10. Update App.tsx
**File: `src/App.tsx`**

- Remove `MindbodyProvider` wrapper
- Keep `AuthProvider` (now the merged one)

### 11. No database changes needed
- `mb_sessions` table already has everything
- `profiles` table becomes unused (can keep for now, no harm)
- Edge functions (`mindbody-oauth-init`, `mindbody-oauth-callback`) stay as-is

## Key Detail
The new AuthContext `login()` reuses the exact same OAuth popup flow currently in MindbodyContext's `linkMindbody()` — just promoted to be the primary auth mechanism instead of a secondary linking step.

