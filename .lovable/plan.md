

# Fix: Overlay Background & Shorter Description Text

## Problem
Two issues with the service card overlay:
1. `bg-[hsl(25,15%,12%)]/95` doesn't work — Tailwind can't apply opacity modifiers to arbitrary HSL values, so the background is transparent and text is unreadable.
2. Description text is too long.

## Solution — `src/components/WebsiteServices.tsx`

### 1. Fix overlay background (line 307)
Replace `bg-[hsl(25,15%,12%)]/95` with inline style `backgroundColor: 'hsla(25,15%,12%,0.95)'` or use the Tailwind-compatible syntax `bg-[hsla(25,15%,12%,0.95)]`.

### 2. Shorten description text (line 314)
Change `line-clamp-3` to `line-clamp-2` and reduce font size to `text-xs` for a more compact overlay.

### Files to modify
- `src/components/WebsiteServices.tsx` — lines 306-316, fix bg color and shorten text clamp

