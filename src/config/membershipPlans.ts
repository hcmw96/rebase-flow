import { REBASE_MINDBODY_SITE_ID } from '@/lib/mindbodyAuth';

export type MembershipPlanId = 'ultimate' | 'resident' | 'base';

export type MembershipFeature = {
  label: string;
  value: string;
};

export type MembershipPlan = {
  id: MembershipPlanId;
  name: string;
  annualPriceGbp: number;
  monthlyPriceGbp: number;
  features: MembershipFeature[];
  image?: string;
  /** Mindbody classic checkout for the monthly subscription only (stype=40). */
  monthlyCheckoutUrl?: string;
};

const studioId = REBASE_MINDBODY_SITE_ID;

/** Display order: left → right on the membership page. */
export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: 'ultimate',
    name: 'Ultimate',
    annualPriceGbp: 13200,
    monthlyPriceGbp: 1200,
    image: '/images/rebase-ultimate-membership.webp',
    monthlyCheckoutUrl: `https://clients.mindbodyonline.com/classic/ws?studioid=${studioId}&stype=40&prodId=115`,
    features: [
      { label: 'Communal Suite Access', value: 'Unlimited' },
      { label: 'Cryotherapy', value: 'Unlimited' },
      { label: 'Class Access', value: 'Unlimited' },
      { label: 'HBOT', value: '6 per month' },
      { label: 'Guest Passes', value: '18 per year' },
      { label: 'Private Suites', value: '6 per month' },
    ],
  },
  {
    id: 'resident',
    name: 'Resident',
    annualPriceGbp: 6380,
    monthlyPriceGbp: 580,
    image: '/images/rebase-resident-membership.webp',
    monthlyCheckoutUrl: `https://clients.mindbodyonline.com/classic/ws?studioid=${studioId}&stype=40&prodId=101`,
    features: [
      { label: 'Communal Suite Access', value: 'Unlimited' },
      { label: 'Cryotherapy', value: 'Unlimited' },
      { label: 'Class Access', value: '8 per month' },
      { label: 'HBOT', value: '3 per month' },
      { label: 'Guest Passes', value: '12 per year' },
      { label: 'Private Suites', value: '3 per month' },
    ],
  },
  {
    id: 'base',
    name: 'Base',
    annualPriceGbp: 3740,
    monthlyPriceGbp: 340,
    image: '/images/rebase-base-membership.webp',
    monthlyCheckoutUrl: `https://clients.mindbodyonline.com/classic/ws?studioid=${studioId}&stype=40&prodId=100`,
    features: [
      { label: 'Communal Suite Access', value: '8 per month' },
      { label: 'Cryotherapy', value: '4 per month' },
      { label: 'Class Access', value: '4 per month' },
      { label: 'HBOT', value: '1 per month' },
      { label: 'Guest Passes', value: '6 per year' },
      { label: 'Private Suites', value: 'Additional fee' },
    ],
  },
];

export function formatMembershipPrice(amountGbp: number): string {
  return `£${amountGbp.toLocaleString('en-GB')}`;
}
