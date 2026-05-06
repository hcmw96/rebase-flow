import { ServiceVariant } from '@/components/ServiceCard';

// ── Grouping patterns ──────────────────────────────────────────────
export const serviceGroupMappings: Array<{ pattern: RegExp; groupName: string }> = [
  { pattern: /^members?\s*(only|suite)/i, groupName: 'Members Suite' },
  { pattern: /^iv\s*(drip|add\s*on)/i, groupName: 'IV Drip' },
  { pattern: /^nad\+?/i, groupName: 'NAD+' },
  { pattern: /^vitamin\s*shots?/i, groupName: 'IV Drip' },
  { pattern: /^blood\s*test/i, groupName: 'Blood Test' },
  { pattern: /^skin\s*rejuv(enation)?/i, groupName: 'Skin Rejuvenation' },
  { pattern: /^skin\s*peels?/i, groupName: 'Skin Peel' },
  { pattern: /^bio\s*stim(ulation)?/i, groupName: 'BioStimulation' },
  { pattern: /^deep\s*tissue\s*massage/i, groupName: 'Massage' },
  { pattern: /^sports\s*massage/i, groupName: 'Massage' },
  { pattern: /massage/i, groupName: 'Massage' },
  { pattern: /^reflexology/i, groupName: 'Reflexology' },
  { pattern: /^touch\s*&\s*(flow|glow)/i, groupName: 'Reflexology' },
  { pattern: /^flow\s*&\s*glow/i, groupName: 'Reflexology' },
  { pattern: /^ultimate\s*flow/i, groupName: 'Reflexology' },
  { pattern: /^four\s*hand/i, groupName: 'Four Hand' },
  { pattern: /cryo(therapy)?/i, groupName: 'Cryotherapy' },
  { pattern: /^hyperbaric\s*oxygen/i, groupName: 'Hyperbaric Oxygen' },
  { pattern: /^infrared\s*sauna/i, groupName: 'Infrared Suite' },
  { pattern: /^premium\s*suite/i, groupName: 'Premium Suite' },
  { pattern: /^structural\s*fascia/i, groupName: 'Structural Fascia Therapy' },
  { pattern: /^holistic\s*face\s*sculpt/i, groupName: 'Holistic Face Sculpting' },
  { pattern: /^divine\s*facial/i, groupName: 'Divine Facial Healing' },
  { pattern: /^osteopathy/i, groupName: 'Osteopathy' },
  { pattern: /^(oxygen-?)?ozone/i, groupName: 'Ozone Therapy' },
  { pattern: /minute\s*classes$/i, groupName: 'Classes' },
  { pattern: /^all\s*classes$/i, groupName: 'Classes' },
  { pattern: /^brazil+ian\s*lymphatic/i, groupName: 'Brazilian Lymphatic' },
  { pattern: /^(the\s+)?midday\s*resets?/i, groupName: 'Midday Reset' },
  { pattern: /^nutritional\s*therap/i, groupName: 'Nutritional Therapy' },
  { pattern: /^myofascial\s*dry\s*needl/i, groupName: 'Myofascial Dry Needling' },
  { pattern: /^assisted\s*stretching/i, groupName: 'Assisted Stretching' },
  { pattern: /^deo.*body\s*alignment/i, groupName: "Deo's Body Alignment Method" },
  { pattern: /high\s*performance\s*recovery/i, groupName: 'High Performance Recovery' },
  { pattern: /longevity/i, groupName: 'Longevity' },
  { pattern: /athletes?\s*performance/i, groupName: 'Athletes Performance' },
  { pattern: /^core\s*radiance/i, groupName: 'Core Radiance' },
  { pattern: /hyalou?ronic/i, groupName: 'Hyaluronic' },
  { pattern: /injectables?/i, groupName: 'Injectables' },
  { pattern: /neuro.?\s*regulation/i, groupName: 'Neuro Regulation' },
];

// ── Hidden items ───────────────────────────────────────────────────
export const hiddenGroupNames = new Set([
  'Rebase Packages', 'Corporate Credits', 'Corporate credits',
  'Classes', 'Off Peak Access', 'MOCK CLASS', 'Vitamin Stack',
  'Club Takeover', 'Ozone Aesthetics Packages', 'Hydro Pro Facial',
  'Members Wellness Event', 'Sound Bath',
  'Wellness Event', 'Saturday Buffer', 'Thursday Buffer',
  'Nutritional Therapy',
  'Structural Fascia Therapy', 'Ozone Therapy', 'Skin Rejuvenation',
  'Skin Peel', 'BioStimulation', 'Myofascial Dry Needling',
  'Hyaluronic', 'Injectables', 'Neuro Regulation',
]);

