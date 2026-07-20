export interface TierAllowance {
  label: string;
  monthly: number | 'unlimited';
  // Keywords used to fuzzy-match against Mindbody clientService names (case-insensitive)
  matchKeywords: string[];
}

export interface TierConfig {
  name: 'Base' | 'Resident' | 'Ultimate';
  blurb: string;
  allowances: TierAllowance[];
  guestPassesAnnual: number;
  treatmentDiscountPct: number;
}

export const TIERS: TierConfig[] = [
  {
    name: 'Base',
    blurb: 'Your platform for the Rebase journey.',
    allowances: [
      { label: 'Class Passes', monthly: 4, matchKeywords: ['class'] },
      { label: 'Cryotherapy', monthly: 4, matchKeywords: ['cryo'] },
      { label: 'HBOT', monthly: 1, matchKeywords: ['hbot', 'hyperbaric'] },
      { label: 'Communal Contrast', monthly: 8, matchKeywords: ['communal', 'contrast'] },
    ],
    guestPassesAnnual: 6,
    treatmentDiscountPct: 10,
  },
  {
    name: 'Resident',
    blurb: 'Performance-focused. Tailored sports recovery.',
    allowances: [
      { label: 'Cryotherapy', monthly: 'unlimited', matchKeywords: ['cryo'] },
      { label: 'Class Passes', monthly: 8, matchKeywords: ['class'] },
      { label: 'Private Suite', monthly: 3, matchKeywords: ['private', 'suite'] },
      { label: 'HBOT', monthly: 3, matchKeywords: ['hbot', 'hyperbaric'] },
      { label: 'Communal Contrast', monthly: 'unlimited', matchKeywords: ['communal', 'contrast'] },
    ],
    guestPassesAnnual: 12,
    treatmentDiscountPct: 10,
  },
  {
    name: 'Ultimate',
    blurb: 'Unlimited access. Bespoke wellness.',
    allowances: [
      { label: 'Classes', monthly: 'unlimited', matchKeywords: ['class'] },
      { label: 'Cryotherapy', monthly: 'unlimited', matchKeywords: ['cryo'] },
      { label: 'Private Suite', monthly: 6, matchKeywords: ['private', 'suite'] },
      { label: 'HBOT', monthly: 6, matchKeywords: ['hbot', 'hyperbaric'] },
      { label: 'Communal Contrast', monthly: 'unlimited', matchKeywords: ['communal', 'contrast'] },
    ],
    guestPassesAnnual: 18,
    treatmentDiscountPct: 10,
  },
];

/** Best-effort match a Mindbody membership name to a local tier config. */
export function resolveTier(membershipName: string | undefined | null): TierConfig | null {
  if (!membershipName) return null;
  const lower = membershipName.toLowerCase();
  // Order matters: 'ultimate' before 'resident' before 'base' so longer matches win.
  if (lower.includes('ultimate')) return TIERS[2];
  if (lower.includes('resident')) return TIERS[1];
  if (lower.includes('base')) return TIERS[0];
  return null;
}

/**
 * Mindbody often returns Remaining ≈ 99999 (or similarly huge) for unlimited /
 * unset counts. Cap against the marketed monthly allotment so the dashboard
 * never shows e.g. "99988 of 3 left".
 */
export function clampMembershipAllowanceRemaining(
  remaining: number | null | undefined,
  monthly: number,
): number {
  if (remaining == null || !Number.isFinite(remaining) || remaining < 0) {
    return monthly;
  }
  // Sentinel / unlimited-style values from Mindbody
  if (remaining >= 9000) return monthly;
  return Math.min(Math.floor(remaining), monthly);
}

export const MEMBER_PERKS: { title: string; description: string; soon?: boolean }[] = [
  { title: '10% off all treatments', description: 'Applied automatically at checkout on every additional booking.' },
  { title: 'Guest passes', description: 'Bring friends and family to experience Rebase with you.' },
  { title: 'Priority class booking', description: 'Earlier access to the most sought-after classes each week.' },
  { title: 'Towels & robes', description: 'Complimentary on every visit — arrive light, leave restored.' },
  { title: 'Member-only events', description: 'Curated wellness evenings, talks, and seasonal experiences.', soon: true },
];
