## Why service descriptions look identical

I pulled live data from Mindbody (`/mindbody-services`) and audited every service. The code is reading the right field (`onlineDescription`) and falling back correctly. The duplication happens because **55 of 169 Mindbody services have a completely empty `onlineDescription`**, and our group-level fallback in `serviceConfig.ts` (`shortDescriptions`) only has *one entry per group*.

When a group like "IV Drip" contains 11 variants (Immunity, Glow, Energy, Recovery, Neuro-Regen, Rest & Sleep, Focus, Revive, Anti-Inflammatory, Immunity Plus, plus add-ons) and **none** of them have copy in Mindbody, every variant in the booking drawer / variant list shows the same generic line: *"Vitamin-rich IV infusions tailored to your wellness goals."*

Same problem for:
- **NAD+** — 250mg, 500mg, 750mg all share one fallback line
- **Vitamin Shots** — empty in Mindbody
- **Blood Test** — empty in Mindbody
- **Classes** (45 / 30 / 60 min, All Classes) — empty in Mindbody
- **First Consultation (IV)** — empty in Mindbody

Visible groups whose Mindbody copy is missing entirely (group-level card uses a generic line):
`IV Drip variants`, `NAD+ variants`, `Vitamin Shots`, `Blood Test`, `Classes`, `Off Peak Access`, `Members Suite (Off Peak)`, `Iv add on`.

The remaining ~40 empty entries are already hidden via `hiddenServiceNames` / `hiddenGroupNames` (Corporate, Mock Class, Buffers, Hyaluronic, Injectables, Aesthetics, Sound Bath, Discovery Call, etc.) so they don't surface.

## What to fix

Two-layer fix in `src/config/serviceConfig.ts`:

### 1. Per-variant description map (new)
Add a `variantDescriptions` map keyed by exact Mindbody service name (or regex), so each IV / NAD+ / Class variant gets its own copy when Mindbody is empty. Example entries:

```ts
export const variantDescriptions: Record<string, string> = {
  'IV drip - Immunity': 'A high-dose vitamin C and zinc blend to fortify immune defences.',
  'IV drip - Immunity Plus': 'An enhanced immunity protocol with added antioxidants and glutathione.',
  'IV drip - Glow': 'Glutathione-led infusion for radiant skin, hair and nails.',
  'IV drip - Energy': 'B-complex and amino-acid blend to restore daily energy and focus.',
  'IV drip - Anti-Inflammatory': 'Targeted infusion to calm inflammation and aid recovery.',
  'IV drip - Recovery': 'Post-training rehydration with electrolytes and aminos.',
  'IV drip - Neuro-Regen': 'Cognitive-support blend featuring NAD+ precursors.',
  'IV drip - Rest & Sleep': 'Magnesium-led infusion to support deep, restorative sleep.',
  'IV drip - Focus': 'Nootropic-style blend for sharp mental performance.',
  'IV drip - Revive': 'Hydrating, balanced infusion for an all-round reset.',
  'NAD+ (250MG)': 'Entry-level NAD+ infusion for cellular energy support.',
  'NAD+ (500MG)': 'Standard NAD+ protocol for sustained mitochondrial repair.',
  'NAD+ (750MG)': 'Advanced NAD+ infusion for deep cellular regeneration.',
  'Vitamin Shots': 'Quick intramuscular vitamin boosters — energy, immunity, recovery.',
  'Blood Test': 'Comprehensive lab panels to inform your wellness strategy.',
  'All Classes': 'Drop-in access to any scheduled studio class.',
  '45 Minute Classes': 'Single 45-minute class credit.',
  '30 Minute Classes': 'Single 30-minute express class credit.',
  '1 Hour Classes': 'Single 60-minute class credit.',
  'Off Peak Access': 'Discounted off-peak entry to the communal wellness space.',
  'First Consultation': 'Complimentary IV consultation with our medical team.',
};
```

### 2. Tighten `resolveGroupDescription`
- Add a sibling `resolveVariantDescription(variantName, groupName, mindbodyDesc)` that prefers: real Mindbody copy → `variantDescriptions[exactName]` → group `shortDescriptions[group]` → generic.
- Use it everywhere a single variant is rendered standalone (booking drawer variant cards, variant pickers).

### 3. Render integration
Update the four files that build the grouped variant lists so each variant carries its resolved description, not just the group's:
- `src/components/WebsiteServices.tsx`
- `src/pages/Services.tsx`
- `src/components/ExperienceDrawer.tsx`
- `src/widget/components/ServiceList.tsx`

Specifically: when pushing into `variants`, also store `description: resolveVariantDescription(service.name, canonicalName, service.onlineDescription || service.description)` and surface it in any variant-level UI (booking drawer subtitle, variant picker rows). The group card itself keeps using the group description.

### 4. No Mindbody changes required
This is a pure frontend fallback layer. If the team later adds `onlineDescription` to a service in Mindbody, real copy automatically wins.

## Files to change
- `src/config/serviceConfig.ts` — add `variantDescriptions` + `resolveVariantDescription` helper.
- `src/components/WebsiteServices.tsx` — store + render per-variant description.
- `src/pages/Services.tsx` — same.
- `src/components/ExperienceDrawer.tsx` — same.
- `src/widget/components/ServiceList.tsx` — same.

## Outcome
Each IV drip, NAD+ dose, vitamin shot, and class type will show its own description — no more identical placeholder repeated across siblings. Group cards remain unchanged where Mindbody copy already exists.