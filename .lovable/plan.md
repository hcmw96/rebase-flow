

# Wire Up Contact Page with Form, Phone & Instagram

## Changes

### 1. `src/App.tsx` — Add `/contact` route
Import `Contact` and add a route before the catch-all:
```tsx
import Contact from "./pages/Contact";
// ...
<Route path="/contact" element={<Contact />} />
```

### 2. `src/pages/Contact.tsx` — Update content
- Replace the placeholder phone number with the real one (or keep a reasonable placeholder if unknown)
- Replace the "Hours" card with an **Instagram** card using the Instagram icon from `lucide-react`, linking to `https://instagram.com/rebaserecovery`
- Keep the contact form, email, and location cards
- Ensure the page uses the same dark theme styling as the rest of the marketing site

### 3. `src/components/Navigation.tsx` — Already correct
The nav already has `{ href: "/contact", label: "Contact" }` as a `<Link>` — it will work once the route exists.

Two files modified, minimal changes.