export const hiddenProgramIds = new Set([12]);

export const hiddenServiceNames = new Set([
  'Add On: Lymphatic Drainage Compression', 'Full Facial/Body Consultation',
  'Ozone - Aesthetics', 'Discovery Call', 'Saturday Buffer', 'Thursday Buffer',
  'Destress Head Neck and Shoulders', 'Destress Head, Neck & Shoulders',
  'Destress Head, Neck and Shoulders', 'Indian Head Massage', 'Indian Massage',
  'Hyaluronic Acid - 1 Joint', 'Hyaluronic Acid - 2 Joints',
  'Hyaluronic Acid - 3 Joints', 'Hyaluronic Acid - 4 Joints',
  'Hyalouronic Acid - 1 Joint', 'Hyalouronic Acid - 2 Joints',
  'Hyalouronic Acid - 3 Joints', 'Hyalouronic Acid - 4 Joints',
]);

// Patterns matched against raw Mindbody service names; any match is hidden.
export const hiddenServiceNamePatterns: RegExp[] = [
  /\bcorporate\b/i,
];

export function isHiddenServiceName(name: string): boolean {
  const trimmed = name.trim();
  if (hiddenServiceNames.has(name) || hiddenServiceNames.has(trimmed)) return true;
  return hiddenServiceNamePatterns.some((re) => re.test(trimmed));
}

// ── Category mapping ───────────────────────────────────────────────
export const programNameOverrides: Record<string, string> = {
  "Member's Suite": 'Communal Contrast',
  'Members Suite': 'Communal Contrast',
};

export const categoryOverrides: Record<string, string> = {
  "Member's Suite": 'Communal Contrast',
  'Members Suite': 'Communal Contrast',
  'Classes': 'Signature Classes',
  'Infrared Suite': 'Private Suites',
  'Premium Suite': 'Private Suites',
  'Midday Reset': 'Private Suites',
  'Hyperbaric Oxygen': 'Hyperbaric Oxygen',
  'Cryotherapy': 'Cryotherapy',
  'Massage': 'Massage Therapy',
  'Reflexology': 'Massage Therapy',
  'Four Hand': 'Massage Therapy',
  'Brazilian Lymphatic': 'Massage Therapy',
  'Assisted Stretching': 'Massage Therapy',
  "Deo's Body Alignment Method": 'Massage Therapy',
  'Holistic Face Sculpting': 'Massage Therapy',
  'Divine Facial Healing': 'Massage Therapy',
  'IV Drip': 'IV Drips',
  'NAD+': 'IV Drips',
  'Blood Test': 'IV Drips',
  
  'Osteopathy': 'Regen and Manual Therapies',
  'Myofascial Dry Needling': 'Regen and Manual Therapies',
};

export const categoryOrder = [
  'Communal Contrast',
  'Signature Classes',
  'Private Suites',
  'Hyperbaric Oxygen',
  'Cryotherapy',
  'Massage Therapy',
  'IV Drips',
  'Regen and Manual Therapies',
];

// ── Within-category ordering ───────────────────────────────────────
export const serviceOrderWithinCategory: Record<string, Record<string, number>> = {
  'IV Drips': { 'IV Drip': 0, 'Blood Test': 1, 'NAD+': 2 },
  'Regen and Manual Therapies': { 'Osteopathy': 0 },
};

// ── Images ─────────────────────────────────────────────────────────
export const serviceImages: Record<string, string> = {
  'Cryotherapy': '/images/rebase-cryo.webp',
  'Infrared Suite': '/images/rebase-infrared-suite.jpg',
  'Hyperbaric Oxygen': '/images/rebase-hbot-treatment.webp',
  'Premium Suite': '/images/rebase-private-suites.webp',
  'IV Drip': '/images/rebase-iv-drip.jpg',
  'NAD+': '/images/rebase-iv-drip.jpg',
  'Massage': '/images/rebase-massage.jpg',
  'Assisted Stretching': '/images/rebase-treatment-room.jpg',
  'Brazilian Lymphatic': '/images/rebase-brazilian-lymphatic.jpg',
  "Deo's Body Alignment Method": '/images/rebase-deo-body-alignment.jpg',
  'Holistic Face Sculpting': '/images/rebase-holistic-face-sculpting.jpg',
  'Divine Facial Healing': '/images/rebase-divine-facial.jpg',
  'Blood Test': '/images/rebase-blood-test.jpg',
  'Osteopathy': '/images/rebase-osteopathy.jpg',
  'Structural Fascia Therapy': '/images/rebase-structural-fascia.jpg',
  'Midday Reset': '/images/rebase-midday-reset.jpg',
  'Four Hand': '/images/rebase-four-hand.jpg',
  'Reflexology': '/images/rebase-reflexology.jpg',
  'Nervous System Reset': '/images/rebase-nervous-system-reset.jpg',
  'High Performance Recovery': '/images/rebase-high-performance-recovery.jpg',
  'Longevity': '/images/rebase-longevity.jpg',
  'Athletes Performance': '/images/rebase-athletes-performance.jpg',
  'Core Radiance': '/images/rebase-core-radiance.jpg',
  'Members Suite': '/images/rebase-members-suite.jpg',
};

