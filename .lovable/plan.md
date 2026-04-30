## Goal

Only show upsell suggestions that have a **real bookable slot starting within 60 minutes after the user's selected booking ends** — i.e. slots they can actually walk into while still on site. No slot in that window → hide the upsell entirely. No fake/static info ever shown.

## Approach

The booking drawer already knows the selected slot (`selectedSlot.endDateTime`) and its variant duration. Pass that "reference end time" into `UpsellSuggestions`, then for each candidate upsell:

1. Resolve upsell name → a representative Mindbody `sessionTypeId` from prefetched services (using `canonicalizeServiceName`).
2. Fetch availability for that single day with `useMindbodyAvailability` (already cached 2 min).
3. Filter slots to those whose `startDateTime` is **between `referenceEnd` and `referenceEnd + 60 min`** (inclusive of `referenceEnd`).
4. Pick the earliest matching slot. If none → don't render this upsell card at all.

If `selectedSlot` isn't set yet (earlier booking steps, or success screen with no source slot), don't render upsells at all on those steps.

### Step-by-step

1. **`UpsellSuggestions.tsx`**
   - Add prop `referenceEndDateTime: string | null` (ISO string of when the current booking ends).
   - If null → render nothing.
   - Pull `useMindbodyServices()` to map upsell name → `sessionTypeId` (first matching service whose canonical name equals the upsell name, skipping classes/contact-only).
   - For each candidate, call `useMindbodyAvailability` with `startDate = endDate = format(referenceEnd, 'yyyy-MM-dd')`.
   - Compute the first slot in `[referenceEnd, referenceEnd + 60min]`. Hide if none.
   - Render: `Right after your session — {format(slot.startDateTime, 'h:mm a')}` under the upsell name (replaces static `shortDesc`).
   - Skeleton/dim while any of the queries are loading; once resolved, only display upsells that pass the filter.

2. **`BookingDrawer.tsx`**
   - At all three `<UpsellSuggestions />` call sites, pass `referenceEndDateTime={selectedSlot?.endDateTime ?? null}`.
   - On the success screen (post-confirm), the same `selectedSlot` is still in state, so it works without extra wiring.

3. **Edge cases**
   - Upsell whose service is contact-only or class-only → skip availability lookup and hide (we don't have on-the-spot bookable times for these).
   - When the user changes their selected time, the cards re-evaluate automatically (React Query keyed by date).
   - Hooks must run unconditionally — implement the per-upsell fetch via a small child component (`<UpsellCard>`) so each one calls `useMindbodyAvailability` cleanly.

## Files

- `src/components/booking/UpsellSuggestions.tsx` — split into `UpsellSuggestions` + `UpsellCard`, fetch + filter availability against the 60-minute window.
- `src/components/booking/BookingDrawer.tsx` — pass `selectedSlot?.endDateTime` into `UpsellSuggestions` at all call sites.
