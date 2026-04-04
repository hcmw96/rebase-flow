

# Map "Members Only" to Communal Members Suite

## Problem
A Mindbody service called "Members Only" is slipping through as a separate card with lowercase text and "Contact for pricing". Per the Mindbody dashboard, this is a Members Suite session and should appear under the "Communal Members Suite" category — not be hidden or shown as its own card.

## Fix

### `src/config/serviceConfig.ts`

1. **Remove** `'Members Only'` from `hiddenGroupNames` (line 51)
2. **Add** a regex to `serviceGroupMappings` to canonicalize it to `"Members Suite"`:
   ```ts
   { pattern: /^members?\s*(only|suite)/i, groupName: "Members Suite" }
   ```
3. **Add** `'Members Suite'` to `categoryOverrides` mapping to `'Communal Members Suite'` (already partially there via `programNameOverrides`, but adding explicitly to `categoryOverrides` ensures it resolves correctly)

This will make "Members Only" sessions appear as part of the existing Members Suite group under "Communal Members Suite".

## Files modified
- `src/config/serviceConfig.ts`
