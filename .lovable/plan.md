

## Hide "Corporate" service variants

The Mindbody catalogue contains corporate variants (e.g. "Premium Suite (60 Mins) - Corporate" at £1920) that shouldn't appear in the public booking flow.

### Change

**`src/config/serviceConfig.ts`** — add a regex-based hidden-name filter alongside the existing `hiddenServiceNames` set:

```ts
export const hiddenServiceNamePatterns: RegExp[] = [
  /\bcorporate\b/i,
];

export function isHiddenServiceName(name: string): boolean {
  const trimmed = name.trim();
  if (hiddenServiceNames.has(name) || hiddenServiceNames.has(trimmed)) return true;
  return hiddenServiceNamePatterns.some((re) => re.test(trimmed));
}
```

**Update the 4 consumers** to call `isHiddenServiceName(service.name)` instead of `hiddenServiceNames.has(...)`:
- `src/pages/Services.tsx`
- `src/components/ExperienceDrawer.tsx`
- `src/components/WebsiteServices.tsx`
- `src/widget/components/ServiceList.tsx`

### Result
Any Mindbody service whose name contains "Corporate" (Premium Suite Corporate, Massage Corporate, etc.) is filtered out everywhere — mobile app, marketing site, experience drawer, and embeddable widget. This will also fix the misleading £1920 price showing on Premium Suite.

### Out of scope
- The existing `'Corporate Credits'` entry in `hiddenGroupNames` stays.
- Copy on the Membership page mentioning "corporate athletes" is untouched — only Mindbody service/variant names are filtered.

