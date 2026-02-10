

# Authentication Setup: Dual Login System

## Overview
Set up a two-tier authentication system:
1. **App account** (email/password via Lovable Cloud auth) -- anyone can create one to browse services
2. **Mindbody link** -- required to actually book. Users connect their Mindbody account from within the app. If they don't have one, signing in with Mindbody creates their Mindbody account too.

## How it works for users

```text
+---------------------------+
|  New user opens app       |
|  Can browse freely        |
+------------+--------------+
             |
    Taps "Account" or "Bookings"
             |
+------------v--------------+
|  Sign up / Log in screen  |
|  Email + password          |
+------------+--------------+
             |
     Now has an app account
     Can browse, save prefs
             |
    Tries to book a service
             |
+------------v--------------+
|  "Connect Mindbody" prompt |
|  OAuth flow opens          |
+------------+--------------+
             |
   Mindbody token stored
   against their app profile
             |
+------------v--------------+
|  Can now book, view,       |
|  and cancel appointments   |
+----------------------------+
```

## Database Changes

### 1. Create `profiles` table
Stores app-level user data and optionally links to a Mindbody session.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | References auth.users(id) ON DELETE CASCADE |
| email | text | |
| first_name | text | nullable |
| last_name | text | nullable |
| mb_session_id | uuid | nullable, FK to mb_sessions(id) |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### 2. Auto-create profile trigger
A database trigger that creates a profile row automatically when a new user signs up.

### 3. RLS policies on `profiles`
- Users can read and update only their own profile
- Insert handled by trigger (service role)

## Frontend Changes

### 1. Auth context (`src/contexts/AuthContext.tsx`)
New context using Lovable Cloud (Supabase Auth) for email/password sign-up and login. Provides:
- `user`, `isAuthenticated`, `isLoading`
- `signUp(email, password, firstName, lastName)`
- `signIn(email, password)`
- `signOut()`
- `profile` (from profiles table, includes `mb_session_id`)

### 2. Auth pages
- **Sign In page**: Email + password form, link to sign up
- **Sign Up page**: First name, last name, email, password form, link to sign in

Both styled to match the warm cream aesthetic.

### 3. Update `MindbodyContext`
- Remove its standalone auth role -- it becomes a "Mindbody connection" utility only
- `login()` now links the Mindbody session to the current app user's profile (sets `mb_session_id`)
- `isMindbodyLinked` derived from profile's `mb_session_id`
- Booking hooks check `isMindbodyLinked` instead of `isAuthenticated`

### 4. Update `AccountPage`
- When logged out: show Sign In / Sign Up
- When logged in but no Mindbody link: show profile info + "Connect Mindbody" button
- When fully linked: show profile info + Mindbody status + Sign Out

### 5. Update `MyBookings`
- When not logged in: prompt to sign in
- When logged in but no Mindbody: prompt to connect Mindbody to view bookings
- When fully linked: show bookings as before

### 6. Update `BookingDrawer`
- Confirm step: if not logged in, prompt sign in
- If logged in but no Mindbody link, prompt to connect Mindbody
- If fully linked, proceed with booking

### 7. Update `AppShell` / `App.tsx`
- Wrap with new `AuthProvider`
- Keep `MindbodyProvider` nested inside

### 8. Update `HomePage`
- "My Bookings" card: adapt to new auth states

## Technical Details

### Auth flow (email/password)
```typescript
// Sign up
const { error } = await supabase.auth.signUp({
  email, password,
  options: { data: { first_name, last_name } }
});

// Sign in  
const { error } = await supabase.auth.signInWithPassword({ email, password });
```

### Mindbody linking flow
When user taps "Connect Mindbody":
1. Mindbody OAuth opens (existing flow)
2. On callback, the edge function returns session data
3. Frontend updates the user's `profiles.mb_session_id` with the returned session ID
4. Profile context refreshes, `isMindbodyLinked` becomes true

### Edge function updates
- `mindbody-oauth-callback`: No changes needed (already creates/updates mb_sessions)
- Booking/cancel/my-bookings functions: No changes needed (already use sessionId)

### Files to create
- `src/contexts/AuthContext.tsx` -- new auth provider
- `src/pages/SignIn.tsx` -- sign in form
- `src/pages/SignUp.tsx` -- sign up form

### Files to modify
- `src/App.tsx` -- add AuthProvider, add sign-in/sign-up routes
- `src/components/AppShell.tsx` -- gate bookings/account tabs behind auth
- `src/contexts/MindbodyContext.tsx` -- refactor to link-only role
- `src/pages/AccountPage.tsx` -- three-state UI
- `src/pages/MyBookings.tsx` -- two-state gating
- `src/components/booking/BookingDrawer.tsx` -- auth + MB link checks
- `src/pages/HomePage.tsx` -- adapt bookings card
- Database migration: create profiles table + trigger + RLS

