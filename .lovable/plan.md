

# Rebase Booking App -- Mobile-First Redesign

## The Big Picture
Strip away the website pages (Home, About, Contact, etc.) and transform this into a **dedicated booking app**. Think of it like the Uber or ClassPass experience: open the app, see what's available, tap to book. No marketing fluff, no scrolling through hero videos.

## Design Philosophy
- **3-tap booking**: See services, pick a time, confirm. Done.
- **Mobile-first**: Designed for phones. Desktop works but isn't the priority.
- **Don't overwhelm**: Show popular/recommended services first, tuck the full catalogue behind a "Browse All" option.
- **Familiar patterns**: Bottom tab navigation (like any modern app), pull-to-refresh, smooth transitions.

---

## App Structure (4 tabs)

```text
+----------+----------+----------+----------+
|   Home   | Services | Bookings | Account  |
+----------+----------+----------+----------+
```

### Tab 1: Home (default landing)
- Greeting: "Hi [Name]" (if logged in) or "Welcome to Rebase"
- **Quick Rebook**: If they've booked before, show their most recent service as a 1-tap rebook card
- **Popular Services**: 3-4 curated cards (from the existing featured_services table) -- large, tappable, with image + price + "Book" button
- **Next Appointment**: If they have an upcoming booking, show a prominent card with date/time and "Manage" link
- Minimal, clean, no scrolling walls of content

### Tab 2: Services (Browse All)
- Search bar at top
- Collapsible category sections (reuse existing pattern) with horizontal-scroll service chips
- Tapping a service goes straight to the booking flow (variant selection if needed, then date, then time, then confirm)
- This is essentially the current Services page, but without Navigation/Footer chrome

### Tab 3: Bookings
- The current MyBookings page, but redesigned for the app layout
- Upcoming bookings shown prominently with cancel option
- Past bookings collapsed below
- If not logged in: show a friendly "Log in to see your bookings" prompt

### Tab 4: Account
- Login/logout (Mindbody OAuth)
- User name and email display
- Link to the main Rebase website (for About, Contact, etc.)
- Simple and clean

---

## Booking Flow (unchanged logic, better UX)
The existing booking flow (BookService.tsx) already works well. We'll keep the same step logic but:
- Remove Navigation/Footer wrappers
- Make it truly full-screen on mobile with a slim top bar (back arrow + service name)
- Keep the step indicator but make it more compact
- Confirmation screen gets a "Back to Home" button instead of "Back to Services"

---

## What Gets Removed
These pages/components become unused (we won't delete them, just remove from routing):
- `Index.tsx` (hero + about section -- that's the website)
- `About.tsx`, `Contact.tsx`, `IceSauna.tsx` (website content)
- `Book.tsx` (the old static booking page with hardcoded services)
- `Hero.tsx`, `AboutSection.tsx`, `MissionVision.tsx` (website components)
- `Navigation.tsx` (replaced by bottom tab bar)
- `Footer.tsx` (not needed in an app)
- `Dashboard.tsx`, `Reception.tsx` (admin tools, can be re-added later)
- `Login.tsx`, `Signup.tsx` (replaced by in-app account tab)

## What Gets Kept & Reused
- `MindbodyContext` (auth system -- works perfectly)
- `useMindbodyServices`, `useMindbodyAvailability`, `useMindbodyBookings` (all data hooks)
- `BookService.tsx` flow (variant select, date, time, confirm -- just re-wrapped)
- `CategorySection`, `ServiceChip` patterns (for the Services tab)
- `FeaturedServices` concept (for the Home tab popular section)
- All edge functions (untouched)
- All Mindbody integration logic (untouched)
- The dark luxury theme/design tokens (kept as-is)

---

## New Components to Build

### 1. `AppShell.tsx` -- The main layout
- Bottom tab bar with 4 tabs (Home, Services, Bookings, Account)
- Icons: Home, Search/Grid, Calendar, User
- Active tab highlighted
- Content area above the tab bar
- Safe area padding for mobile (notch, home indicator)

### 2. `HomePage.tsx` -- Tab 1
- Greeting section
- "Your Next Appointment" card (if any upcoming booking)
- "Quick Rebook" section (last booked service)
- "Popular" section (3-4 featured service cards, larger than current chips)

### 3. `AccountPage.tsx` -- Tab 4
- Login prompt (if not authenticated) with Mindbody OAuth button
- Profile info (name, email) when logged in
- Logout button
- "Visit rebase.co.uk" link

### 4. Updated routing in `App.tsx`
- `/` renders the AppShell (with tabs)
- `/book/:serviceId` renders the booking flow (full-screen, no tabs)
- Everything else removed or redirected to `/`

---

## Technical Details

### Files to create:
1. **`src/components/AppShell.tsx`** -- Bottom tab navigation + content area
2. **`src/pages/HomePage.tsx`** -- Home tab content
3. **`src/pages/AccountPage.tsx`** -- Account tab content

### Files to modify:
1. **`src/App.tsx`** -- Simplify routes: `/` = AppShell, `/book/:serviceId` = BookService
2. **`src/pages/Services.tsx`** -- Remove Navigation/Footer wrappers, remove edit mode (admin feature), keep search + category sections
3. **`src/pages/MyBookings.tsx`** -- Remove Navigation/Footer wrappers, adapt for tab layout
4. **`src/pages/BookService.tsx`** -- Remove Navigation/Footer, add slim mobile header with back button, navigate to `/` instead of `/services` on completion
5. **`src/components/ServiceChip.tsx`** -- No changes needed (already compact and mobile-friendly)
6. **`src/components/CategorySection.tsx`** -- No changes needed

### Files that become unused (removed from routes, not deleted):
- `src/pages/Index.tsx`, `About.tsx`, `Contact.tsx`, `IceSauna.tsx`, `Book.tsx`
- `src/pages/Login.tsx`, `Signup.tsx`, `Dashboard.tsx`, `Reception.tsx`
- `src/components/Hero.tsx`, `AboutSection.tsx`, `Navigation.tsx`, `Footer.tsx`

### Bottom Tab Bar Design:
- Fixed to bottom of viewport
- 4 equal-width tabs with icon + label
- Active tab uses the `--primary` color (warm cream)
- Subtle top border
- `pb-safe` padding for iOS home indicator
- Height: ~64px + safe area

### Home Page "Popular Services" Cards:
- Larger than chips (~full width, stacked vertically)
- Service image as background with gradient overlay
- Service name, "From X", and "Book" button
- Max 4 shown, pulled from `featured_services` table

### Transitions:
- Tab switches: simple fade (no heavy animations)
- Booking flow entry: slide up from bottom
- Keep existing framer-motion animations within booking steps

