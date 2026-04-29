## Expand SEO coverage: per-page Helmet, JSON-LD, and confirm sitemap/robots

### Current state (already in place)

- `react-helmet-async` is installed; `<HelmetProvider>` wraps `App.tsx`.
- `public/robots.txt` exists with sitemap reference.
- `public/sitemap.xml` exists with `/website`, `/membership`, `/cookie-policy`.
- `Helmet` already used on: `Index.tsx`, `Membership.tsx`, `Experiences.tsx`, `CookiePolicy.tsx`.
- `Index.tsx` already includes a `LocalBusiness` JSON-LD schema with `OfferCatalog`.

### What's missing

1. **`Contact.tsx`** has no `<Helmet>` block — needs title/description/canonical/OG/Twitter tags.
2. **`Membership.tsx`** and **`Experiences.tsx`** have basic Helmet but **no JSON-LD** schema.
3. **`sitemap.xml`** is missing the `/contact` and `/experiences` routes (both are real, indexable pages in `App.tsx`).
4. **`robots.txt`** can be tightened slightly to disallow internal-only routes (`/account`, `/reception`, `/dashboard`, `/auth`, `/login`) so they don't get indexed.
5. The mobile-app shell route `/` (AppShell) is intentionally excluded from sitemap — correct, since it's an app, not a marketing page.

### Changes

**1. `src/pages/Contact.tsx`** — Add `<Helmet>` with:
- Title: "Contact Us — Rebase Recovery"
- Description focused on Marylebone location, booking enquiries, email
- Canonical: `https://rebase-flow.lovable.app/contact`
- Full OG + Twitter tags
- JSON-LD `ContactPage` + `LocalBusiness` reference

**2. `src/pages/Membership.tsx`** — Add JSON-LD inside existing `<Helmet>`:
- Schema type: `Product` or `Service` describing the membership offering with `Offer` pricing tiers (using whatever tiers the page already shows).

**3. `src/pages/Experiences.tsx`** — Add JSON-LD inside existing `<Helmet>`:
- Schema type: `ItemList` of `Service` items derived from the experience categories (contrast therapy, cryotherapy, breathwork, HBOT, IV therapy, etc. — pulled from `serviceConfig.ts`).

**4. `public/sitemap.xml`** — Add entries:
- `https://rebase-flow.lovable.app/contact` (priority 0.7, monthly)
- `https://rebase-flow.lovable.app/experiences` (priority 0.9, weekly)
- Update all `<lastmod>` dates to today.

**5. `public/robots.txt`** — Add disallow rules for non-public routes:
```
Disallow: /account
Disallow: /reception
Disallow: /dashboard
Disallow: /auth
Disallow: /login
```
Keep `/` allowed (mobile app shell — Google won't index meaningfully but no harm).

### Brand rule

All new copy uses "Rebase" (never ReBase / REBASE), per Core memory.

### Out of scope

- No changes to the mobile app shell (`AppShell` / `/` route) — it's a SPA-only experience without static SEO surface.
- Internal admin/auth pages (`/reception`, `/account`, `/auth`, `/login`, `/dashboard`) — explicitly disallowed in robots, no Helmet needed.
- No changes to existing JSON-LD on `Index.tsx` (already correct).

### Files to edit

- `src/pages/Contact.tsx` (add Helmet + JSON-LD)
- `src/pages/Membership.tsx` (add JSON-LD)
- `src/pages/Experiences.tsx` (add JSON-LD)
- `public/sitemap.xml` (add 2 URLs, update lastmod)
- `public/robots.txt` (add disallow rules)
