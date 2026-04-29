# Fix missing Yoga (and other) classes

## Root cause

The `mindbody-classes` edge function fetches Mindbody's `class/classes` endpoint with no pagination. Mindbody caps a single page at 100 results.

In a 14‑day window the schedule contains:

- 94 × Member's Suite (id 5)
- 3 × Prana Flow / Yoga (id 1)
- 2 × Contrast Immersion (id 8)
- 1 × Urban Oasis (id 7)

Members Suite alone consumes 94 of the 100 slots, so anything further out — including additional Yoga sessions, Dynamic Flow (id 10) and Mat Pilates (id 20) — is silently truncated. From the user's view "Yoga isn't coming through" because most/all yoga sessions sit past the cutoff.

A secondary issue: when the front end requests a comma-separated `classDescriptionId` (e.g. `1,10` for Yoga), the proxy passes it through but Mindbody's response for that filter currently returns 0 — likely because the param name passed (`ClassDescriptionIds`) needs each id only or the filter combined with `HideCanceledClasses` is interacting badly. Pagination is the safer, broader fix and removes any reliance on this filter for the "Classes" tab.

## Fix

Update **`supabase/functions/mindbody-classes/index.ts`** to paginate through all results before responding:

```ts
// pseudocode
const PAGE = 200; // Mindbody's max
let offset = 0;
let all: any[] = [];
while (true) {
  params.set("Limit", String(PAGE));
  params.set("Offset", String(offset));
  const res = await fetch(`.../class/classes?${params}`, { headers });
  const data = await res.json();
  const page = data.Classes ?? [];
  all = all.concat(page);
  // PaginationResponse tells us when to stop; fall back to length check
  const total = data.PaginationResponse?.TotalResults ?? all.length;
  offset += page.length;
  if (page.length === 0 || all.length >= total) break;
  if (offset > 2000) break; // hard safety cap
}
```

Then map `all` exactly as today. No changes to the response shape, so no front-end changes are required.

## Why this is enough

- All Yoga / Dynamic Flow / Mat Pilates sessions in the requested window will now be returned, regardless of how many Member's Suite rows precede them.
- The existing `ClassSchedule` component already groups by day and renders every class it receives; once the data is complete the Yoga rows will appear under their day heading.
- Caching (5 min) and React Query setup are unchanged.

## Files touched

- `supabase/functions/mindbody-classes/index.ts` — add `Limit`/`Offset` pagination loop with a safety cap.

## Verification after deploy

Hit the function for the next 14 days and confirm `Prana Flow` count > 3 and that `Mat Pilates` / `Dynamic Flow` appear if Mindbody has them scheduled. If they don't appear at all, the team simply hasn't scheduled them yet in Mindbody — surface that to the user rather than guessing.
