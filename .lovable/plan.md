

# Adjust Core Radiance Image Position

## Summary
The Core Radiance card image crops at the top, hiding the face. Add a per-service `objectPosition` override so the image shifts down to show the face.

## Changes

### 1. `src/config/serviceConfig.ts`
Add a new config map for custom image positions:
```typescript
export const serviceImagePositions: Record<string, string> = {
  'Core Radiance': 'center 80%',
};
```

### 2. `src/components/ServiceCardCompact.tsx`
- Import `serviceImagePositions` from config
- On the `<img>` tag, apply `style={{ objectPosition: serviceImagePositions[title] || 'center' }}` so Core Radiance shifts the focal point down.

### 3. `src/components/ServiceCard.tsx`
- Same change: import `serviceImagePositions` and apply the `objectPosition` style to the card image.

## Files modified
- `src/config/serviceConfig.ts`
- `src/components/ServiceCardCompact.tsx`
- `src/components/ServiceCard.tsx`

