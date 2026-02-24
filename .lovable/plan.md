

## Two Changes

### 1. Sort "Initial Consultation" variants before "Follow Up" variants

Currently, `src/pages/Services.tsx` sorts variants only by duration. The widget (`ServiceList.tsx`) already prioritizes "first consultation" variants but doesn't handle "initial" vs "follow up" ordering.

**Changes in both files** (`src/pages/Services.tsx` and `src/widget/components/ServiceList.tsx`):
- Update variant sorting to place any variant whose name contains "initial" or "first consult" before variants containing "follow up", then sort by duration as a tiebreaker.

### 2. Remove images from non-tech-therapy service chips

"Tech therapies" are: Infrared Sauna & Ice Bath, The Midday Reset (Infrared/Premium), Premium Suite, Cryotherapy, and Hyperbaric Oxygen. All other services (massages, osteopathy, reflexology, IV drips, etc.) should render without an image thumbnail.

**Changes:**
- In `src/components/ServiceChip.tsx` (app): Accept an optional `hideImage` prop. When true, skip rendering the image/thumbnail and show a simpler text-only chip.
- In `src/components/CategorySection.tsx` (app): Determine whether a category's services are "tech therapies" based on their names. Pass `hideImage` to `ServiceChip` for non-tech services.
- In `src/widget/components/ServiceChip.tsx` (widget): Same `hideImage` logic.
- In `src/widget/components/CategorySection.tsx` (widget): Same category-level logic.

### Technical Details

**Variant sorting** (both files):
```typescript
group.variants.sort((a, b) => {
  const aInitial = /initial|first\s*consult/i.test(a.name) ? 0 : 1;
  const bInitial = /initial|first\s*consult/i.test(b.name) ? 0 : 1;
  const aFollowUp = /follow\s*up/i.test(a.name) ? 1 : 0;
  const bFollowUp = /follow\s*up/i.test(b.name) ? 1 : 0;
  if (aInitial !== bInitial) return aInitial - bInitial;
  if (aFollowUp !== bFollowUp) return aFollowUp - bFollowUp;
  return (a.duration ?? 0) - (b.duration ?? 0);
});
```

**Tech therapy detection** (used in CategorySection to decide `hideImage`):
```typescript
const techTherapies = new Set([
  'Infrared Sauna & Ice Bath',
  'The Midday Reset - Infrared Suite',
  'Premium Suite',
  'The Midday Reset - Premium Suite',
  'Cryotherapy',
  'Hyperbaric Oxygen',
]);
const showImage = techTherapies.has(service.baseName);
```

**ServiceChip without image**: When `hideImage` is true, render just the title, duration, and price in a compact card without the square image thumbnail.

### Files to modify
- `src/pages/Services.tsx` -- variant sort fix
- `src/widget/components/ServiceList.tsx` -- variant sort fix
- `src/components/ServiceChip.tsx` -- add `hideImage` prop
- `src/components/CategorySection.tsx` -- pass `hideImage` based on tech therapy check
- `src/widget/components/ServiceChip.tsx` -- add `hideImage` prop
- `src/widget/components/CategorySection.tsx` -- pass `hideImage` based on tech therapy check
