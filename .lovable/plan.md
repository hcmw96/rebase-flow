

# Add "Book Now" Button to Mobile Header

## Problem
On mobile, the header only shows the logo and hamburger menu. The "Book Now" button is hidden inside the mobile menu drawer, so users can't see it while scrolling.

## Fix

### `src/components/Navigation.tsx`
Add a compact "Book Now" button next to the hamburger icon in the mobile header bar (the `lg:hidden` section around line 207).

Change the mobile right-side from just the hamburger to a flex row with both a "Book Now" button and the hamburger:

```tsx
{/* Mobile: Book Now + Hamburger */}
<div className="lg:hidden flex items-center gap-2">
  <Button
    variant="outline"
    size="sm"
    onClick={handleBookNow}
    className="text-[11px] tracking-[0.08em] px-3 h-8 rounded-none border-[#F9ECD9]/20 bg-[#F9ECD9]/10 text-[#F9ECD9] hover:bg-[#F9ECD9]/20"
  >
    Book Now
    <ArrowRight className="ml-1 h-3 w-3" />
  </Button>
  <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)} className={textColor}>
    {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
  </Button>
</div>
```

This keeps the button always visible in the mobile header as you scroll, matching the screenshot reference.

## Files modified
- `src/components/Navigation.tsx`

