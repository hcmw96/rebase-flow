

# Make Members Suite Bookable via Class Schedule

## Problem
The Members Suite is configured in Mindbody as a **class** (classDescriptionId: 5), not an appointment. It has hourly time slots with capacity (e.g., "3:00 PM – 4:00 PM, 2 of 8 open"). Currently the app tries to book it as an appointment service, which returns zero availability.

## Solution
Route the Members Suite through the existing class booking flow (ClassScheduleFlow), the same system used for Yoga, Contrast Immersion, Urban Oasis, and Mat Pilates. This requires three small config changes — no new components or edge functions.

## Changes

### 1. `src/config/serviceConfig.ts`
- Remove `'Members Suite'` from `hiddenGroupNames` if present (the "Off Peak Access" variant is already hidden, but we need to ensure "Members Suite" itself isn't blocked)
- Add Members Suite to the `classOfferings` array with `classDescriptionIds: [5]`, the Members Suite photo, and its description
- Alternatively, since Members Suite should appear in the **Services** grid (not the Classes tab), the better approach is to set `classDescriptionIds` on the grouped service when building variants

### 2. `src/components/WebsiteServices.tsx`
- When building the grouped service for "Members Suite", attach `classDescriptionIds: [5]` to the BookingServiceData passed to the booking drawer
- This makes the booking drawer detect `isClassBooking = true` and render the ClassScheduleFlow (showing available hourly slots with spots remaining)

### 3. `src/pages/Services.tsx`
- Same change as WebsiteServices: attach `classDescriptionIds: [5]` to the Members Suite group when passed to the booking drawer

### Result
- Members Suite card still shows "From £65" and the Members Suite photo
- Clicking "Book" opens the drawer with the class schedule flow: a list of upcoming 1-hour slots grouped by day, showing available spots (e.g., "5 of 8 spots")
- User selects a slot, confirms, and it books via the existing `mindbody-book` class booking endpoint
- No new edge functions or components needed

## Technical detail
The booking drawer already checks `isClassBooking = !!(service?.classDescriptionIds?.length)` on line 95. If classDescriptionIds is present, it renders `<ClassScheduleFlow>` instead of the appointment calendar. We just need to pass this data through from the service config.

A simple approach: add a `classDescriptionIdMap` to serviceConfig.ts:
```typescript
export const classDescriptionIdMap: Record<string, number[]> = {
  'Members Suite': [5],
};
```
Then in both WebsiteServices and Services, when building the BookingServiceData, check this map and attach the IDs.

## Files modified
- `src/config/serviceConfig.ts` — add classDescriptionIdMap
- `src/components/WebsiteServices.tsx` — pass classDescriptionIds for Members Suite
- `src/pages/Services.tsx` — same

