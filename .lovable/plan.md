

# Filter Out Inactive Mindbody Services

## Problem
The `mindbody-services` edge function fetches all session types from Mindbody's API without checking whether they are active. This means inactive/retired services appear in your app.

## Solution
Add a filter in the edge function to only include session types where the Mindbody API marks them as active. The Mindbody `/site/sessiontypes` response includes fields like `Active` (boolean) on each session type object.

## Changes

### 1. Update `supabase/functions/mindbody-services/index.ts`

After fetching session types on line 105, add a filter to remove inactive ones:

```typescript
const allSessionTypes = sessionTypesData.SessionTypes || [];
const sessionTypes = allSessionTypes.filter((st: any) => st.Active !== false);
console.log(`Filtered: ${allSessionTypes.length} total -> ${sessionTypes.length} active session types`);
```

This single change filters at the source before any price matching or mapping occurs, so inactive services won't appear anywhere in the app (main app, widget, or homepage).

### What this affects
- The Services page listing
- The Homepage popular services
- The embeddable widget service list
- All share the same edge function, so one fix covers everything

### Approach details
- Uses `st.Active !== false` (rather than `=== true`) to be safe in case the field is undefined on some session types -- those will still be included
- Logs the before/after count so you can verify which services were filtered out

