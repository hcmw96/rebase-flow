

# Plan: Show Full Description on Hover

**File: `src/components/WebsiteServices.tsx`**

1. Import `HoverCard, HoverCardTrigger, HoverCardContent` from `@/components/ui/hover-card`
2. Wrap each service card (`motion.button`) with `HoverCardTrigger`, and add a `HoverCardContent` that displays the full stripped description
3. Style the hover card content to match the dark theme (`bg-[hsl(25,15%,14%)]`, `text-[#F9ECD9]`, `border-[#F9ECD9]/10`)
4. Remove the `line-clamp-2` from the inline description since the hover card provides the full text — or keep it clipped inline and only show full text in the hover card

This uses the existing Radix HoverCard primitive already in the project. No other files change.

