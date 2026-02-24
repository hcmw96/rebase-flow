

## Preload Services During Login

### Problem
Services only start fetching after the user successfully logs in and the Home/Services page mounts. The Mindbody services API call takes several seconds, so there's a noticeable delay.

### Solution
Prefetch the services data at the app root level so the fetch begins immediately on app load -- even while the user is still on the login screen. Since the services endpoint doesn't require authentication, we can safely call it before the user signs in.

### Technical Details

**File: `src/App.tsx`**
- Import `fetchServices` (currently not exported) and the `queryClient`
- Call `queryClient.prefetchQuery` for `['mindbody-services']` at module level (outside the component) so it fires on initial page load, before auth resolves

**File: `src/hooks/useMindbodyServices.ts`**
- Export the `fetchServices` function so it can be imported by `App.tsx`

**Implementation:**
```typescript
// In useMindbodyServices.ts - just add "export" to fetchServices
export async function fetchServices(): Promise<MindbodyService[]> { ... }

// In App.tsx - prefetch at module level
import { fetchServices } from '@/hooks/useMindbodyServices';

const queryClient = new QueryClient();

// Fire immediately on app load, before any component renders
queryClient.prefetchQuery({
  queryKey: ['mindbody-services'],
  queryFn: fetchServices,
  staleTime: 5 * 60 * 1000,
});
```

This means the services data will already be cached by the time the user finishes typing their credentials and signing in. No component changes needed -- `useMindbodyServices()` will find the data already in the React Query cache.

### Files to modify
- `src/hooks/useMindbodyServices.ts` -- export `fetchServices`
- `src/App.tsx` -- add prefetch call
