

# Fix: Header Scroll Shrink Not Working

## Problem
The scroll listener in `Navigation.tsx` uses `window.scrollY`, but on the marketing homepage (`Index.tsx`), the page uses a **fixed-position container** (`position: fixed; inset: 0; overflowY: auto`) for scrolling. The `window` itself never scrolls, so `scrollY` is always 0 and the header never transitions.

## Solution — `src/components/Navigation.tsx`

Update the scroll listener to also check for the fixed scrolling container used by the homepage. Query for the closest scrollable parent or the specific fixed container, and listen for its `scroll` event in addition to `window`.

Specifically:
1. In the scroll `useEffect`, find the scrollable container (`document.querySelector('[style*="position: fixed"]')` or the parent div with `overflow-y: auto`).
2. Attach the scroll listener to **both** `window` and the container element.
3. In the handler, check `window.scrollY || container.scrollTop > 20` to set `scrolled`.

### Files to modify
- `src/components/Navigation.tsx` — update the scroll `useEffect` (lines 42-47) to detect and listen on the fixed scrolling container.

