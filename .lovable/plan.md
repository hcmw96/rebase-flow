

# Plan: Upsells Add to Booking (Multi-Service Cart)

## What
When a user taps an upsell suggestion, instead of navigating away, it adds that service to a list of "add-ons" within the current booking drawer. On confirm, all selected services are booked together.

## Changes

### 1. BookingDrawer — Add-on State & UI
**File: `src/components/booking/BookingDrawer.tsx`**

- Add `addedUpsells` state: `useState<string[]>([])` — tracks names of upsell services added
- Change `onSwitchService` usage: instead of closing/navigating, the upsell callback toggles the service name in `addedUpsells`
- On the **confirm step**, display added upsells as a summary list below the main booking details (name + short description + remove button)
- On the **success screen**, list the upsell add-ons alongside the confirmed booking
- On confirm, book the main appointment first, then fire additional `bookServiceMutation` calls for each upsell (best-effort — toast per success/failure)
- Reset `addedUpsells` when drawer closes

### 2. UpsellSuggestions — Toggle State
**File: `src/components/booking/UpsellSuggestions.tsx`**

- Accept new prop `addedServices: string[]` to know which are already added
- When a service is already added, show a checkmark instead of the plus icon, and style the button as "selected"
- Clicking a selected upsell removes it (toggle behavior)

### 3. Booking Flow
- Upsells shown on both confirm step and success screen
- On confirm: main service is booked via existing `bookServiceMutation`, then each upsell is booked sequentially with a toast for each
- Since upsells may not have a specific time slot selected, they'll be booked as "next available" — or alternatively, shown as a reminder list the user can book separately

**Important caveat**: The Mindbody booking API requires a specific time slot (staffId, startDateTime, sessionTypeId) for each appointment. Upsells don't have slots selected. Two options:

**Option A (simpler, recommended)**: Upsells are added as a visual "reminder list" — after the main booking confirms, the drawer shows "You also wanted: [Massage, IV Drip]" with a "Book now" button for each that re-opens the drawer for that service. This avoids needing slot selection for upsells.

**Option B**: Full multi-booking with slot selection per add-on — significantly more complex.

### Recommended: Option A

- On the confirm step and success screen, added upsells appear as a "Your add-ons" section
- After main booking succeeds, each upsell has a "Book Next" button that resets the drawer with that service loaded (using existing `onSwitchService` prop but keeping the drawer open)
- The `+` icon becomes a check when added; tapping again removes it

### Summary of file changes
1. **`UpsellSuggestions.tsx`** — add `addedServices` prop, toggle behavior, check/plus icon swap
2. **`BookingDrawer.tsx`** — `addedUpsells` state, display add-ons on confirm/success steps, "Book Next" buttons that reload the drawer with the upsell service

