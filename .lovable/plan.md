

# Fix: Header Overlapping Content on Scroll

## Problem
The navigation bar is `fixed` with `z-50` and height `h-20` (80px), but the `WebsiteServices` section (and likely Hero) don't account for this. When scrolling, the "Our Experiences" heading and content scroll beneath the nav bar.

## Solution

**File: `src/components/WebsiteServices.tsx`**

Add `pt-20` (padding-top: 80px) to the outermost wrapper of the services section so content clears the fixed navbar. Alternatively, if the Hero already fills the viewport, the fix may only be needed on the services section's top padding — looking at the screenshot, the services section heading "Our Experiences" is directly under the nav, so adding `scroll-margin-top` or increasing the section's top padding by ~80px will fix the overlap.

Specifically: find the root `<section>` or container in `WebsiteServices` and increase its top padding from whatever it currently is to include an extra `5rem` (80px) to clear the fixed nav.

Single file change, one line adjustment.

