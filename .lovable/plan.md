

# Reorder IV Drips & Update NAD+ Image

## Changes

### 1. Add within-category ordering for IV Drips
**File: `src/components/WebsiteServices.tsx`**
- Add a `serviceOrderWithinCategory` map that defines explicit ordering for services within specific categories
- For IV Drips: `IV Drip` → 0, `Blood Test` → 1, `NAD+` → 2 (remaining services like Vitamin Shot get pushed after)
- In `servicesByCategory`, sort services within each category using this map before returning

### 2. Update NAD+ image
**File: `src/components/WebsiteServices.tsx`**
- Change `'NAD+': '/images/rebase-suite.webp'` → `'NAD+': '/images/rebase-iv-drip.jpg'` in the `serviceImages` map (same image as IV Drip)

