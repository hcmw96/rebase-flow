

## Rename "Communal Members Suite" → "Communal Contrast" everywhere

The category name "Communal Members Suite" (and variants like "Members Suite", "Member's Suite") appears across config, pages, and components. I'll do a global rename to "Communal Contrast".

### Files to update

1. **`src/config/serviceConfig.ts`** — central source of truth
   - `programNameOverrides`: map "Member's Suite" / "Members Suite" → `'Communal Contrast'`
   - `categoryOverrides`: same mapping
   - `categoryOrder`: replace `'Communal Members Suite'` with `'Communal Contrast'`
   - `serviceImages`: rename `'Members Suite'` key (keep image path)
   - `classDescriptionIdMap`, `priceOverrides`: keep `'Members Suite'` keys (these match raw Mindbody names) — no change
   - Verify `serviceGroupMappings` regex still maps to a canonical name routed to "Communal Contrast"

2. **`src/pages/Experiences.tsx`** — first experience card
   - Rename `name: "Communal Members Suite"` → `"Communal Contrast"`

3. **`src/components/Footer.tsx`** — services list
   - Replace `"Communal Members Suite"` → `"Communal Contrast"`

4. **`src/components/Navigation.tsx`** — dropdown menu items
   - Replace any `"Communal Members Suite"` / `"Members Suite"` label → `"Communal Contrast"`

5. **Any other references** — I'll grep for `Members Suite` / `Communal Members` / `Member's Suite` across `src/` and update display strings (keeping raw Mindbody-keyed lookups intact where required for API matching).

### Out of scope
- Mindbody-side program names remain as-is (we map them via overrides).
- Image filenames (`rebase-members-suite.jpg`) stay — only the displayed label changes.

