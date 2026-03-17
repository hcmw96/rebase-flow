

# Plan: Replace HoverCard with Click-to-Reveal Slide-Up on Service Cards

## Problem
HoverCard doesn't work on mobile (no hover). The full description overlay blocks the card beneath it as shown in the screenshot.

## Solution
Replace the `HoverCard` wrapper with a click-to-expand interaction built into each card. First tap expands the card: the text panel slides up over the image, showing a short description and a "Book" button. Second tap (the Book button) triggers `handleClick`. Tapping outside or tapping again collapses it.

### File: `src/components/WebsiteServices.tsx`

1. **Remove** `HoverCard`, `HoverCardTrigger`, `HoverCardContent` imports and usage
2. **Add** `expandedService` state (`useState<string | null>(null)`) to track which card is expanded
3. **Replace** the card rendering with a two-state card:
   - **Collapsed (default)**: Shows image + title + price/duration row (same as now, minus the clipped description paragraph to keep it clean)
   - **Expanded (clicked)**: An overlay panel slides up from the bottom of the card covering ~70% of the image, containing:
     - Service name
     - Short description (3-4 lines max via `line-clamp-4`)
     - Price + duration
     - A "Book Now" button that calls `handleClick(service)`
4. **Click logic**: 
   - First click on a card sets `expandedService` to that service name (expands it)
   - Clicking the "Book Now" button calls `handleClick`
   - Clicking the card again (or another card) collapses it
5. **On desktop** (`sm:` and up): Keep the hover effect via CSS — the overlay slides up on hover automatically using `group-hover:translate-y-0`, no click state needed. This replaces the HoverCard cleanly.
6. **Animation**: Use CSS transitions (`transition-transform duration-300`) on the overlay panel's `translateY` — starts at `translate-y-full`, moves to `translate-y-0` when active.

### Single file change: `src/components/WebsiteServices.tsx`

