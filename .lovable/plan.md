

# Add Image to Ultimate Membership Tier

## What
Copy the uploaded image to the project and display it as a hero/banner image on the Ultimate membership card.

## Changes

### 1. Copy image asset
Copy `user-uploads://LouisWaite_RebaseRecovery_MembersSuite_Class_334_1.webp` to `public/images/rebase-ultimate-membership.webp`

### 2. `src/pages/Membership.tsx`
Add an `image` field to the Ultimate tier in the `tiers` array:
```ts
{
  name: "Ultimate",
  image: "/images/rebase-ultimate-membership.webp",
  ...
}
```

Update the card rendering to show the image at the top of the card when present — a full-width image with `object-cover` above the tier name, inside the existing `motion.div`.

## Files modified
- `src/pages/Membership.tsx`
- `public/images/rebase-ultimate-membership.webp` (new)

