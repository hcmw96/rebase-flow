# Members page — premium signed-in dashboard

## Goal

Replace the current `/account` link target behind the marketing site's "Members" button with a dedicated, richer **Members** experience at `/members`. It is signed-in only — if the user isn't logged in, it triggers the existing Mindbody OAuth flow. The mobile app `/account` route stays as-is.

## Prerequisite

The data layer fix from the previous task (resolve numeric `mindbody_client_id` so contracts/memberships actually return) needs to land first — otherwise the dashboard will look empty for everyone. Plan covers the page; if memberships still come back empty, the page degrades gracefully with neutral copy.

## Layout

Marylebone-style editorial layout, dark brown on warm cream, generous space, no glassmorphism, no emojis. Three columns desktop, single column mobile.

```text
┌──────────────────────────────────────────────────────────────────┐
│  Welcome back, {firstName}                                       │
│  Your Rebase membership                            [tier badge]  │
├──────────────────────────────────────────────────────────────────┤
│  TIER CARD (full width, hero)                                    │
│   Resident · since Jun 2024 · auto-renews 12 May                 │
│   [Manage in Mindbody ↗]   [Upgrade →]                           │
├──────────────────────┬───────────────────┬───────────────────────┤
│  ALLOWANCES          │  NEXT SESSION     │  QUICK BOOK           │
│  Cryotherapy 6/8     │  Tomorrow 09:30   │  Cryotherapy →        │
│  HBOT       1/3      │  HBOT · Jamie     │  Communal Contrast →  │
│  Classes    4/8      │  [Manage]         │  Classes →            │
│  …progress bars      │                   │  PT Session →         │
├──────────────────────┴───────────────────┴───────────────────────┤
│  UPCOMING (next 5)                          [view all →]         │
│   row · row · row                                                │
├──────────────────────────────────────────────────────────────────┤
│  MEMBER PERKS                                                    │
│   10% off treatments · Guest passes · Early class booking · …    │
├──────────────────────────────────────────────────────────────────┤
│  RECENT SESSIONS (last 5)             [full history →]           │
├──────────────────────────────────────────────────────────────────┤
│  CONCIERGE              │  ACCOUNT                               │
│   Message Rebase form   │  Email · Sign out                      │
└──────────────────────────────────────────────────────────────────┘
```

## Sections

### 1. Hero
- "Welcome back, {firstName}"
- Tier name (largest type), since date, renewal date, auto-renew badge
- If no active membership: hero says "You don't have a Rebase membership yet" with **[Become a Member →]** to `/membership`
- Right-aligned chip showing tier (Base / Resident / Ultimate) styled per tier

### 2. Allowances (credits + membership entitlements)
- Compute used vs included from `clientServices` (`Remaining` + the tier's monthly inclusion from `tiers` in `Membership.tsx`)
- Render as horizontal progress bars: label · "X of Y this month" · subtle progress
- Falls back to "Unlimited" pill where the tier definition says so
- If no allowances data, hide the section

### 3. Next session
- Pulls from `useMyBookings`, picks the soonest future booking
- Shows date relative ("Tomorrow", "Friday"), time, service, staff, location
- Buttons: **Manage** (opens MyBookings), **Re-book similar**

### 4. Quick book
- Top 4 most-booked services for this user (derived from past bookings) or fall back to: Cryotherapy, HBOT, Communal Contrast, Classes
- Each tile is a `Link` to `/book/{serviceId}` (the existing booking flow)

### 5. Upcoming (next 5)
- List of next 5 bookings, compact row design
- "View all" → opens existing MyBookings drawer/sheet pattern

### 6. Member perks
- Static list pulled from a new `MEMBER_PERKS` constant in `src/config/serviceConfig.ts`:
  - 10% off all treatments
  - Guest passes (count varies by tier — read from `tiers`)
  - Early class booking window
  - Complimentary towels & robes
  - Member-only events (chip: "Coming soon")

### 7. Recent sessions
- Last 5 past bookings (already in AccountPage). "Full history →" expands inline.

### 8. Concierge + Account
- Two-column footer row:
  - Concierge: textarea + send (mailto reception@rebaserecovery.com), reuses logic from AccountPage
  - Account: email, "Sign out" button, "Edit profile in Mindbody ↗" external link

## Routing & nav

- New route `/members` → new `MembersPage` component
- `Navigation.tsx`: change "Members" button `to="/account"` → `to="/members"` (both desktop and mobile menus)
- `WebsiteAccount.tsx` (`/account`) keeps existing behaviour for backwards compat
- Mobile app's bottom-tab `/account` remains untouched
- If unauthenticated, `MembersPage` shows a centered "Sign in to Rebase" card with the existing OAuth login button — same pattern as `AccountPage`

## Files

**New**
- `src/pages/MembersPage.tsx` — page shell with sections above
- `src/components/members/TierHero.tsx`
- `src/components/members/AllowancesGrid.tsx`
- `src/components/members/NextSessionCard.tsx`
- `src/components/members/QuickBookGrid.tsx`
- `src/components/members/UpcomingList.tsx`
- `src/components/members/MemberPerks.tsx`
- `src/components/members/ConciergeForm.tsx`
- `src/lib/membershipTiers.ts` — small helper that maps a Mindbody membership name (case-insensitive contains "base"/"resident"/"ultimate") to the local tier config from `Membership.tsx` so we can compute allowances and perks

**Edited**
- `src/App.tsx` — register `/members` route
- `src/components/Navigation.tsx` — point Members button at `/members` (desktop + mobile)
- `src/config/serviceConfig.ts` — add `MEMBER_PERKS` (or move it next to tier config)

## Design tokens (use existing, no new colors)
- Background `bg-[#F9ECD9]`, foreground `text-[#3B2712]`
- Card surfaces `bg-white/40 border border-black/[0.06]` (matches AccountPage)
- Tier badges: subtle differentiation only — `bg-[#3B2712]/5` with tier-name in text, no neon
- Inter, tight letter spacing on headings (per typography memory)

## Out of scope

- Editing membership / payment changes (deep-link to Mindbody instead)
- Push notifications or in-app messaging
- The data-layer fix to resolve numeric Mindbody ClientId (tracked separately; this page degrades gracefully without it)
