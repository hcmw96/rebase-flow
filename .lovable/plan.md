

# Plan: Collapse Service Categories into Accordions

## What
Replace the current always-visible category sections in `WebsiteServices.tsx` with accordions so each category collapses/expands. The first category will default to open.

## How

**File: `src/components/WebsiteServices.tsx`**

1. Import `Accordion, AccordionItem, AccordionTrigger, AccordionContent` from `@/components/ui/accordion`
2. Replace the current `servicesByCategory` loop (which renders `<motion.div>` per category with an `<h3>` header and grid) with an `<Accordion type="multiple" defaultValue={[firstCategory]}>` wrapper
3. Each category becomes an `<AccordionItem>` with:
   - `AccordionTrigger`: the category name (styled with uppercase tracking, matching current `<h3>` style)
   - `AccordionContent`: the service card grid (unchanged)
4. Style overrides on the accordion primitives to match the dark theme — remove default underline hover, use `#F9ECD9` colors, border color `#F9ECD9/10`

No other files need changes.

