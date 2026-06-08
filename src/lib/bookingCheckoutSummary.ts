import { priceOverrides } from '@/config/serviceConfig';
import { resolveMindbodyClientAccountUrl } from '@/lib/mindbodyAuth';
import type { BookingCheckoutSummary } from '@/components/booking/BookingConfirmCheckout';
import type { ClientService } from '@/hooks/useMindbodyMembership';
import { isCommunalContrastService } from '@/lib/bookingPaymentOptions';
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
  return (
    clientServices.find((s) => {
      if (!/contrast|communal|members?\s*suite|off\s*peak|pass|unlimited|visit/i.test(s.name)) {
        return false;
      }
      return s.remaining === undefined || s.remaining > 0;
    }) ?? null
  );
}

export function buildCommunalContrastCheckoutSummary(
  serviceName: string | undefined | null,
  clientServices: ClientService[] | undefined,
  options?: { needsCardOnFile?: boolean },
): BookingCheckoutSummary | null {
  if (!isCommunalContrastService(serviceName)) return null;

  const pass = findCommunalContrastPass(clientServices);
  if (pass) {
    const junePass = isJuneContrastPassName(pass.name);
    return {
      priceGbp: priceOverrides['Communal Contrast'] ?? 65,
      pass: {
        name: pass.name,
        remaining: pass.remaining ?? null,
        ...(junePass
          ? { usage: getJunePassUsageSummary(pass), termsReminder: true as const }
          : {}),
      },
    };
  }

  return {
    priceGbp: priceOverrides['Communal Contrast'] ?? 65,
    needsCardOnFile: options?.needsCardOnFile,
    accountUrl: resolveMindbodyClientAccountUrl(),
  };
}
