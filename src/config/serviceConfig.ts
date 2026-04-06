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

// ── Category mapping ───────────────────────────────────────────────
export const programNameOverrides: Record<string, string> = {
  "Member's Suite": 'Communal Members Suite',
  'Members Suite': 'Communal Members Suite',
};

export const categoryOverrides: Record<string, string> = {
  "Member's Suite": 'Communal Members Suite',
  'Members Suite': 'Communal Members Suite',
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
  'Communal Members Suite',
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
