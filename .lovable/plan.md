

# Fix Members Suite Price Display — Show £65

## Problem
The Mindbody API returns `price: null` for both "members only" session types (IDs 1206 and 1207). The sale/services endpoint doesn't link these session types to a £65 price. The booking flow itself works correctly (it uses the session type ID), but the UI shows "Contact for pricing" instead of £65.

## Approach
Add a frontend price override in `serviceConfig.ts` for the Members Suite group. This is the most reliable fix since the Mindbody API consistently fails to resolve this price. The booking will continue to work as-is — it already passes the correct session type ID to Mindbody.

## Changes

### 1. `src/config/serviceConfig.ts`
Add a price override map:
```ts
export const priceOverrides: Record<string, number> = {
  'Members Suite': 65,
};
```

### 2. `src/components/WebsiteServices.tsx`
Import `priceOverrides` and use it as a fallback when computing the display price for service cards. If `fromPrice` is null and the group name is in `priceOverrides`, use the override value.

### 3. `src/components/ServiceCard.tsx`
Same fallback in the `getFromPrice()` function — check `priceOverrides` when all variant prices are null.

### 4. `src/components/FeaturedServices.tsx`
Same pattern if Members Suite appears in featured services.

### 5. `src/components/booking/BookingDrawer.tsx`
Same fallback for the price shown in the booking drawer.

## Booking flow
No changes needed — the booking already sends the correct Mindbody session type ID. When booked, it will appear on the Mindbody backend correctly.

## Files modified
- `src/config/serviceConfig.ts`
- `src/components/WebsiteServices.tsx`
- `src/components/ServiceCard.tsx`
- `src/components/FeaturedServices.tsx`
- `src/components/booking/BookingDrawer.tsx`

