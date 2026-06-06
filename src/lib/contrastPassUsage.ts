import { CONTRAST_PASS_OFFER } from '@/config/contrastPassOffer';
import type { ClientService } from '@/hooks/useMindbodyMembership';

const LONDON = 'Europe/London';

export function isJuneContrastPassName(name: string | null | undefined): boolean {
  if (!name?.trim()) return false;
  const trimmed = name.trim();
  return (
    trimmed === CONTRAST_PASS_OFFER.mindbodyProductName ||
    CONTRAST_PASS_OFFER.mindbodyNamePattern.test(trimmed)
  );
}

export type JunePassUsageSummary = {
  expiresOn: string | null;
  daysRemaining: number | null;
  sessionsRemaining: number | null;
  purchasedOn: string | null;
};

function londonYmd(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: LONDON });
}

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function getJunePassUsageSummary(pass: ClientService): JunePassUsageSummary {
  let daysRemaining: number | null = null;
  const expiresOn = pass.expirationDate?.slice(0, 10) ?? null;

  if (expiresOn) {
    const today = londonYmd(new Date());
    const end = parseYmd(expiresOn);
    const start = parseYmd(today);
    daysRemaining = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / 86_400_000));
  }

  return {
    expiresOn,
    daysRemaining,
    sessionsRemaining:
      typeof pass.remaining === 'number' && pass.remaining >= 0 ? pass.remaining : null,
    purchasedOn: pass.paymentDate?.slice(0, 10) ?? null,
  };
}

/** Prefer June unlimited pass over other communal contrast credits. */
export function findJuneContrastPass(
  clientServices: ClientService[] | undefined,
): ClientService | null {
  if (!clientServices?.length) return null;
  const june = clientServices.find((s) => {
    if (!isJuneContrastPassName(s.name)) return false;
    return s.remaining === undefined || s.remaining > 0;
  });
  return june ?? null;
}

export function formatJunePassTermsReminder(summary: JunePassUsageSummary): string {
  const parts: string[] = [
    `${CONTRAST_PASS_OFFER.sessionsPerDay} communal contrast session per day`,
    `${CONTRAST_PASS_OFFER.validityDays} days from purchase`,
  ];
  if (summary.expiresOn) {
    parts.push(`valid through ${formatLondonDate(summary.expiresOn)}`);
  }
  if (summary.daysRemaining != null) {
    parts.push(
      summary.daysRemaining === 0
        ? 'expires today'
        : `${summary.daysRemaining} day${summary.daysRemaining === 1 ? '' : 's'} left`,
    );
  }
  return parts.join(' · ');
}

function formatLondonDate(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: LONDON,
  });
}
