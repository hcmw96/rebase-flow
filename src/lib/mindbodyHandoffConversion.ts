import { resolveDisplayName } from '@/config/serviceConfig';
import { waitForMatchingBooking } from '@/hooks/useMindbodyBookings';
import { isCommunalContrastService } from '@/lib/bookingPaymentOptions';
import { pushBookingConfirmedOnce } from '@/lib/gtmDataLayer';
import {
  clearMindbodyCheckoutHandoff,
  peekMindbodyCheckoutHandoff,
  type MindbodyCheckoutHandoff,
} from '@/lib/mindbodyCheckoutUrls';

const HANDOFF_POLL_ATTEMPTS = 5;
const HANDOFF_POLL_DELAY_MS = 2000; // ~10s total; first check immediate

/**
 * After Mindbody consumer checkout, poll my-bookings for a NEW match vs the
 * pre-handoff snapshot, then fire booking_confirmed. Clears handoff only on match.
 */
export async function confirmHandoffBookingConversion(sessionId: string): Promise<boolean> {
  const handoff = peekMindbodyCheckoutHandoff();
  if (!handoff?.startDateTime) return false;

  const params =
    handoff.kind === 'class'
      ? {
          bookingType: 'class' as const,
          classId: handoff.classId,
          startDateTime: handoff.startDateTime,
        }
      : {
          bookingType: 'appointment' as const,
          startDateTime: handoff.startDateTime,
        };

  const matched = await waitForMatchingBooking(
    sessionId,
    params,
    HANDOFF_POLL_ATTEMPTS,
    HANDOFF_POLL_DELAY_MS,
    { excludeBookingIds: handoff.knownBookingIds ?? [] },
  );

  if (!matched) return false;

  fireHandoffBookingConfirmed(handoff);
  clearMindbodyCheckoutHandoff();
  return true;
}

function fireHandoffBookingConfirmed(handoff: MindbodyCheckoutHandoff): void {
  const serviceLabel = resolveDisplayName(handoff.serviceName);
  const bookingType =
    handoff.kind === 'appointment' ||
    isCommunalContrastService(handoff.serviceName) ||
    isCommunalContrastService(serviceLabel)
      ? 'drop-in'
      : 'class';
  // handoff.valueGbp is list price at handoff, not amount actually paid — wrong if a
  // promo is applied in Mindbody. Server-side reconciliation is the real fix.
  const value =
    typeof handoff.valueGbp === 'number' && Number.isFinite(handoff.valueGbp)
      ? handoff.valueGbp
      : 0;
  pushBookingConfirmedOnce(`${bookingType}:${serviceLabel}:${handoff.startDateTime}`, {
    bookingType,
    service: serviceLabel,
    value,
  });
}
