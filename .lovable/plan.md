

# Pull Through Mindbody Descriptions for Classes/Experiences

## Problem
The Mindbody API already returns `description` for each class (from `ClassDescription.Description`), and it's already stored in the `MindbodyClass` interface. It's just never displayed in the UI.

## Changes

### `src/components/booking/ClassScheduleFlow.tsx`
1. **Next Available card** — show the class description below the class name (truncated to ~2 lines with `line-clamp-2`). Since all sessions for the same classDescriptionId share the same description, showing it on the first card is sufficient.
2. **Confirmation step** (when a class is selected, before booking) — show the full description in the details panel.
3. Strip HTML tags from the description (Mindbody often returns HTML) using a simple regex or DOMParser, consistent with the existing pattern noted in memory.

### Layout change (Next Available card)
```text
┌───────────────────────────────┐
│ Member's Suite                │
│ A relaxing communal wellness  │
│ experience featuring...       │  ← NEW: description
│ 📅 Mon, Apr 7  🕐 3:00 PM    │
│                    6 spots    │
└───────────────────────────────┘
```

### Helper
Add a small `stripHtml` utility inline (or reuse existing pattern) to clean HTML tags from description strings before rendering.

## Files
- `src/components/booking/ClassScheduleFlow.tsx` — display description on next-available card and confirmation view

