## Remove "Midday Reset" service

Strip the Midday Reset offering from the marketing site and supporting config so it no longer appears anywhere on `/website` (or in the mobile app / widget).

### Changes

1. **`src/config/serviceConfig.ts`** — remove all Midday Reset entries:
   - `staticWebsiteCatalogue` entry (line ~398) — this is what currently renders the card on `/website`.
   - `serviceNameAliases` pattern (line ~33).
   - `categoryAssignments` (line ~96), `serviceImages` (line ~149), `shortDescriptions` (line ~197).
   - Add `'Midday Reset'` (and `'The Midday Reset'`) to `hiddenGroupNames` as a safety net so any live Mindbody item still tagged that way is hidden from the live grouping path too.

2. **`src/components/CategorySection.tsx`** & **`src/widget/components/CategorySection.tsx`** — remove the two `'The Midday Reset - Infrared Suite'` / `'... Premium Suite'` strings from their service-order arrays.

3. **`src/components/booking/UpsellSuggestions.tsx`** — remove the `'Midday Reset': [...]` upsell mapping.

4. **`src/pages/Experiences.tsx`** — edit the copy on line 29 to drop the "or our Midday Reset — a restorative midday escape in complete privacy" clause so the Private Suites paragraph reads naturally without it.

### Out of scope
- No Mindbody / backend changes (the Mindbody pricing options can stay; they just won't surface on the site).
- No image file deletion (`/images/rebase-midday-reset.jpg` left in place in case it's reused).
