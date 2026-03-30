

# Fix Mobile Menu Background

## Problem
The mobile hamburger menu has no solid background — the page content shows through behind the menu items.

## Change

**File: `src/components/Navigation.tsx`**

The mobile menu currently only styles the dropdown content area (line 212). When open, the entire nav needs a solid dark background. Two changes:

1. **Nav element** (line ~72): When `isOpen` on mobile, add a solid background like `bg-[#3B2712]` (the brand brown) so the full nav covers the screen content behind it.

2. **Mobile menu container** (line 212): Make the mobile menu take the full remaining viewport height (`min-h-[calc(100vh-3.5rem)]`) with `bg-[#3B2712]` so there's no see-through gap below the menu items.

This matches the screenshot reference where the menu has a solid dark brown background filling the screen.

