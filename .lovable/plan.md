

## Redesign the "Next Section" after the Hero

Based on the reference screenshot and requirements, this section sits below the hero and features:
1. A dark bokeh background image (the uploaded `Untitled_design_72.png`)
2. A centered italic tagline paragraph (as seen in the reference)
3. A grid of 6 service cards that are taller, spread across the page, with hover-reveal descriptions and a "Reserve" button

### Cards (6 total)
From the reference + user instructions:
- **Contrast Studio** (Ice & Sauna) - "Reduced inflammation. Increased focus."
- **Signature Classes** - "A wide range of classes led by our experts."
- **Recovery Treatments** - "A wide range of recovery specialists."
- **Private Suites** - existing image
- **Hyperbaric Oxygen** - existing image
- **Cryotherapy** - existing image

### Design Details
- **Background**: Use the uploaded bokeh image as a full-bleed section background
- **Tagline**: Large, italic, light-weight centered text matching the reference ("Boost your baseline and achieve elemental balance...")
- **Card layout**: 3-column grid on desktop, taller cards (~500px), edge-to-edge with small gaps
- **Card default state**: Image with title + short subtitle at the bottom over a gradient
- **Card hover state**: Expanded gradient overlay revealing more description text and a glassmorphic "Reserve" button
- **No carousel** -- replace the current carousel with a static grid

### Files to Change
1. **Copy uploaded background** to `public/images/section-bg.png`
2. **`src/components/AboutSection.tsx`**: Replace the collage gallery + carousel with:
   - Full-width section using the bokeh background image
   - Centered italic tagline paragraph
   - 3x2 grid of tall service cards with hover interactions
   - Each card: image, gradient overlay, title + subtitle visible by default, description + Reserve button revealed on hover with smooth transition

