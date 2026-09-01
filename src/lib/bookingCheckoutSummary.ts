import { resolveMindbodyClientAccountUrl } from '@/lib/mindbodyAuth';
import type { BookingCheckoutSummary } from '@/components/booking/BookingConfirmCheckout';
import type { ClientService } from '@/hooks/useMindbodyMembership';
import {
  isCommunalContrastService,
  isRetailSingleVisitCredit,
} from '@/lib/bookingPaymentOptions';
import {
  findJuneContrastPass,
  getJunePassUsageSummary,
  isJuneContrastPassName,
} from '@/lib/contrastPassUsage';

export function findCommunalContrastPass(
  clientServices: ClientService[] | undefined,
): ClientService | null {
  if (!clientServices?.length) return null;
  const june = findJuneContrastPass(clientServices);
  if (june) return june;
  // Keep this tight — membership rows like "Unlimited Cryotherapy" must not
  // look like a Communal Contrast pass (that blocked Mindbody checkout for new accounts).
  // Never treat retail "Drop In" pricing options as a prepaid pass.
  return (
    clientServices.find((s) => {
      if (isRetailSingleVisitCredit(s.name)) return false;
      if (!/communal\s*contrast|contrast\s*pass|off\s*peak|members?\s*suite/i.test(s.name)) {
        return false;
      }
      return typeof s.remaining === 'number' && s.remaining > 0;
    }) ?? null
  );
}

/**
 * Checkout summary for any class, built from the server-resolved price.
 *
 * `resolved` comes from mindbody-class-price, which calls the same
 * resolveClassPrice() that mindbody-book charges with — so the "£X" on the
 * button is the number that gets taken. Returns null when no price is known,
 * which callers must treat as "cannot book", never as "free".
 */
export function buildClassCheckoutSummary(
  serviceName: string | undefined | null,
  clientServices: ClientService[] | undefined,
  resolved: { priceGbp: number | null; pass: { name: string; remaining: number | null } | null } | undefined,
  options?: { needsCardOnFile?: boolean },
): BookingCheckoutSummary | null {
  if (!resolved) return null;

  // Server says an entitlement covers this class — it books for £0.
  if (resolved.pass) {
    // Communal Contrast carries extra offer terms; other classes just show the credit.
    const local = isCommunalContrastService(serviceName)
      ? findCommunalContrastPass(clientServices)
      : null;
    const junePass = local ? isJuneContrastPassName(local.name) : false;
    return {
      priceGbp: 0,
      pass: {
        name: resolved.pass.name,
        remaining: resolved.pass.remaining,
        ...(local && junePass
          ? { usage: getJunePassUsageSummary(local), termsReminder: true as const }
          : {}),
      },
    };
  }

  if (resolved.priceGbp == null) return null;

  return {
    priceGbp: resolved.priceGbp,
    needsCardOnFile: options?.needsCardOnFile,
    accountUrl: resolveMindbodyClientAccountUrl(),
    // Communal Contrast keeps the Mindbody consumer-checkout handoff; other
    // classes charge the stored card on Rebase.
    ...(isCommunalContrastService(serviceName) ? { payInMindbody: true as const } : {}),
  };
}
