

# Reduce Hero Image Height for More Booking Content

## Problem
The hero image takes `h-[55vh]` (55% of viewport), leaving only ~45% for booking content. On many screens this cuts off sessions and requires scrolling. The user wants more space for the booking options.

## Change

### `src/components/booking/BookingDrawer.tsx` (line 237)
Reduce the hero image height from `h-[55vh]` to `h-[35vh]`. This gives roughly 65% of the screen to the booking content area, showing more sessions without scrolling.

```
// Before
<div className="relative shrink-0 h-[55vh]">

// After
<div className="relative shrink-0 h-[35vh]">
```

Single line change, one file.

