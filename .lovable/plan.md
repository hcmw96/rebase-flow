## Two fixes for the class schedule view

### 1. Replace the endless list with a calendar
Currently `ClassScheduleFlow.tsx` shows a "Next Available" hero card plus a long expandable list of every session for the next 7 days (74 in the screenshot). Replace this with the existing `BookingCalendar` component (already used by appointments), and only show time slots for the selected day.

- Fetch window: extend from **7 → 30 days** so the calendar shows useful range.
- Compute distinct `availableDates` (days that have at least one session) and pass to `BookingCalendar`.
- Auto-select the first available date once data loads.
- Below the calendar, list the sessions on the selected day only (time, staff, location, spots remaining). Tapping one opens the existing confirm step.
- Drop the "Next Available" hero, the "Show more sessions (N)" toggle, the day-grouped list, and the unused `AnimatePresence`/`ChevronDown` imports.

### 2. Always show "Rebase", never "ReBase"
Mindbody's `locationName` returns "ReBase". Add a small `normaliseBrand()` helper in this file that runs `.replace(/re[\s-]?base/gi, 'Rebase')` and apply it everywhere `selectedClass.locationName` / `cls.locationName` is rendered (confirm step, success screen, and the per-day session list).

This keeps the brand-name rule scoped to where Mindbody data leaks through, without touching the edge function or other consumers.

## Files

- `src/components/booking/ClassScheduleFlow.tsx` — full rewrite of the listing portion (calendar + per-day slots), brand normalisation helper.
