

# Add "Explore" Drawers to Experiences Page

## Problem
Each experience card on `/experiences` has a "Book Now" button linking to `/website#services`. The user wants the CTA to say "Explore" and open a dedicated drawer showing the services within that category.

## Approach
Create an `ExperienceDrawer` component — a full-screen drawer (matching existing drawer UX patterns) that opens when "Explore" is clicked. It shows the services belonging to that category, pulled from the same Mindbody data and `serviceConfig` logic used by `WebsiteServices`. Each service inside the drawer can then open the existing `BookingDrawer`.

## Changes

### 1. Create `src/components/ExperienceDrawer.tsx`
A new drawer component that:
- Accepts a category name, image, and description
- Uses `useMindbodyServices` + the same grouping/filtering logic from `serviceConfig` to list services in that category
- Shows each service as a card with name, short description, price, and a "Book Now" button
- For "Signature Classes", shows the `classOfferings` cards instead
- Clicking a service opens the existing `BookingDrawer`
- Full-screen `h-[100dvh]` drawer matching the existing booking drawer aesthetic (dark theme, cream text, `hideHandle`)
- Hero image at top (reuses the experience card image), back/close buttons overlaid

### 2. Update `src/pages/Experiences.tsx`
- Add state for which experience is selected and drawer open/closed
- Change button text from "Book Now" to "Explore"
- On click, open `ExperienceDrawer` with the category data instead of navigating away
- Include a nested `BookingDrawer` for when a user selects a specific service from inside the explore drawer

### Technical detail
- The experience `name` values in `Experiences.tsx` already match `categoryOrder` names from `serviceConfig.ts` (e.g. "Communal Members Suite", "Signature Classes", "Private Suites"), so category filtering is straightforward
- Service grouping logic will be extracted/shared from `WebsiteServices` into a reusable hook or utility to avoid duplication
- The drawer will show a loading skeleton while Mindbody data loads, and a "temporarily unavailable" fallback if the API is down

