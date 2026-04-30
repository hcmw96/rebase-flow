## Why slots double up

The `mindbody-availability` edge function calls Mindbody's `bookableitems` endpoint, which returns one `Availability` window **per resource that can take the booking** — typically per staff member, but also per room/suite assignment. For Premium Suite (a resource booking with no staff assigned and no staff name rendered), Mindbody returns two parallel availability windows (e.g. one per duplicated suite booking record), so each generated slot — `8:00 AM`, `9:15 AM`, `10:30 AM`, etc. — is emitted twice and rendered as two visually identical buttons.

This is consistent with the project memory rule **"Availability Logic: Deduplication by staffId and startDateTime"**, which documents the intended behaviour but is **not actually implemented** in `supabase/functions/mindbody-availability/index.ts`. Days where only one availability window exists (e.g. only one staff/resource scheduled) look fine; days with two windows show the doubling.

## Fix

Add a dedup pass in `supabase/functions/mindbody-availability/index.ts` after `generateTimeSlots`, using a composite key that handles both staff-based and resource-based bookings:

```
key = `${staffId ?? ''}|${locationId ?? ''}|${sessionTypeId ?? ''}|${startDateTime}`
```

Implementation:
1. After `const availableItems = (data.Availabilities || []).flatMap(generateTimeSlots);`
2. Reduce into a `Map<string, AvailableItem>` keyed by the composite key, keeping the first occurrence.
3. Return `Array.from(map.values())` sorted by `startDateTime`.
4. Add a log line showing pre/post dedup counts for future debugging.

No frontend changes needed — `TimeSlotPicker` will naturally render one button per unique slot.

## Files

- `supabase/functions/mindbody-availability/index.ts` — add dedup step + log