export const serviceImagePositions: Record<string, string> = {
  'Core Radiance': 'center 20%',
};

export const categoryImages: Record<string, string> = {
  'Recovery': '/images/rebase-hbot-new.png',
  'Wellness': '/images/rebase-ice-sauna.webp',
  'Classes': '/images/rebase-class.webp',
  'Private': '/images/rebase-private-suites.webp',
  'default': '/images/rebase-suite.webp',
};

// ── Contact-only groups ────────────────────────────────────────────
export const contactOnlyGroups = new Set(['Osteopathy']);

// ── Package groups (append "Package" to title, hide duration) ─────
export const packageGroups = new Set([
  'Athletes Performance',
  'Longevity',
  'High Performance Recovery',
  'Core Radiance',
]);

// ── Class-based services (shown in Services grid but booked via class schedule) ──
export const classDescriptionIdMap: Record<string, number[]> = {
  'Members Suite': [5],
};

// ── Price overrides (when Mindbody API returns null) ──────────────
export const priceOverrides: Record<string, number> = {
  'Members Suite': 65,
};

// ── Short descriptions (website cards) ─────────────────────────────
export const shortDescriptions: Record<string, string> = {
  'Infrared Suite': 'Detoxifying infrared heat followed by an invigorating ice bath.',
  'Premium Suite': 'Private suite with Finnish sauna, ice baths and bucket shower.',
  'Midday Reset': 'A restorative midday escape in our private wellness suite.',
  'Cryotherapy': 'Whole-body cold therapy to reduce inflammation and boost recovery.',
  'Hyperbaric Oxygen': 'Pressurised oxygen therapy to accelerate healing and recovery.',
  'IV Drip': 'Vitamin-rich IV infusions tailored to your wellness goals.',
  'NAD+': 'Cellular regeneration therapy to restore energy and vitality.',
  'Massage': 'Expert deep tissue and sports massage for total tension relief.',
  'Skin Rejuvenation': 'Advanced facial treatments for radiant, youthful skin.',
  'Skin Peel': 'Clinical-grade peels to resurface and refresh your complexion.',
  'BioStimulation': 'Targeted bio-electric therapy to stimulate tissue repair.',
  'Structural Fascia Therapy': 'Hands-on fascial release for posture and pain relief.',
  'Holistic Face Sculpting': 'Natural face-lift technique using sculpting massage.',
  'Divine Facial Healing': 'A deeply relaxing, restorative facial ritual.',
  'Osteopathy': 'Manual therapy to restore movement and relieve pain.',
  'Ozone Therapy': 'Medical-grade ozone to support detoxification and immunity.',
  'Brazilian Lymphatic': 'Specialised drainage massage to reduce fluid retention.',
  'Nutritional Therapy': 'Personalised nutrition guidance for optimal health.',
  'Myofascial Dry Needling': 'Precision needling to release deep muscular tension.',
  'Sound Bath': 'Immersive sonic experience using crystal bowls and gongs to deeply relax the nervous system.',
  'Vitamin Shots': 'Quick intramuscular vitamin boosters for targeted energy, immunity and recovery.',
  'Blood Test': 'Comprehensive lab panels to inform your personalised wellness strategy.',
  'Discovery Call': 'A complimentary 15-minute consultation to map your wellness goals.',
  'Neuro Regulation': 'Targeted nervous-system therapy to restore balance and calm.',
  'Assisted Stretching': 'Guided one-to-one stretching to improve mobility and release tension.',
  'Indian Head Massage': 'Traditional scalp, neck and shoulder massage to ease stress and tension.',
  'Reflexology': 'Pressure-point therapy on the feet, hands or face to restore energy flow.',
  'Sports Massage': 'Performance-focused massage to relieve muscle tightness and aid recovery.',
  'Deep Tissue Massage': 'Firm, focused pressure to release deep muscular tension.',
  'Destress Head, Neck and Shoulder Massage': 'Targeted upper-body massage to dissolve stress and tension.',
  'Four Hand Divine Healing': 'Synchronised four-hand massage for the ultimate sensory escape.',
  'Hyaluronic Acid': 'Joint-support injections to ease stiffness and improve mobility.',
  'PRP Therapy': 'Platelet-rich plasma therapy to stimulate natural tissue regeneration.',
  'Members Suite': 'Communal contrast therapy in our shared wellness space.',
  'Off Peak Access': 'Discounted off-peak entry to our communal wellness space.',
};

