

# Link Signature Class Cards to Mindbody Class Booking

## Summary
Make the four Signature Classes cards (Urban Oasis, Contrast Immersion, Yoga, Mat Pilates) clickable. Clicking a card will open the booking drawer showing upcoming class sessions for that specific class, filtered by its `classDescriptionId`.

## Mindbody API Data Found

All four classes exist in Mindbody under programId 26 ("Classes"):

- **Urban Oasis** — classDescriptionId: 7
- **Contrast Immersion** — classDescriptionId: 8  
- **Yoga** — classDescriptionIds: 1 (Prana Flow) and 10 (Dynamic Flow)
- **Mat Pilates** — classDescriptionId: 20

## Technical Approach

### 1. Add classDescriptionIds to `classOfferings` in `serviceConfig.ts`
Add a `classDescriptionIds` field to each class offering so we know which Mindbody classes to fetch:
```typescript
export const classOfferings = [
  { name: 'Urban Oasis', image: '...', description: '...', classDescriptionIds: [7] },
  { name: 'Contrast Immersion', image: '...', description: '...', classDescriptionIds: [8] },
  { name: 'Yoga', image: '...', description: '...', classDescriptionIds: [1, 10] },
  { name: 'Mat Pilates', image: '...', description: '...', classDescriptionIds: [20] },
];
```

### 2. Make class cards clickable in `WebsiteServices.tsx`
Change `<motion.div>` to `<motion.button>` for class cards. On click, call `handleClick` with a constructed service object that includes the `classDescriptionIds` so the booking drawer knows this is a class booking.

### 3. Extend `BookingServiceData` in `BookingDrawer.tsx`
Add an optional `classDescriptionIds?: number[]` field. When present, the drawer switches to a **class booking flow**:
- Fetch upcoming classes via `useMindbodyClasses` filtered by `classDescriptionId`
- Show a date picker + list of available class sessions (time, instructor, spots remaining)
- Book using the class booking endpoint (`mindbody-book` with class ID) instead of appointment booking

### 4. Add class schedule view in the booking drawer
When `classDescriptionIds` is present on the service data:
- Step 1: Show a calendar + list of upcoming sessions for the next 7 days
- Step 2: Confirm booking for the selected class session
- Use the existing `useMindbodyClasses` hook with `classDescriptionId` filter

## Files Modified
- `src/config/serviceConfig.ts` — add `classDescriptionIds` to class offerings
- `src/components/WebsiteServices.tsx` — make class cards clickable buttons
- `src/components/booking/BookingDrawer.tsx` — handle class booking flow when `classDescriptionIds` is present

