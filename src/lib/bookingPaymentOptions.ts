import type { ClientService } from '@/hooks/useMindbodyMembership';
import { isJuneContrastPassName } from '@/lib/contrastPassUsage';

export function isCommunalContrastService(serviceName: string | undefined | null): boolean {
  if (!serviceName) return false;
  return /communal\s*contrast|members?\s*suite/i.test(serviceName);
}

/**
 * Retail single-visit products (e.g. "Communal Contrast - Drop In 1 Hour").
 * Keep in sync with supabase/functions/_shared/mindbodyClientServices.ts.
 */
export function isRetailSingleVisitCredit(name: string | null | undefined): boolean {
  const n = (name || '').trim();
  if (!n) return false;
  if (
    /\bpack\b/i.test(n) ||
    /\bunlimited\b/i.test(n) ||
    /\d+\s*week/i.test(n) ||
    /\d+\s*(?:session|visit)s?\b/i.test(n) ||
    isJuneContrastPassName(n)
  ) {
    return false;
  }
  return /drop[\s-]?in|single\s*(?:visit|session|class)|\b1\s*hour\b/i.test(n);
}

/** True when the signed-in client has an unused pass/credit for communal contrast. */
export function hasCommunalContrastCredit(clientServices: ClientService[] | undefined): boolean {
  if (!clientServices?.length) return false;
  return clientServices.some((s) => {
    if (isRetailSingleVisitCredit(s.name)) return false;
    if (/communal\s*contrast|contrast\s*pass|off\s*peak|members?\s*suite/i.test(s.name)) {
      return typeof s.remaining === 'number' && s.remaining > 0;
    }
    return false;
  });
}
