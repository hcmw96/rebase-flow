

# Synchronize Service Configuration Across App, Website, and Widget

## Problem
The service grouping, ordering, images, category mappings, and hidden items are defined independently in three files with significant drift:
- **`src/pages/Services.tsx`** (mobile app) — missing many grouping patterns, category overrides, images; still hides Members Suite; uses old group name "Infrared Sauna & Ice Bath" instead of "Infrared Suite"; no reflexology/four-hand/assisted-stretching groupings
- **`src/widget/components/ServiceList.tsx`** (embeddable widget) — completely independent config; different hidden lists; no category overrides; different ordering; hides Blood Test
- **`src/components/WebsiteServices.tsx`** (marketing site) — most up-to-date but is the only source of truth

## Solution
Extract shared configuration into a single file and import it everywhere.

### New file: `src/config/serviceConfig.ts`
A single source of truth containing:
- `serviceGroupMappings` — all regex-to-group-name patterns (union of all three files, using consistent names like "Infrared Suite", "Massage", "Reflexology")
- `hiddenGroupNames`, `hiddenProgramIds`, `hiddenServiceNames` — unified hidden lists
- `categoryOverrides` — the full map from WebsiteServices (Massage Therapy, IV Drips, Private Suites, etc.)
- `programNameOverrides` — Member's Suite → Communal Members Suite
- `categoryOrder` — the 8-category ordering
- `serviceImages` — all service-specific images (including NAD+ → iv-drip, Infrared Suite, Divine Facial, etc.)
- `categoryImages` — fallback images
- `serviceOrderWithinCategory` — IV Drips ordering (IV Drip > Blood Test > NAD+)
- `contactOnlyGroups` — Osteopathy
- `shortDescriptions` — for website cards
- `classOfferings` — for website classes section
- Helper functions: `extractDurationFromName`, `canonicalizeServiceName`

### Modified: `src/pages/Services.tsx`
- Import all config from `serviceConfig.ts`
- Remove all duplicated constants
- Add missing grouping patterns (Reflexology, Four Hand, Assisted Stretching, Deo's Body Alignment, Blood Test, Vitamin Shot)
- Add missing category overrides so the app groups services into the same 8 categories
- Use consistent image map (e.g., Infrared Suite image, massage image, etc.)
- Remove "Member's Suite" / "Members Suite" from hiddenGroupNames (they should show under Communal Members Suite)
- Apply `programNameOverrides` in category assignment
- Apply `categoryOrder` for section ordering instead of the current ad-hoc `serviceOrder`

### Modified: `src/components/WebsiteServices.tsx`
- Import shared config from `serviceConfig.ts`
- Remove all duplicated constants, keep only website-specific rendering logic

### Modified: `src/widget/components/ServiceList.tsx`
- Import shared config from `serviceConfig.ts`
- Remove duplicated constants
- Apply same category overrides and ordering
- Stop hiding Blood Test (it belongs in IV Drips)
- Use same image map

### Modified: `src/pages/HomePage.tsx`
- Import `serviceImages` and `categoryImages` from shared config instead of defining its own partial copies

## Key Consistency Fixes
| Issue | Before | After |
|-------|--------|-------|
| Infrared group name | "Infrared Sauna & Ice Bath" (app/widget) vs "Infrared Suite" (website) | "Infrared Suite" everywhere |
| Members Suite | Hidden in app, missing in widget | Shows as "Communal Members Suite" everywhere |
| Reflexology/Four Hand | Not grouped in app | Grouped under Massage Therapy |
| Blood Test | Hidden in widget | Visible under IV Drips |
| IV Drips order | No ordering in app/widget | IV Drip → Blood Test → NAD+ everywhere |
| Images | 3 partial, inconsistent maps | Single complete map |
| Category order | Ad-hoc in app, missing in widget | Same 8-category order everywhere |