// Generic placeholder used only when no specific copy exists anywhere.
export const GENERIC_SERVICE_DESCRIPTION = 'Experience our premium wellness service.';

// Returns true when a description string is empty, whitespace-only, or our generic fallback.
export const isPlaceholderDescription = (desc: string | null | undefined): boolean => {
  if (!desc) return true;
  const stripped = desc.replace(/<[^>]*>/g, '').trim();
  return stripped.length === 0 || stripped === GENERIC_SERVICE_DESCRIPTION;
};

// Picks the best description for a group: real Mindbody copy first, then curated short copy, then generic.
export const resolveGroupDescription = (
  current: string | null | undefined,
  baseName: string,
): string => {
  if (!isPlaceholderDescription(current)) return current as string;
  return shortDescriptions[baseName] || GENERIC_SERVICE_DESCRIPTION;
};

// ── Per-variant descriptions ───────────────────────────────────────
// Used when a single Mindbody service in a multi-variant group has no
// onlineDescription. Keys are the exact (or normalised) Mindbody service name.
// Lookup is case-insensitive and trims surrounding whitespace.
export const variantDescriptions: Record<string, string> = {
  // IV Drips
  'IV drip - Immunity': 'High-dose vitamin C and zinc blend to fortify immune defences.',
  'IV drip - Immunity Plus': 'Enhanced immunity protocol with added antioxidants and glutathione.',
  'IV drip - Glow': 'Glutathione-led infusion for radiant skin, hair and nails.',
  'IV drip - Energy': 'B-complex and amino-acid blend to restore daily energy and focus.',
  'IV drip - Anti-Inflammatory': 'Targeted infusion to calm inflammation and aid recovery.',
  'IV drip - Recovery': 'Post-training rehydration with electrolytes and amino acids.',
  'IV drip - Neuro-Regen': 'Cognitive-support blend featuring NAD+ precursors.',
  'IV drip - Rest & Sleep': 'Magnesium-led infusion to support deep, restorative sleep.',
  'IV drip - Focus': 'Nootropic-style blend for sharp mental performance.',
  'IV drip - Revive': 'Hydrating, balanced infusion for an all-round reset.',
  'Iv add on': 'Optional add-on boosters to customise your IV infusion.',
  'IV Add On - Paracetamol': 'Paracetamol add-on for added comfort during your infusion.',
  'First Consultation': 'Complimentary IV consultation with our medical team.',

  // NAD+
  'NAD+ (250MG)': 'Entry-level NAD+ infusion for cellular energy support.',
  'NAD+ (500MG)': 'Standard NAD+ protocol for sustained mitochondrial repair.',
  'NAD+ (750MG)': 'Advanced NAD+ infusion for deep cellular regeneration.',

  // Other IV-related
  'Vitamin Shots': 'Quick intramuscular vitamin boosters — energy, immunity, recovery.',
  'Blood Test': 'Comprehensive lab panels to inform your personalised wellness strategy.',

  // Classes
  'All Classes': 'Drop-in access to any scheduled studio class.',
  '45 Minute Classes': 'Single 45-minute class credit.',
  ' 45 Minute Classes': 'Single 45-minute class credit.',
  '30 Minute Classes': 'Single 30-minute express class credit.',
  '1 Hour Classes': 'Single 60-minute class credit.',

  // Members Suite
  'Off Peak Access': 'Discounted off-peak entry to the communal wellness space.',
  'members only': 'Communal contrast therapy in our shared wellness space.',
};

// Build a normalised lookup once for case-insensitive matching.
const normalisedVariantDescriptions: Record<string, string> = Object.fromEntries(
  Object.entries(variantDescriptions).map(([k, v]) => [k.trim().toLowerCase(), v])
);

