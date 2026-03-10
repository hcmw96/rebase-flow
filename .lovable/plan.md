

## Services Page Overhaul

This plan covers a large set of changes to clean up the services list, restructure categories, add "contact reception" behaviour for certain services, rename tabs, and introduce a classes section.

---

### 1. Hide unwanted services and categories

**File: `src/pages/Services.tsx`**

Add the following to the hidden lists:

- **hiddenGroupNames**: Add `'Member\'s Suite'`, `'Wellness Event'`, `'Saturday Buffer'`, `'Thursday Buffer'`
- **hiddenServiceNames**: Add `'Saturday Buffer'`, `'Thursday Buffer'`, `'Destress Head Neck and Shoulders'` (and variants like `'Destress Head, Neck & Shoulders'`), `'Indian Head Massage'`, `'Indian Massage'`
- **Hide the entire "General" category**: After grouping, filter out any services whose resolved category is `'General'`

### 2. Rename "Sauna" category to "Private Suites"

**File: `src/pages/Services.tsx`**

Change the category mapping so `rawCategory.startsWith('Sauna Suite')` maps to `'Private Suites'` instead of `'Sauna'`.

### 3. Group Brazilian Lymphatic

**File: `src/pages/Services.tsx`**

Add grouping patterns to `serviceGroupMappings`:
```
{ pattern: /^brazilian\s*lymphatic/i, groupName: 'Brazilian Lymphatic' }
{ pattern: /^brazillian\s*lymphatic/i, groupName: 'Brazilian Lymphatic' }
```

### 4. Restrict "Regen and Manual Therapies" category

Only keep **Osteopathy**, **Myofascial Dry Needling**, and **Structural Fascia Therapy** in this category. All other services in "Regen and Manual Therapies" (or similar program name) will be hidden. This will be done by adding a whitelist check: if a service's category matches "Regen" or "Manual Therapies", only allow services whose canonical group name is in the allowed set.

### 5. "Contact Reception" services in the booking drawer

**File: `src/components/booking/BookingDrawer.tsx`**

Add a concept of "reception-only" services. When the booking drawer opens for one of these services, instead of showing the calendar/time flow, display a message:

> "To book [service name], please contact reception at reception@rebaserecovery.com"

The list of reception-only service group names:
- **Osteopathy** -- all variants
- **IV Drip** -- only the "First Consultation" variant (mark it as free/contact)
- **Nutritional Therapy** -- all variants

Implementation: Add a `contactOnly` flag to `BookingServiceData`. In the Services page, set this flag for Osteopathy and Nutritional Therapy groups. For IV Drip, the first consultation variant will have its price shown as "Free - Contact Reception" and the drawer will show the contact message when that specific variant is selected.

### 6. IV Drip first consultation is free

**File: `src/pages/Services.tsx`** and **`src/components/booking/BookingDrawer.tsx`**

For the IV Drip group, any variant matching `/first\s*consult|initial/i` will be flagged as contact-reception-only. In the variant selector within the drawer, this variant shows "Free -- Contact Reception" instead of a price, and selecting it shows the contact message rather than the calendar.

### 7. Add "Midday Reset" to Private Suites

**File: `src/pages/Services.tsx`**

- Remove `'Midday Reset'` and `'Midday Resets'` from `hiddenGroupNames`
- Add a grouping pattern or category override so Midday Reset services appear under the "Private Suites" category
- Add mapping: `{ pattern: /^(the\s+)?midday\s*resets?/i, groupName: 'Midday Reset' }` and force its category to `'Private Suites'`

### 8. Remove "Member's Suite" from Home page popular services

**File: `src/pages/HomePage.tsx`**

Remove `'Members Suite'` from the `POPULAR_GROUPS` array and its corresponding grouping pattern.

### 9. Add Classes section

This is a larger addition that adds a "Classes" tab or section to the app.

**New file: `src/components/ClassSchedule.tsx`**
- Fetches classes using the existing `useMindbodyClasses` hook (from `useMindbodyServices.ts`)
- Shows upcoming classes grouped by day, with time, name, instructor, and available spots
- Each class card has a "Book" button that opens the booking drawer

**File: `src/pages/Services.tsx`**
- Add a tab/toggle at the top: "Services" | "Classes"
- When "Classes" is selected, render the ClassSchedule component instead of the services list
- Classes fetched for the next 7 days by default

---

### Summary of files to modify

| File | Changes |
|------|---------|
| `src/pages/Services.tsx` | Hide services, rename Sauna to Private Suites, add groupings, category restrictions, Midday Reset, add Classes toggle |
| `src/components/booking/BookingDrawer.tsx` | Add "contact reception" flow for flagged services |
| `src/pages/HomePage.tsx` | Remove Members Suite from popular services |
| `src/components/ClassSchedule.tsx` | **New file** -- class schedule component |

### Technical details

**BookingServiceData** interface gains an optional `contactOnly?: boolean` field and optionally per-variant `contactOnly` flags via extending `ServiceVariant` with `contactOnly?: boolean`.

**Category override map** in Services.tsx: A new `const categoryOverrides: Record<string, string>` that forces certain canonical names into specific categories (e.g. `'Midday Reset': 'Private Suites'`).

**Regen/Manual Therapies whitelist**: After grouping, filter services in that category to only include `['Osteopathy', 'Myofascial Dry Needling', 'Structural Fascia Therapy']`.

