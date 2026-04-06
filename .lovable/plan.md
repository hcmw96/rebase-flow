

# Show Next Available Session with Expandable Dropdown

## Problem
The class schedule list shows all sessions for the next 7 days in a long scrollable list. User wants to see only the **next available session** prominently, with remaining sessions hidden behind an expandable dropdown.

## Changes

### `src/components/booking/ClassScheduleFlow.tsx`

1. Add a `showAll` boolean state (default `false`)
2. Extract the first class from `filteredClasses` as the "next available" session
3. Render that session card prominently at the top with a "Book Next Available" feel
4. Below it, add a collapsible section ("Show more sessions" button) that toggles `showAll`
5. When expanded, render the remaining sessions grouped by day (same as current layout, minus the first one)
6. Use `ChevronDown`/`ChevronUp` icon on the toggle button

### Layout
```text
┌─────────────────────────────┐
│  NEXT AVAILABLE SESSION     │
│  ┌───────────────────────┐  │
│  │ Member's Suite        │  │
│  │ 🕐 7:00 AM  👤 Staff  │  │
│  │ Mon, Apr 6   6 spots  │  │
│  └───────────────────────┘  │
│                             │
│  ▼ Show more sessions (12) │
│  ┌───────────────────────┐  │
│  │ remaining sessions... │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

## Files
- `src/components/booking/ClassScheduleFlow.tsx` — add `showAll` state, split first session from rest, add toggle button

