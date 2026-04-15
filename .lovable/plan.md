

# Create Experiences Page

## Summary
Create a new `/experiences` page styled like the Membership page, listing each treatment category with descriptions and images. Update the nav link to point to this page instead of `#services`.

## Changes

### 1. `src/pages/Experiences.tsx` — New file
- Same layout pattern as Membership: Navigation + dark bg + hero section + card grid + Footer
- Use `motion` animations matching Membership page
- Define an array of experiences using data from `serviceConfig.ts` (categories, images, short descriptions)
- Each card: image at top, treatment name, description paragraph, "Book Now" button linking to `/website#services`
- Categories to feature: Communal Members Suite, Signature Classes, Private Suites, Hyperbaric Oxygen, Cryotherapy, Massage Therapy, IV Drips, Regen and Manual Therapies
- Use existing images from `serviceImages` and `categoryImages`
- Include Helmet meta tags

### 2. `src/App.tsx` — Add route
- Import `Experiences` and add `<Route path="/experiences" element={<Experiences />} />`

### 3. `src/components/Navigation.tsx` — Update nav link
- Change `{ href: "/website#services", label: "Experiences" }` to `{ href: "/experiences", label: "Experiences" }`

### 4. `handleBookNow` in Navigation — Update target
- Change `handleBookNow` to navigate to `/experiences` instead of scrolling to `#services`

Three files modified, one new file.

