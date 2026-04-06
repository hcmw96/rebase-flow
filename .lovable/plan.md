

# Fix Hover Overlay to Cover Entire Card Photo

## Problem
The hover overlay on service cards uses `inset-px` (1px inset from edges) which leaves a tiny border visible around the edges. Combined with `justify-end`, the text content sits at the bottom while the top shows through to the dark photo — this looks like incomplete coverage.

## Fix
In `src/components/WebsiteServices.tsx` line 277, change `inset-px` to `inset-0` so the overlay covers the full card with no gap. This ensures the overlay sits flush with the card edges, fully covering the photo.

### Single line change
```
// Before
className="absolute inset-px rounded-lg backdrop-blur-sm flex-col justify-end p-5 ..."

// After  
className="absolute inset-0 rounded-lg backdrop-blur-sm flex-col justify-end p-5 ..."
```

## Files
- `src/components/WebsiteServices.tsx` — change `inset-px` → `inset-0` on the hover overlay div

