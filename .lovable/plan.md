
# Align and Fill Sauna Category Services

## Problem
When a category has only 2 services (like the Sauna category with "Infrared Sauna & Ice Bath" and "Premium Suite"), the chips are small (100px wide) and left-aligned, leaving lots of empty space. They should fill the available width evenly.

## Solution
Make the `CategorySection` and `ServiceChip` components responsive to the number of items -- when there are few services (2 or 3), chips expand to fill the row equally instead of staying at a fixed 100px width.

## Changes

### 1. `src/components/CategorySection.tsx`
- When `services.length <= 3`, switch from a horizontal scroll flex layout to a CSS grid that distributes items evenly across the full width.
- Use `grid-cols-2` for 2 items, `grid-cols-3` for 3 items.
- Keep the horizontal scroll behavior for 4+ items (current behavior).

### 2. `src/components/ServiceChip.tsx`
- Accept an optional `fillWidth` prop (boolean).
- When `fillWidth` is true, remove the fixed `w-[100px]` and `flex-shrink-0` classes so the chip fills its grid cell.
- This keeps the existing compact behavior for categories with many items.

## Technical Detail
In `CategorySection.tsx`, the render logic for the services container will branch:

```
if (services.length <= 3) {
  // Use grid layout: grid grid-cols-{n} gap-3
  // Pass fillWidth={true} to ServiceChip
} else {
  // Keep current horizontal scroll layout
  // Pass fillWidth={false} (default)
}
```

This ensures vertical alignment and equal sizing for small categories while preserving horizontal scrolling for larger ones.
