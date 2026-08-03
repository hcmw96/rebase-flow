/** GTM dataLayer helpers — safe when GTM is blocked or unavailable. */

export type BookingConfirmedType = 'drop-in' | 'class' | 'membership' | 'pass';

export type BookingConfirmedPayload = {
  bookingType: BookingConfirmedType;
  service: string;
  /** Numeric GBP amount paid (0 when covered by a pass). */
  value: number;
};

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/** Session-scoped dedupe (survives React Strict Mode remounts). */
const firedBookingConfirmedKeys = new Set<string>();

/**
 * Push a booking_confirmed conversion to GTM. Never throws.
 * Prefer {@link pushBookingConfirmedOnce} from UI so remounts cannot double-fire.
 */
export function pushBookingConfirmed(payload: BookingConfirmedPayload): void {
  try {
    const value = Number.isFinite(payload.value) ? payload.value : 0;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'booking_confirmed',
      bookingType: payload.bookingType,
      service: payload.service,
      value,
      currency: 'GBP',
    });
  } catch {
    // Ad blockers / missing window — ignore
  }
}

/**
 * Fire at most once per dedupe key for this page session.
 * Use a stable key (e.g. bookingType + service + start time).
 */
export function pushBookingConfirmedOnce(
  dedupeKey: string,
  payload: BookingConfirmedPayload,
): void {
  if (!dedupeKey || firedBookingConfirmedKeys.has(dedupeKey)) return;
  firedBookingConfirmedKeys.add(dedupeKey);
  pushBookingConfirmed(payload);
}
