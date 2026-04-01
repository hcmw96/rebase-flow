

# Add Membership Page with "Learn about Membership" Link

## What changes

### 1. Add "Learn about Membership" link below the ticker in `WebsiteServices.tsx`
After the logo ticker section (~line 345), add a centered text link "Learn about Membership" styled consistently with the section — subtle, uppercase tracking, linking to `/membership`.

### 2. Add ticker logos 7 and 8
Save the two uploaded SVGs and add them to the ticker array.

### 3. Create new `src/pages/Membership.tsx`
A full-page membership page using the existing `Navigation` + `Footer` layout (same pattern as `Contact.tsx` and `Index.tsx`). Contains:

- **Hero section** with title "Membership" and a brief intro
- **Three membership tier cards** displayed in a grid (1 col mobile, 3 col desktop):
  - **Base** — entry level, 4 class passes, 4 cryo sessions, 1 HBOT, 8 communal passes, 10% off, 6 guest passes
  - **Resident** — unlimited cryo, 8 class passes, 3 private suite, 3 HBOT, unlimited communal, 10% off, 12 guest passes
  - **Ultimate** — unlimited classes + cryo, 6 private suite, 6 HBOT, unlimited communal, 10% off, 18 guest passes
- Each card has: tier name, overview paragraph, bullet list of details, and an **"Enquire"** CTA button that links to `/contact` (or opens mailto)
- Dark theme matching the site aesthetic (`bg-[#1a1a1a]`, `text-[#F9ECD9]`, etc.)

### 4. Add route in `App.tsx`
Add `/membership` route pointing to the new `Membership` page, alongside the existing `/website` and `/cookie-policy` routes.

### 5. Add "Membership" to Navigation
Add a nav item for `/membership` in the `navItems` array in `Navigation.tsx`.

## Files modified
- `public/images/ticker-logo-7.svg` — new asset
- `public/images/ticker-logo-8.svg` — new asset
- `src/components/WebsiteServices.tsx` — add logos to ticker + "Learn about Membership" link
- `src/pages/Membership.tsx` — new page with 3 tier cards
- `src/App.tsx` — add `/membership` route
- `src/components/Navigation.tsx` — add Membership nav link

