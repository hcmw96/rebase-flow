# Instant-render /website services

## Problem
On `/website`, the "Our Experiences" section currently shows skeleton placeholders until the `mindbody-services` API response arrives. Since the catalogue of services shown there is fixed (it's already enumerated in `src/config/serviceConfig.ts`), users shouldn't have to wait — only prices and any per-variant detail genuinely need the live API.

## Approach
Treat `serviceConfig.ts` as the source of truth for **what** appears on the marketing page, and Mindbody as the source of truth for **price/duration** that hydrate in the background.

### 1. Add a static catalogue in `serviceConfig.ts`
Introduce a new export, e.g. `staticWebsiteCatalogue`, ordered by `categoryOrder` and `serviceOrderWithinCategory`. Each entry contains:
- `baseName`, `category`
- `image` (from `serviceImages` / `categoryImages`)
- `shortDescription` (from `shortDescriptions`)
- `fromPrice` fallback (from `priceOverrides`) — used until the live data lands
- `contactOnly` flag
- `classDescriptionIds` for Signature Classes (already available in `classOfferings`)

This is derived from data that already exists in the file, so no new content authoring is needed.

### 2. Update `src/components/WebsiteServices.tsx`
- Render the accordion + cards from `staticWebsiteCatalogue` immediately, regardless of `isLoading`. Drop the full-section skeleton.
- When `useMindbodyServices` resolves, build a lookup `Map<canonicalName, GroupedService>` from the live data and merge:
  - Replace fallback `fromPrice` with the live minimum
  - Replace fallback `shortDescription` with live `onlineDescription` when it's not a placeholder
  - Pass live `variants` into `onSelectService` when the user clicks a card (so booking still uses real Mindbody session IDs)
- While live data is still loading, clicking a card can either:
  - open the booking drawer in a "loading variants" state, or
  - briefly defer the click until variants arrive (preferred — short wait only if user clicks before fetch completes; with the existing 30-min cache + root-level prefetch this is rare).

### 3. Keep the `/` mobile app behaviour unchanged
`Services.tsx` and the widget continue to render purely from live data (they need real variant IDs to show options). Only the `/website` marketing surface uses the static-first approach.

### 4. Signature Classes
Already rendered from `classOfferings` (static) — no change needed; just make sure the Signature Classes accordion item renders without waiting on `isLoading`.

## Technical notes
- No backend / edge-function changes.
- No changes to Mindbody data model or caching (root-level prefetch in `App.tsx` stays).
- Image priority: consider adding `loading="eager"` + `fetchPriority="high"` to the first row of cards so the LCP improves too.
- Type addition in `serviceConfig.ts`:

```ts
export interface StaticServiceEntry {
  baseName: string;
  category: string;
  image: string;
  shortDescription: string;
  fromPrice: number | null;
  contactOnly: boolean;
  classDescriptionIds?: number[];
}
export const staticWebsiteCatalogue: StaticServiceEntry[] = [...];
```

## Out of scope
- Mobile app `/` Services tab (still needs live variants to function).
- Booking drawer internals.
- Any pricing changes — fallback prices come from existing `priceOverrides`.
