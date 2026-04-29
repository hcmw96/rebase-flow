# Fix Contact page scroll & faded UI

## What's wrong

The `/contact` page has two issues visible in your screenshot:

1. **It doesn't scroll.** Every other informational page (e.g. Membership) wraps its content in a fixed full-viewport container with `overflowY: auto`. Contact only uses `min-h-screen`, so when a parent has `overflow: hidden` (as the app shell does), there's no scroll container and the page is effectively cut off at the viewport.
2. **The UI looks washed out / ghostly.** The page has no explicit background, so it sits on a transparent surface. Combined with `text-foreground/70` body copy and the `text-glow` heading effect, the hero ("Get In Touch", subtitle) renders at very low contrast — exactly what the screenshot shows. The content cards below render fine because they have their own `card-luxury` background.

## Fix

Mirror the proven pattern already used by `Membership.tsx` (per the App Layout memory: bounded-viewport wrapper for informational pages).

**`src/pages/Contact.tsx`** — change the root wrapper:

```tsx
// before
<div className="min-h-screen">

// after
<div
  style={{ position: "fixed", inset: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }}
  className="bg-[#1a1a1a]"
>
```

That single change:
- Establishes a dedicated scroll container (fixes scroll).
- Adds the dark luxury background so the hero text reads at full intended contrast (fixes the washed-out look).

No other changes needed — Navigation, hero, contact cards, form, and FAQ already use the right semantic tokens once the background is in place.

## Files touched

- `src/pages/Contact.tsx` (root `<div>` only)
