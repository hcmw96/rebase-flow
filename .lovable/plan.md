

# Fix Missing "Communal Members Suite" Category

## Problem
Services from the "Member's Suite" Mindbody program are not appearing because their raw `programName` ("Member's Suite") doesn't match the category order key "Communal Members Suite". The `categoryOverrides` map only works for canonical service names, not for services that fall through to using their raw programName as the category.

## Root Cause
In the category assignment logic (line 220-221), when a service's canonical name isn't found in `categoryOverrides`, the raw `programName` is used as the category. But `programName` values like "Member's Suite" don't match "Communal Members Suite" in `categoryOrder`, so they get filtered out.

## Fix

**File: `src/components/WebsiteServices.tsx`**

Add a `programNameOverrides` map that translates raw Mindbody program names to the correct display category:

```typescript
const programNameOverrides: Record<string, string> = {
  "Member's Suite": 'Communal Members Suite',
  'Members Suite': 'Communal Members Suite',
};
```

Then update the category assignment (around line 220) to use this map as a fallback:

```typescript
let category = categoryOverrides[canonicalName]
  || programNameOverrides[rawCategory]
  || (rawCategory.startsWith('Sauna Suite') ? 'Private Suites' : rawCategory);
```

This ensures any service whose programName is "Member's Suite" (or "Members Suite") that doesn't already have a canonical name override will correctly land in the "Communal Members Suite" accordion.

