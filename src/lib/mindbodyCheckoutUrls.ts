import { parseMindbodyDateTime } from '@/lib/sessionTimes';
import { openMindbodyExternalUrl } from '@/lib/mobileBrowser';
import { REBASE_MINDBODY_SITE_ID } from '@/lib/mindbodyAuth';

function resolveSiteId(siteId?: string): string {
  return siteId?.trim() || import.meta.env.VITE_MINDBODY_SITE_ID?.trim() || REBASE_MINDBODY_SITE_ID;
}

/** Mindbody classic expects US-style dates in the studio timezone. */
function mindbodyClassicDate(startDateTime: string): string {
  const date = parseMindbodyDateTime(startDateTime);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/London',
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/**
 * Deep-link into Mindbody consumer class booking (card / Apple Pay checkout).
 * Same surface the white-label app uses for book-and-pay.
 *
 * @see https://support.mindbodyonline.com/s/article/206613877-Links-Creating-a-link-to-a-specific-class
 */
export function mindbodyClassBookAndPayUrl(opts: {
  classId: string;
  startDateTime: string;
  locationId?: number | null;
  programId?: number | null;
  siteId?: string;
}): string {
  const params = new URLSearchParams({
    studioid: resolveSiteId(opts.siteId),
    stype: '-7',
    sclassid: String(opts.classId),
    sDate: mindbodyClassicDate(opts.startDateTime),
  });
  if (opts.locationId != null && Number(opts.locationId) > 0) {
    params.set('sLoc', String(opts.locationId));
  }
  if (opts.programId != null && Number(opts.programId) > 0) {
    params.set('sTG', String(opts.programId));
  }
  return `https://clients.mindbodyonline.com/classic/ws?${params.toString()}`;
}

/**
 * Mindbody consumer appointments — supports new card + Apple Pay (Safari / branded web).
 * @see https://support.mindbodyonline.com/s/article/How-to-create-and-use-Mindbody-Marketing-Links
 */
export function mindbodyAppointmentBookAndPayUrl(opts?: { siteId?: string }): string {
  const site = encodeURIComponent(resolveSiteId(opts?.siteId));
  return `https://go.mindbodyonline.com/book/app/appointments/${site}/services`;
}

export function openMindbodyBookAndPay(url: string): void {
  openMindbodyExternalUrl(url);
}

const HANDOFF_KEY = 'rebase_mb_checkout_handoff';

export type MindbodyCheckoutHandoff = {
  kind: 'class' | 'appointment';
  serviceName: string;
  startDateTime: string;
  classId?: string;
  checkoutUrl: string;
  storedAt: number;
};

export function stashMindbodyCheckoutHandoff(
  payload: Omit<MindbodyCheckoutHandoff, 'storedAt'>,
): void {
  try {
    sessionStorage.setItem(
      HANDOFF_KEY,
      JSON.stringify({ ...payload, storedAt: Date.now() } satisfies MindbodyCheckoutHandoff),
    );
  } catch {
    /* ignore */
  }
}

export function peekMindbodyCheckoutHandoff(): MindbodyCheckoutHandoff | null {
  try {
    const raw = sessionStorage.getItem(HANDOFF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MindbodyCheckoutHandoff;
    if (!parsed?.checkoutUrl || !parsed.serviceName) return null;
    // 2h — long enough for Apple Pay / account creation in Mindbody
    if (Date.now() - (parsed.storedAt || 0) > 2 * 60 * 60 * 1000) {
      sessionStorage.removeItem(HANDOFF_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearMindbodyCheckoutHandoff(): void {
  try {
    sessionStorage.removeItem(HANDOFF_KEY);
  } catch {
    /* ignore */
  }
}
