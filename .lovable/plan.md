

## Grey out unavailable days in booking calendars

Right now the booking calendar in `BookingDrawer` lets you click any future date, and we only fetch availability after a date is picked. We'll prefetch a window of availability up front and use it to disable (grey out) days that have no bookable slots.

### Scope
This applies to the **appointment** booking calendar (`BookingDrawer` → `BookingCalendar`). The class flow (`ClassScheduleFlow`) doesn't use a calendar — it's a list — and fully-booked classes already show "0 spots", so that's out of scope unless you want them visually disabled in the list too.

### Changes

**1. `src/components/booking/BookingDrawer.tsx`**
- After a variant is chosen (or for single-variant services, on open), fetch availability for the next **30 days** in one call using `useMindbodyAvailability` with `startDate = today`, `endDate = today + 30`.
- Derive `availableDates: Date[]` = unique dates from `availabilityData.availableItems` (i.e., days that returned at least one bookable slot — fully-booked days return zero slots from Mindbody and are naturally excluded).
- Pass `availableDates` into `<BookingCalendar />`.
- Keep the existing single-day fetch for the time-slot step (it's already filtered to the selected date).

**2. `src/components/booking/BookingCalendar.tsx`**
- Already supports `availableDates` and disables days not in the list. Add a visual "greyed out" style (reduced opacity / muted text / `line-through` optional) for disabled-but-future days via `modifiers={{ unavailable: ... }}` so users can tell the difference between "past" and "no availability".

**3. `supabase/functions/mindbody-availability/index.ts`** — no change needed. It already accepts `startDate`/`endDate` and Mindbody returns all bookable windows in that range.

### Performance note
A 30-day availability query for one service is a single Mindbody call and is cached for 2 minutes by React Query (existing `useMindbodyAvailability` config). When the user lands on the date step, the calendar will briefly show all days enabled, then disable unavailable days once the fetch resolves — we'll show a subtle loading shimmer on the calendar header during this fetch.

### Out of scope
- Class-list "fully booked" greying (separate UX).
- Month-by-month lazy loading (30-day window is enough for the booking horizon).

