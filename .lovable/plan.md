

## Navigation Updates

Three changes to `src/components/Navigation.tsx`:

### 1. Remove uppercase from nav link labels
Remove `uppercase` class from nav links (desktop and mobile) so they render as written ("Experiences", "About", "Contact").

### 2. Move nav links to the left alongside buttons
Change layout from the current logo-left / links-center / buttons-right to: logo-left / links+buttons all on the right. Remove the centered `div` and merge nav links into the right-side `div` so everything sits together on the right.

### 3. Scroll-based background change
Add a `scrolled` state using a scroll listener (threshold ~20px). When scrolled:
- Nav background: `bg-[#F9ECD9]` with `border-[#3B2712]/10`
- Logo: remove `invert` filter (logo goes dark brown naturally, or apply `brightness-0` without invert to make it dark)
- Nav link text: `text-[#3B2712]` (dark brown)
- Buttons: dark brown borders/text (`border-[#3B2712]/20`, `text-[#3B2712]`, `bg-[#3B2712]/10`)
- Smooth transition on all properties (`transition-all duration-300`)

When not scrolled (at top): keep current transparent background with cream `#F9ECD9` text/borders (replacing any remaining `white` references).

### File
- `src/components/Navigation.tsx` — single file change

