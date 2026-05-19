## FAQ Page

Add a new `/faq` route to the informational website, matching the existing page pattern (Navigation + Footer, Helmet SEO, JSON-LD).

### Files

- **New:** `src/pages/FAQ.tsx` — Renders all 13 Q&As using shadcn `Accordion` (single-collapsible). Includes Helmet with title/description/canonical/OG tags and JSON-LD `FAQPage` schema covering all 13 questions for SEO rich results.
- **Edit:** `src/App.tsx` — Import `FAQ`, add `<Route path="/faq" element={<FAQ />} />`.
- **Edit:** `src/components/Navigation.tsx` — Add `{ href: "/faq", label: "FAQ" }` between Membership and Contact.
- **Edit:** `src/components/Footer.tsx` — Add FAQ link to the quick links list.

### Design

Follows existing cream/dark-brown design tokens. Layout: centered single-column with a hero heading "Frequently Asked Questions", short intro, then the accordion. No new colors, fonts, or components beyond shadcn `Accordion` (already present in the project's ui kit).

### Content

All 13 Q&As exactly as provided by the user, stored as a typed array in the page file and rendered in order.

### Out of scope

No changes to mobile app shell, booking flow, or backend.
