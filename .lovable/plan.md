

## Problem
In the experience drawer, the service description text overlaps with the "X spots" availability badge on the right side, looking cramped/broken.

## Fix
In `src/components/ExperienceDrawer.tsx`, add right-side padding to the description text container (or constrain its width) so the description always wraps before reaching the spots badge.

Likely change: wrap the title/description block in a container with `pr-16` (or `flex-1 min-w-0` + `pr-4`) so text truncates/wraps cleanly before the absolutely/flex-positioned spots indicator.

## Files
- `src/components/ExperienceDrawer.tsx` — adjust the service/class card layout so description text reserves space for the spots badge.

