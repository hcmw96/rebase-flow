

## Improving Services Page UX: Reducing Scroll with Smart Layout

### Current Problem

The Services page currently displays services in a vertical list (mobile) or grid (desktop), requiring excessive scrolling to see all available services. With approximately 15+ services, users must scroll significantly to discover what's available.

### Recommended Solution: Collapsible Category Sections with Service Chips

The smartest UX approach combines multiple proven patterns:

```text
+------------------------------------------+
|  [Search Bar]                            |
+------------------------------------------+
|  Recovery                          [v]   |
|  +------+ +------+ +------+ +------+     |
|  |Cryo  | |HBOT  | |Ozone | |More..|     |
|  |£45   | |£120  | |£85   | |+3    |     |
|  +------+ +------+ +------+ +------+     |
+------------------------------------------+
|  Wellness                          [v]   |
|  +------+ +------+ +------+              |
|  |Sauna | |Suite | |...   |              |
|  +------+ +------+ +------+              |
+------------------------------------------+
|  Classes                           [>]   |  <- Collapsed
+------------------------------------------+
```

### Key UX Improvements

1. **Grouped by Category**: Services are organized into collapsible sections by category (Recovery, Wellness, Classes, etc.)

2. **Horizontal Scroll within Categories**: Each category shows services in a horizontal scrollable row, fitting 3-4 services visible at once

3. **Compact "Chip" Cards**: Smaller service cards showing just:
   - Thumbnail image
   - Service name
   - Price (or "From £X")
   - Duration indicator

4. **Expandable Categories**: Categories start expanded but can be collapsed to quickly jump between sections

5. **"Show All" Option**: Each category has a subtle link to expand to full grid view if needed

### Why This is the Best UX

- **Reduces vertical scroll by ~70%**: All categories visible without scrolling on most screens
- **Information scent**: Users immediately see all service categories
- **Progressive disclosure**: Details revealed on tap/click
- **Familiar pattern**: Similar to food delivery apps, app stores, streaming services
- **Mobile-first**: Optimized for thumb scrolling

---

## Technical Implementation

### Files to Modify

**1. Create `src/components/ServiceChip.tsx`** (new file)
   - Ultra-compact service card component
   - ~80px x 100px size
   - Image, title, price only
   - Click navigates to booking

**2. Create `src/components/CategorySection.tsx`** (new file)
   - Collapsible section with category header
   - Horizontal scroll container for service chips
   - "See all" link to expand
   - Animated expand/collapse

**3. Modify `src/pages/Services.tsx`**
   - Replace current grid/list view with CategorySection components
   - Group services by category
   - Keep search bar (filters across all categories)
   - Keep sticky header behavior

### Component Structure

```text
Services.tsx
  ├── Navigation
  ├── SearchBar (sticky)
  ├── CategorySection (Recovery)
  │     └── ServiceChip[] (horizontal scroll)
  ├── CategorySection (Wellness)
  │     └── ServiceChip[]
  ├── CategorySection (Classes)
  │     └── ServiceChip[]
  └── Footer
```

### ServiceChip Design

```tsx
// Compact card ~80px wide
<div className="w-20 flex-shrink-0">
  <div className="aspect-square rounded-lg overflow-hidden">
    <img src={image} />
  </div>
  <p className="text-xs font-medium truncate mt-1">{title}</p>
  <p className="text-xs text-muted-foreground">£{price}</p>
</div>
```

### CategorySection Behavior

- **Default state**: Expanded, showing horizontal scroll of services
- **Collapsed state**: Just the header, tap to expand
- **Header shows**: Category name + service count + expand/collapse icon
- **Smooth animation**: Using framer-motion for expand/collapse

### Search Integration

- Search filters services across all categories
- Empty categories are hidden when filtering
- Highlights matching text in results

### Mobile vs Desktop

- **Mobile**: Full horizontal scroll, collapsed categories
- **Desktop**: Can show 2 rows of horizontal scrolls side-by-side, or keep current grid for larger screens

---

## Alternative Considered: Tabs

Tabs would also reduce scroll but have drawbacks:
- Hides other categories completely
- Requires extra tap to discover services
- Less efficient for comparing across categories

The collapsible sections approach shows more at once while remaining scannable.

