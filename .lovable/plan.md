

# Book Now → Scroll to Experiences

## Problem
Both desktop and mobile "Book Now" buttons link to `/book` (an auth page). On the `/website` page, they should scroll to the services/experiences section instead.

## Changes

**File: `src/components/Navigation.tsx`**

Replace both "Book Now" `<Link to="/book">` instances (desktop ~line 171, mobile ~line 285) with anchor buttons that:
1. Check if already on `/website` — if so, smooth-scroll to the `#services` section
2. If on another page, navigate to `/website#services`
3. Close the mobile menu on click