// Picks the best description for a single variant within a group:
// real Mindbody copy → exact-name variant copy → group short copy → generic.
export const resolveVariantDescription = (
  variantName: string,
  groupName: string,
  mindbodyDesc: string | null | undefined,
): string => {
  if (!isPlaceholderDescription(mindbodyDesc)) return mindbodyDesc as string;
  const key = (variantName || '').trim().toLowerCase();
  if (normalisedVariantDescriptions[key]) return normalisedVariantDescriptions[key];
  return shortDescriptions[groupName] || GENERIC_SERVICE_DESCRIPTION;
};


// ── Class offerings (website) ──────────────────────────────────────
export const classOfferings = [
  {
    name: 'Urban Oasis',
    image: '/images/rebase-class-urban-oasis.jpg',
    description: 'A calming escape combining breathwork and meditation in candlelit surroundings.',
    classDescriptionIds: [7],
  },
  {
    name: 'Contrast Immersion',
    image: '/images/rebase-class-contrast-immersion.jpg',
    description: 'Guided hot-cold contrast therapy to boost circulation and recovery.',
    classDescriptionIds: [8],
  },
  {
    name: 'Yoga',
    image: '/images/rebase-class-yoga.jpg',
    description: 'Prana Flow and Dynamic Flow sessions to build strength and flexibility.',
    classDescriptionIds: [1, 10],
  },
  {
    name: 'Mat Pilates',
    image: '/images/rebase-class-mat-pilates.jpg',
    description: 'Core-focused mat work to improve posture, tone and stability.',
    classDescriptionIds: [20],
  },
];

// ── Helpers ────────────────────────────────────────────────────────
export function extractDurationFromName(name: string): { baseName: string; duration: number | null } {
  const match = name.match(/\((\d+)\s*(?:mins?|minutes?)\)/i);
  if (match) return { baseName: name.replace(match[0], '').trim(), duration: parseInt(match[1], 10) };
  return { baseName: name, duration: null };
}

export function canonicalizeServiceName(baseName: string): string {
  for (const { pattern, groupName } of serviceGroupMappings) {
    if (pattern.test(baseName)) return groupName;
  }
  return baseName;
}

// ── Shared grouped service type ────────────────────────────────────
export interface GroupedService {
  baseName: string;
  description: string;
  category: string;
  image: string;
  variants: ServiceVariant[];
  contactOnly?: boolean;
}

// ── Resolve category for a service ─────────────────────────────────
export function resolveCategory(canonicalName: string, rawCategory: string): string {
  return (
    categoryOverrides[canonicalName] ||
    programNameOverrides[rawCategory] ||
    (rawCategory.startsWith('Sauna Suite') ? 'Private Suites' : rawCategory)
  );
}

// ── Get image for a service ────────────────────────────────────────
export function resolveImage(canonicalName: string, programName?: string, category?: string): string {
  return (
    serviceImages[canonicalName] ||
    categoryImages[programName || ''] ||
    categoryImages[category || ''] ||
    categoryImages['default']
  );
}

// ── Static catalogue for /website ──────────────────────────────────
// Lets the marketing page render instantly without waiting for the
// Mindbody API. Live data hydrates prices/descriptions when it arrives.
export interface StaticServiceEntry {
  baseName: string;
  category: string;
  image: string;
  shortDescription: string;
  fromPrice: number | null;
  contactOnly: boolean;
  classDescriptionIds?: number[];
}

