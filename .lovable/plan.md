

# Plan: Integrate Booking into /website

## Overview
Add a services/booking section to the marketing homepage (`/website`) so visitors can browse and book services directly, reusing the existing booking infrastructure (BookingDrawer, Mindbody services data, auth contexts).

## Current State
- `/website` (Index.tsx) renders: Navigation → Hero → Footer
- The app shell (`/`) has full booking: service browsing, BookingDrawer, Mindbody OAuth, availability, etc.
- BookingDrawer is a self-contained component that handles variant selection, calendar, time slots, and confirmation
- Services data comes from `useMindbodyServices` hook (fetches from edge function, no auth required)

## Changes

### 1. Add a Services Section to the Website Page
Create a new `WebsiteServices` component that displays grouped services in a style consistent with the marketing page aesthetic (not the mobile app style). This will:
- Fetch services via `useMindbodyServices` (already works without auth)
- Group and display them using the same grouping logic from `Services.tsx`
- Use the marketing page's design language (serif fonts, warm tones, `#F9ECD9`/`#3B2712` palette)
- Each service is clickable to open the BookingDrawer

### 2. Wire BookingDrawer into Index.tsx
- Import `BookingDrawer` and add state management (`bookingService`, `drawerOpen`) — same pattern as `AppShell.tsx`
- Pass `onSelectService` callback down to the new services section
- The drawer handles auth checks internally (prompts Mindbody login if needed)

### 3. Update Hero CTA
- The "Discover our experiences" button currently scrolls to `#most-popular` which doesn't exist on this page
- Update it to scroll to the new services section

### 4. Update Index.tsx Layout
```text
Navigation
Hero
WebsiteServices (new — services grid with booking)
Footer
```

### Technical Notes
- `BookingDrawer` depends on `AuthContext` and `MindbodyContext` — both are already provided at the App level wrapping all routes, so no additional provider setup needed
- The drawer uses `despia-native` for haptics but gracefully degrades on web
- No database or edge function changes required — all existing APIs work as-is

