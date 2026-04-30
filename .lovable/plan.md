## Fix

When a user isn't signed in, the **Confirm Booking** button on the class confirmation step (Member's Suite, Signature Classes, etc.) is currently disabled, with a separate "Please sign in to book this class" link below. Per your request, the button itself should be active and route the user into the sign-in flow.

### Change

In `src/components/booking/ClassScheduleFlow.tsx` (confirmation step, ~lines 169–194):

1. **Remove** the standalone "Please sign in to book this class" underline link.
2. **Re-wire** the Confirm Booking button:
   - `disabled` only when `bookMutation.isPending` (drop the `!isAuthenticated` guard).
   - `onClick` becomes `isAuthenticated ? handleBook : login`.
   - Label switches: `Booking…` → `Confirm Booking` (signed in) → `Sign In to Book` (signed out).

The existing `login` function already triggers the Mindbody OAuth flow used elsewhere in the app, so signed-out users land in sign-in with one tap.

### Files

- `src/components/booking/ClassScheduleFlow.tsx`
