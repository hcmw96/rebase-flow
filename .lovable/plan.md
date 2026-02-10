

## Booking Drawer

Replace the current full-page navigation (`/book/:serviceId`) with a bottom drawer that slides up when a service is tapped -- keeping the user in context on the Home or Services tab.

### How it works

- Tapping a service chip (Services tab) or popular service card (Home tab) opens a Drawer (using the existing Vaul-based `Drawer` component) containing the full booking flow (variant selection, date, time, confirm, success).
- The `/book/:serviceId` route is removed from the router.
- The drawer is managed via state in `AppShell`, which already orchestrates tab navigation.

### Technical steps

1. **Create `src/components/booking/BookingDrawer.tsx`**
   - A new component wrapping the Vaul `Drawer` from `src/components/ui/drawer.tsx`.
   - Accepts `open`, `onClose`, and service data (title, description, category, image, variants) as props.
   - Contains the same step-based booking logic currently in `BookService.tsx` (variant selection, date picker, time slots, confirmation, success) but rendered inside `DrawerContent`.
   - Drawer snaps to ~90% height for a near-full-screen feel on mobile.
   - On success, shows confirmation then closes on "Done" tap.

2. **Update `src/components/AppShell.tsx`**
   - Add state: `selectedBookingService` (the grouped service object) and a boolean to control the drawer.
   - Pass an `onSelectService` callback down to `HomePage` and `Services`.
   - Render `BookingDrawer` at the shell level so it overlays all tabs.

3. **Update `src/pages/HomePage.tsx`**
   - Replace `handleBookService` (which navigates to `/book/...`) with calling the new `onSelectService` prop.
   - Remove `useNavigate` and `localStorage.setItem` for booking.

4. **Update `src/pages/Services.tsx` and related components**
   - Pass `onSelectService` through `CategorySection` to `ServiceChip`.
   - `ServiceChip` calls the callback instead of navigating.
   - Remove `useNavigate` and `localStorage` usage from `ServiceChip`.

5. **Update `src/App.tsx`**
   - Remove the `/book/:serviceId` route.
   - `BookService.tsx` can be kept for reference but is no longer routed.

6. **Drawer UX details**
   - The drawer handle bar is visible for swipe-to-dismiss.
   - Back button within the drawer steps backward through the flow; on the first step it closes the drawer.
   - The bottom nav tabs remain visible underneath the overlay.
   - Press-scale micro-compression applies to buttons inside the drawer automatically (global CSS).

