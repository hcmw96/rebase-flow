

# Add Athletes Performance Package Image

## What changes
1. **Save the uploaded image** to `public/images/rebase-athletes-performance.jpg`
2. **Add a grouping pattern** in `serviceConfig.ts` to match "Athletes Performance" (and variations) from Mindbody API
3. **Add image mapping** in the `serviceImages` record: `'Athletes Performance': '/images/rebase-athletes-performance.jpg'`
4. **Ensure it's not hidden** — verify it's not in `hiddenGroupNames`
5. **Add category override** if needed — likely fits under an existing category (will check what Mindbody program it falls under, but a reasonable default would be a recovery/wellness category)

## Questions to confirm
- The service name from Mindbody is assumed to be something like "Athletes Performance Package" — the regex pattern will be flexible to match variations.
- If it should go under a specific category (e.g., "Private Suites", "Regen and Manual Therapies"), I'll need guidance, otherwise I'll let it fall through to its Mindbody program category.

## Files modified
- `public/images/rebase-athletes-performance.jpg` — new asset
- `src/config/serviceConfig.ts` — add grouping pattern, image mapping

