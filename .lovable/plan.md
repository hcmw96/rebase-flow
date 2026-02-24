

## Redesign Non-Image Services as Compact List Rows

### Problem
Services without images (General, Massage Therapy, IV Drip, etc.) are displayed as 100px-wide text-only chips in a horizontal scroll. On mobile, this looks messy -- floating text with no visual container, hard to read, and awkward to scroll through.

### Solution
Switch non-image service categories from horizontal scroll chips to a **vertical list of compact rows**. Each row spans full width with a subtle background, showing the service name, duration, and price in a clean, scannable layout. Tech therapy categories (with images) keep their current chip/grid layout.

### Layout Comparison

**Before (current):**
Horizontal scroll of tiny 100px text blocks -- no background, hard to tap, text gets truncated.

**After (proposed):**
Full-width rows stacked vertically, each with:
- Service name (left-aligned)
- Duration badge (inline)
- Price (right-aligned)
- Subtle background and border for visual structure
- Chevron or tap affordance

### Technical Details

**File: `src/components/CategorySection.tsx`**
- Check if services in the category are non-tech (all have `hideImage`)
- If so, render a vertical list of row items instead of chips/scroll
- Each row: full-width button with `flex items-center justify-between`, subtle `bg-black/[0.03]` background, rounded corners

**File: `src/components/ServiceChip.tsx`**
- Add a `listMode` prop (or reuse `hideImage` + `fillWidth` combination)
- When in list mode, render as a horizontal row: name on left, duration + price on right
- Proper padding, tap target size (min 44px height), and visual affordance

**File: `src/widget/components/CategorySection.tsx`** and **`src/widget/components/ServiceChip.tsx`**
- Mirror the same changes for the widget version

### Row Design
```
+--------------------------------------------------+
|  Acupuncture Initial Consultation    60 min  £120 |
+--------------------------------------------------+
|  Acupuncture Follow Up               60 min   £95 |
+--------------------------------------------------+
```

- Background: `bg-black/[0.03]` with `rounded-lg`
- Padding: `px-4 py-3`
- Name: `text-sm font-medium text-black/70`
- Duration: `text-xs text-black/40` with clock icon
- Price: `text-sm font-semibold text-black/70` right-aligned
- Gap between rows: `gap-2`
- Variant count shown as subtle subtext if multiple options exist

### Files to modify
- `src/components/ServiceChip.tsx` -- add list row rendering mode
- `src/components/CategorySection.tsx` -- use vertical list for non-tech categories
- `src/widget/components/ServiceChip.tsx` -- same for widget
- `src/widget/components/CategorySection.tsx` -- same for widget
