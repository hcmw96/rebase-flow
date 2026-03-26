

# Cookie Consent Popup

## What changes
Create a cookie consent banner that appears bottom-left on all pages. It persists until the user accepts or rejects. Preferences are saved to localStorage. The banner includes toggles for each cookie category (strictly necessary always on, others off by default), plus Accept All / Reject All buttons. Links to the existing `/cookie-policy` page.

## Technical Details

### New file: `src/components/CookieConsent.tsx`
- Fixed position bottom-left popup, dark luxury theme matching site (`bg-[#1A1A1A]`, `text-[#F9ECD9]`)
- Compact initial view with brief message + "Accept All" / "Manage Cookies" buttons
- Expandable detail view showing the four cookie categories with toggles:
  - Strictly Necessary — always active, toggle disabled
  - Analytical/Performance — off by default
  - Functionality — off by default  
  - Targeting — off by default
- "Accept All", "Reject All", "Save Preferences" actions
- Stores consent in `localStorage` under key `rebase-cookie-consent`
- If consent already stored, banner does not render
- Link to `/cookie-policy` page

### Modified file: `src/App.tsx`
- Import and render `<CookieConsent />` inside the app tree (outside Routes, so it appears on all pages)

### Styling
- Matches site aesthetic: dark background, cream text, minimal borders, rounded corners
- Max width ~420px, subtle shadow, z-50
- Smooth slide-up animation on mount
- Toggle switches using the existing `Switch` UI component

