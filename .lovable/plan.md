

# Fix Hyaluronic Acid Service Hiding (Misspelling)

## Problem
The Mindbody API returns "Hyalouronic" (with an extra 'o') instead of "Hyaluronic", so the current regex `/hyaluronic/i` doesn't match.

## Fix

### `src/config/serviceConfig.ts`
1. Update the regex pattern in `serviceGroupMappings` to handle both spellings:
   ```typescript
   { pattern: /hyalou?ronic/i, groupName: 'Hyaluronic' },
   ```

2. Add the misspelled variants to `hiddenServiceNames`:
   ```typescript
   'Hyalouronic Acid - 1 Joint',
   'Hyalouronic Acid - 2 Joints',
   ```

This double-coverage ensures the services are caught both by group canonicalization and by exact name matching.

## Files modified
- `src/config/serviceConfig.ts`

