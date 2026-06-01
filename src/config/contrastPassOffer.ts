/** June 2026 promotional pass — keep in sync with Mindbody pricing option name. */
export const CONTRAST_PASS_OFFER = {
  slug: '2-week-unlimited-contrast-pass',
  path: '/offers/2-week-unlimited-contrast-pass',
  headline: '2 Week Unlimited Communal Contrast Pass',
  priceGbp: 130,
  /** Mindbody catalog name (Pricing Options). */
  mindbodyProductName: 'Unlimited 2 Week Contrast Pass',
  mindbodyNamePattern: /unlimited\s*2\s*week\s*contrast\s*pass/i,
  image: '/images/rebase-members-suite.jpg',
  /** Inclusive sale window (Europe/London). Purchases on last day still get 14 days from purchase. */
  saleWindow: {
    start: '2026-06-01',
    end: '2026-06-30',
  },
  validityDays: 14,
  sessionsPerDay: 1,
  summary:
    'One communal contrast session per day for 14 days from the date of purchase — ice baths, Finnish sauna and bucket showers in our Communal Contrast shared area.',
  terms: [
    'The pass includes one communal contrast session per day for 14 consecutive days starting on the date of purchase (not the calendar month).',
    'Example: a purchase on 30 June includes sessions through 13 July.',
    'Sessions are limited to one per day, are non-transferable, non-refundable, and cannot be extended beyond the validity period.',
    'Subject to availability; drop-in rules for communal contrast still apply (one session per person per day at the studio).',
    'Available to purchase online throughout June 2026 only, while stocks last.',
    'Pass must be purchased via Mindbody; sign in or create an account at checkout.',
  ],
} as const;

const LONDON = 'Europe/London';

function londonYmd(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: LONDON });
}

/** True during the June sale window (for homepage banner and buy CTA). */
export function isContrastPassSaleActive(at: Date = new Date()): boolean {
  const ymd = londonYmd(at);
  return ymd >= CONTRAST_PASS_OFFER.saleWindow.start && ymd <= CONTRAST_PASS_OFFER.saleWindow.end;
}
