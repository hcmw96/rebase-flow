

# Fix Members Suite — Show £65 and Make Bookable

## Problem
The Mindbody API returns two "members only" session types (IDs 1206 and 1207) both with `price: null`. The booking drawer shows "Contact" for each variant instead of £65, making it look unbookable.

## Root Cause
The `priceOverrides` map in `serviceConfig.ts` only applies at the card level (the "From £65" display). But when building variant objects in `WebsiteServices.tsx`, the raw `service.price` (null) is used directly. The booking drawer then shows "Contact" for any variant with a null price.

## Fix

### 1. `src/components/WebsiteServices.tsx`
When pushing variants, apply `priceOverrides` as a fallback when `service.price` is null. Specifically, on the line that builds the variant object (~line 76-80), change the price assignment to:

```typescript
price: isIvFirstConsult ? 0 : (service.price ?? priceOverrides[canonicalName] ?? null)
```

This ensures both "members only" variants get price 65 from the override, making them display "£65.00" in the booking drawer and proceed through the normal booking flow (date → time → confirm) instead of showing "Contact".

### 2. Same fix in `src/pages/Services.tsx`
Apply the identical price fallback logic in the Services page grouping code, which has the same variant-building pattern.

## Result
- Members Suite card: still shows "From £65" (unchanged)
- Booking drawer variants: each shows "£65.00" instead of "Contact"
- Clicking a variant proceeds to date selection (bookable), not a dead end
- Booking sends the correct Mindbody session type ID (1206 or 1207), so it appears on the Mindbody backend

## Files modified
- `src/components/WebsiteServices.tsx`
- `src/pages/Services.tsx`

