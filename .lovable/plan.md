## Plan

### 1. Unify "Book Now" → `/experiences`
Today, half the Book Now buttons go to `/book/...` (deep links to a specific service). Repoint every Book Now in chrome to `/experiences` so users always land on the same browse-and-pick screen.

Files:
- `src/components/Footer.tsx` — change Quick Links `/book` → `/experiences`.
- `src/components/AboutSection.tsx`, `src/pages/About.tsx`, `src/pages/IceSauna.tsx` — replace `/book/<id>` Book Now CTAs with `/experiences`.

The `/book/:id` route stays alive for shared links.

### 2. Activate footer links
- **Quick Links**: already render as `<Link>`, just repoint Book Now (above) and change About Us from `/website#about` to `/about`.
- **Services column**: convert each item to a `<Link to="/experiences">` so every service is clickable and lands on the browse screen. (Simpler and more reliable than per-item deep links, which would break whenever Mindbody renames a service.)
- **Social icons**: remove the placeholder `href="#"` icons for now (they currently look broken). Easy to add back when real URLs are provided.
- **Phone**: hide the placeholder `+44 (0) 20 XXXX XXXX` row until a real number is provided. Email stays.
- **Cookie Policy** link already works.

### 3. Fix broken Explore buttons
Investigation: `categoryOverrides` in `serviceConfig.ts` is already correct — Mindbody groups *do* map to the right experience name. The "Services temporarily unavailable" message therefore fires in two real situations:

a. **Live Mindbody API is failing/empty** (currently true — the recent 401s mean `useMindbodyServices` returns nothing, so every drawer except Signature Classes shows the empty state).
b. **Communal Contrast** experience renders no entries because the only matching group ("Members Suite") is class-based (`classDescriptionIds: [5]`) and lives in a different code path.

Fixes:
1. In `ExperienceDrawer.tsx`, when `services` is empty/failing, **fall back to `staticWebsiteCatalogue`** from `serviceConfig.ts` filtered by `category === experience.name`. That catalogue already covers every experience including Members Suite, with prices and short descriptions. Users still see something useful even if Mindbody is down.
2. For **Communal Contrast** specifically, render the Members Suite card from the static catalogue and route its tap to the existing communal-class booking flow (the one that uses `classDescriptionIds: [5]`).

Result: every Explore button shows real content under any Mindbody state.

### 4. Rename "Members" → "Sign in"
In `src/components/Navigation.tsx`, change both `Members` button labels (desktop + mobile) to `Sign in`. Keep the route `/members` for now — the destination is the right one (it triggers login when not authed).

### 5. Mindbody-side rename: "Members Suite" → "Communal Contrast"
This one is a setting you change inside Mindbody admin (rename the service/program). Our code already maps `Members Suite` → `Communal Contrast`, so:
- If you rename in Mindbody, no code change is needed; the website keeps working.
- If you want belt-and-braces, I'll also add `^communal\s*contrast` to `serviceGroupMappings` in `serviceConfig.ts` so the new Mindbody name flows through cleanly the moment you rename.

### Out of scope
- The separate Mindbody OAuth/API key issue (different thread; once that's resolved live data returns and the fallback step in #3 stays as safety).
- Visual redesign of footer/nav.

If anything above isn't what you want (e.g. you'd prefer to keep `/book/:id` deep links from the footer, or want a different label than "Sign in"), say so before I implement. Otherwise approve and I'll ship.
