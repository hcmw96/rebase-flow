
Fix the Core Radiance image on `/website` by applying the existing focal-point config to the website services grid.

1. Root cause
- The current `Core Radiance` focal point is already defined in `src/config/serviceConfig.ts` as:
```ts
'Core Radiance': 'center 20%'
```
- But the `/website` page does not use that config.
- `src/components/WebsiteServices.tsx` renders its own `<img>` for service cards and currently uses plain `object-cover` with no `objectPosition`, so the image defaults to centered cropping.

2. Update `src/components/WebsiteServices.tsx`
- Import `serviceImagePositions` from `@/config/serviceConfig`
- In the service-card image inside the website grid, add:
```tsx
style={{ objectPosition: serviceImagePositions[service.baseName] || 'center' }}
```
- Keep the existing `object-cover`, lazy loading, and hover scale behavior

3. Leave central config as the source of truth
- Do not hardcode Core Radiance positioning inside the component
- Keep the focal point controlled from `src/config/serviceConfig.ts` so website, app cards, and compact cards all stay aligned

4. If needed after wiring it correctly
- If `center 20%` still crops too low once actually applied on `/website`, then fine-tune only the config value for `Core Radiance` in `serviceImagePositions` (for example to something closer to the top)

Files to modify
- `src/components/WebsiteServices.tsx`

Technical detail
```text
Current:
serviceImagePositions exists
ServiceCard uses it
ServiceCardCompact uses it
WebsiteServices does not

Target:
WebsiteServices service card image also uses serviceImagePositions
=> Core Radiance crop finally matches the intended focal point on /website
```
