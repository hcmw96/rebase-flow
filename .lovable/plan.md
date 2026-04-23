
## Make the class sign-in prompt clickable

The “Please sign in to book this class.” message in the class confirmation step is currently plain text, while the disabled “Confirm Booking” button sits beneath it. I’ll make the sign-in prompt directly launch the existing Mindbody login flow.

### Change

**`src/components/booking/ClassScheduleFlow.tsx`**

Update the auth hook usage:

```ts
const { mbSession, isAuthenticated, login } = useAuth();
```

Replace the non-clickable paragraph with a button-style text control:

```tsx
{!isAuthenticated && (
  <button
    type="button"
    onClick={login}
    className="w-full text-sm text-muted-foreground text-center underline underline-offset-4 hover:text-foreground transition-colors"
  >
    Please sign in to book this class.
  </button>
)}
```

### Result

- Clicking “Please sign in to book this class.” opens the existing Mindbody sign-in flow.
- The existing booking behavior stays safe: “Confirm Booking” remains disabled until the user is signed in.
- This affects the class booking confirmation step shown in the screenshot, including Members Suite / Communal Contrast class-style bookings.

### Optional polish included

To make the action clearer, I’ll also add accessible button semantics and hover/focus styling so it behaves like a real clickable control without changing the visual layout.
