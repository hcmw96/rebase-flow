

# Fix Safe Area Insets for Despia Native — All Locations

## Problem
`BookingDrawer.tsx` uses `env(safe-area-inset-top)` directly in two inline styles (lines 242 and 276), bypassing Despia's `--safe-area-top` CSS variable. This means the close/back buttons sit behind the native status bar.

`AppShell.tsx` and `index.css` already use the correct `var(--safe-area-top, env(...))` fallback chain — no changes needed there.

## Fix

### `src/components/booking/BookingDrawer.tsx`
Update the two inline `paddingTop` styles:

**Line 242** (hero image header):
```
paddingTop: 'max(1rem, env(safe-area-inset-top))'
→
paddingTop: 'max(1rem, var(--safe-area-top, env(safe-area-inset-top, 0px)))'
```

**Line 276** (non-image header):
```
paddingTop: 'max(1rem, env(safe-area-inset-top))'
→
paddingTop: 'max(1rem, var(--safe-area-top, env(safe-area-inset-top, 0px)))'
```

## Files modified
- `src/components/booking/BookingDrawer.tsx` (2 lines)

