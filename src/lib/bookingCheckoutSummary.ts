import { priceOverrides } from '@/config/serviceConfig';
import { mindbodyClientAccountUrl } from '@/lib/mindbodyAuth';
import type { BookingCheckoutSummary } from '@/components/booking/BookingConfirmCheckout';
import type { ClientService } from '@/hooks/useMindbodyMembership';
import { hasCommunalContrastCredit, isCommunalContrastService } from '@/lib/bookingPaymentOptions';

export function findCommunalContrastPass(
  clientServices: ClientService[] | undefined,
): ClientService | null {
  if (!clientServices?.length) return null;
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
    return {
      priceGbp: priceOverrides['Communal Contrast'] ?? 65,
      pass: {
        name: pass.name,
        remaining: pass.remaining ?? null,
      },
    };
  }

  return {
    priceGbp: priceOverrides['Communal Contrast'] ?? 65,
    needsCardOnFile: options?.needsCardOnFile,
    accountUrl: mindbodyClientAccountUrl(),
  };
}
