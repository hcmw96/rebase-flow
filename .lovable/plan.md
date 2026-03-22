

# Full-Screen Booking Drawer with Hero Image

## What changes

Transform the booking drawer from a bottom sheet (90vh) into a full-screen overlay. The service image fills the top half of the screen, and the booking flow (steps, variant selection, date/time/confirm) occupies the bottom half with scrollable content.

## Technical Details

### File: `src/components/booking/BookingDrawer.tsx`

1. **Make drawer full-screen**: Change `DrawerContent` className from `max-h-[90vh]` to `h-[100dvh] max-h-[100dvh]` and remove the rounded top corners / drag handle
2. **Add hero image section**: Insert a top-half image container above the booking flow content:
   - Uses `service.image` as background with `object-cover`
   - Takes up ~45-50% of viewport height (`h-[45vh]`)
   - Overlays the service title and variant info at the bottom with a gradient fade
   - Back button and close button positioned over the image
3. **Restructure layout**: 
   - Remove the current text-only header bar
   - Move back/close buttons to overlay the image (white icons on dark gradient)
   - Bottom half contains the scrollable booking steps content as-is
4. **Hide image on success/contact screens**: When `bookingComplete` or `showContactMessage`, collapse the image area or hide it

### File: `src/components/ui/drawer.tsx`

- Add option to hide the drag handle indicator (the gray bar) since this is now full-screen, not a swipeable sheet. Could pass a prop or add a variant class.

### Layout structure
```text
┌──────────────────────┐
│   ← (back)    ✕      │  ← overlaid on image
│                      │
│   SERVICE IMAGE      │  ~45vh
│                      │
│   Service Title      │  ← gradient overlay at bottom
│   Duration · Price   │
├──────────────────────┤
│  Step indicators     │
│                      │
│  Booking flow        │  ~55vh, scrollable
│  (type/date/time/    │
│   confirm)           │
│                      │
└──────────────────────┘
```

### Files to modify
- `src/components/booking/BookingDrawer.tsx` — restructure to full-screen with hero image
- `src/components/ui/drawer.tsx` — support hiding drag handle

