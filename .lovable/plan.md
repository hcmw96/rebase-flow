

# Fix: Service Cards Not Opening Booking Drawer on Click

## Problem
The service cards require a two-step interaction: first click to reveal an overlay, then click "Book Now" inside the overlay. On desktop, hover reveals the overlay but clicking the card toggles it away. This makes it feel broken — users expect clicking a service card to open the booking drawer directly.

## Solution
Make clicking the service card directly open the booking drawer (call `handleClick`), and keep the hover overlay as a visual enhancement on desktop only. Remove the `expandedService` toggle-on-click behavior.

### Changes to `src/components/WebsiteServices.tsx`

1. **Remove `expandedService` state** — no longer needed
2. **Change `<motion.button>` onClick** to directly call `handleClick(service)` instead of toggling `expandedService`
3. **Remove mobile tap-to-expand logic** — the overlay becomes hover-only (desktop), and on mobile the card click goes straight to the drawer
4. **Simplify overlay CSS** — remove `isExpanded ? 'translate-y-0' : 'translate-y-full'` conditional; keep only `sm:group-hover:translate-y-0` for desktop hover effect
5. **Keep "Book Now" button** in overlay as a secondary click target (still calls `handleClick` with `stopPropagation`)

### Result
- **Desktop**: Hover shows overlay with description + "Book Now"; clicking anywhere on the card opens the drawer
- **Mobile**: Tapping the card opens the drawer immediately (no intermediate overlay step)

