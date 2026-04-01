
Fix the Membership page by switching it to the same full-viewport scroll-container pattern already used by the marketing pages.

1. Update `src/pages/Membership.tsx`
- Replace the current root wrapper:
```tsx
<div className="min-h-screen overflow-y-auto bg-[#1a1a1a]">
```
- With a bounded viewport container:
```tsx
<div
  className="bg-[#1a1a1a]"
  style={{ position: "fixed", inset: 0, overflowY: "auto", WebkitOverflowScrolling: "touch" }}
>
```

2. Keep the existing page structure inside that container
- `Navigation`
- hero section
- tier cards
- `Footer`

3. Why this is the real fix
- Global CSS sets `html, body { overflow: hidden; height: 100%; }`
- That means `/membership` cannot rely on normal document scrolling
- `min-h-screen` or even `h-screen` alone is not enough here unless the page itself becomes the bounded scroll viewport
- `/website` and `/cookie-policy` already solve this by using a fixed inset container with `overflowY: auto`

4. Optional cleanup while touching the file
- Add `className="min-h-full bg-[#1a1a1a]"` to an inner wrapper only if needed for background continuity, but this is not required for scrolling

5. Files to modify
- `src/pages/Membership.tsx`

Technical detail
```text
Current setup:
html/body/root app -> overflow hidden
membership page -> expands with content
result -> no usable page scroll

Target setup:
html/body/root app -> overflow hidden
membership page -> position: fixed; inset: 0; overflow-y: auto
result -> membership becomes its own scroll viewport
```
