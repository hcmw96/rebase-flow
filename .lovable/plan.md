

# Add Cookie Policy Page to Website

## What changes

1. Create a new `/cookie-policy` page displaying the uploaded cookie policy content, styled consistently with the site's dark theme.
2. Add a route for it in `App.tsx`.
3. Add a "Cookie Policy" link in the Footer.

## Technical Details

### 1. New file: `src/pages/CookiePolicy.tsx`
- Static page with Navigation and Footer (same layout as `/website`)
- Renders the cookie policy content from the uploaded document as styled HTML
- Dark background (`bg-[#1A1A1A]`), cream text (`text-[#F9ECD9]`) to match site aesthetic
- Sections: intro, cookie types (strictly necessary, analytical, functionality, targeting), cookie table placeholder, usage examples, opt-out info, contact email

### 2. `src/App.tsx`
- Add route: `<Route path="/cookie-policy" element={<CookiePolicy />} />`

### 3. `src/components/Footer.tsx`
- Add "Cookie Policy" link in the Quick Links section or the bottom copyright bar, linking to `/cookie-policy`

### Files to modify
- **New**: `src/pages/CookiePolicy.tsx`
- **Edit**: `src/App.tsx` — add route
- **Edit**: `src/components/Footer.tsx` — add link