export const staticWebsiteCatalogue: StaticServiceEntry[] = [
  { baseName: "Members Suite", category: "Communal Contrast", image: "/images/rebase-members-suite.jpg", shortDescription: "Communal contrast therapy in our shared wellness space.", fromPrice: 65, contactOnly: false, classDescriptionIds: [5] },
  { baseName: "Infrared Suite", category: "Private Suites", image: "/images/rebase-infrared-suite.jpg", shortDescription: "Detoxifying infrared heat followed by an invigorating ice bath.", fromPrice: 190, contactOnly: false },
  { baseName: "Midday Reset", category: "Private Suites", image: "/images/rebase-midday-reset.jpg", shortDescription: "A restorative midday escape in our private wellness suite.", fromPrice: 152, contactOnly: false },
  { baseName: "Premium Suite", category: "Private Suites", image: "/images/rebase-private-suites.webp", shortDescription: "Private suite with Finnish sauna, ice baths and bucket shower.", fromPrice: 240, contactOnly: false },
  { baseName: "Hyperbaric Oxygen", category: "Hyperbaric Oxygen", image: "/images/rebase-hbot-treatment.webp", shortDescription: "Pressurised oxygen therapy to accelerate healing and recovery.", fromPrice: 200, contactOnly: false },
  { baseName: "Cryotherapy", category: "Cryotherapy", image: "/images/rebase-cryo.webp", shortDescription: "Whole-body cold therapy to reduce inflammation and boost recovery.", fromPrice: 50, contactOnly: false },
  { baseName: "Massage", category: "Massage Therapy", image: "/images/rebase-massage.jpg", shortDescription: "Expert deep tissue and sports massage for total tension relief.", fromPrice: 165, contactOnly: false },
  { baseName: "Assisted Stretching", category: "Massage Therapy", image: "/images/rebase-treatment-room.jpg", shortDescription: "Guided one-to-one stretching to improve mobility and release tension.", fromPrice: 110, contactOnly: false },
  { baseName: "Brazilian Lymphatic", category: "Massage Therapy", image: "/images/rebase-brazilian-lymphatic.jpg", shortDescription: "Specialised drainage massage to reduce fluid retention.", fromPrice: 200, contactOnly: false },
  { baseName: "Deo's Body Alignment Method", category: "Massage Therapy", image: "/images/rebase-deo-body-alignment.jpg", shortDescription: "Experience our premium wellness service.", fromPrice: 395, contactOnly: false },
  { baseName: "Divine Facial Healing", category: "Massage Therapy", image: "/images/rebase-divine-facial.jpg", shortDescription: "A deeply relaxing, restorative facial ritual.", fromPrice: 245, contactOnly: false },
  { baseName: "Four Hand", category: "Massage Therapy", image: "/images/rebase-four-hand.jpg", shortDescription: "Synchronised four-hand massage for the ultimate sensory escape.", fromPrice: 545, contactOnly: false },
  { baseName: "Holistic Face Sculpting", category: "Massage Therapy", image: "/images/rebase-holistic-face-sculpting.jpg", shortDescription: "Natural face-lift technique using sculpting massage.", fromPrice: 200, contactOnly: false },
  { baseName: "Nervous System Reset", category: "Massage Therapy", image: "/images/rebase-nervous-system-reset.jpg", shortDescription: "Targeted nervous-system therapy to restore balance and calm.", fromPrice: 195, contactOnly: false },
  { baseName: "Reflexology", category: "Massage Therapy", image: "/images/rebase-reflexology.jpg", shortDescription: "Pressure-point therapy on the feet, hands or face to restore energy flow.", fromPrice: 195, contactOnly: false },
  { baseName: "IV Drip", category: "IV Drips", image: "/images/rebase-iv-drip.jpg", shortDescription: "Vitamin-rich IV infusions tailored to your wellness goals.", fromPrice: 80, contactOnly: false },
  { baseName: "Blood Test", category: "IV Drips", image: "/images/rebase-blood-test.jpg", shortDescription: "Comprehensive lab panels to inform your personalised wellness strategy.", fromPrice: 1000, contactOnly: false },
  { baseName: "NAD+", category: "IV Drips", image: "/images/rebase-iv-drip.jpg", shortDescription: "Cellular regeneration therapy to restore energy and vitality.", fromPrice: 350, contactOnly: false },
  { baseName: "Osteopathy", category: "Regen and Manual Therapies", image: "/images/rebase-osteopathy.jpg", shortDescription: "Manual therapy to restore movement and relieve pain.", fromPrice: 165, contactOnly: true },
  { baseName: "Athletes Performance", category: "Regen and Manual Therapies", image: "/images/rebase-athletes-performance.jpg", shortDescription: "Elite recovery and performance protocol for serious athletes.", fromPrice: 3350, contactOnly: false },
  { baseName: "Longevity", category: "Regen and Manual Therapies", image: "/images/rebase-longevity.jpg", shortDescription: "Comprehensive longevity protocol to optimise vitality and healthspan.", fromPrice: 1700, contactOnly: false },
  { baseName: "High Performance Recovery", category: "Regen and Manual Therapies", image: "/images/rebase-high-performance-recovery.jpg", shortDescription: "Multi-modal recovery package for peak performance.", fromPrice: 2950, contactOnly: false },
  { baseName: "Core Radiance", category: "Regen and Manual Therapies", image: "/images/rebase-core-radiance.jpg", shortDescription: "Women's health and radiance protocol.", fromPrice: 1950, contactOnly: false },
];
