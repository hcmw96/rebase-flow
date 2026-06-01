import { CONTRAST_PASS_OFFER, isContrastPassSaleActive } from '@/config/contrastPassOffer';
import { priceOverrides } from '@/config/serviceConfig';
import {
  findCommunalContrastDropInProduct,
  findContrastPassProduct,
} from '@/lib/mindbodyProducts';
import { mindbodyBuySaleServiceUrl, mindbodyCatalogUrl, REBASE_MINDBODY_SITE_ID } from '@/lib/mindbodyAuth';
import type { MindbodyService } from '@/hooks/useMindbodyServices';
import type { ClientService } from '@/hooks/useMindbodyMembership';

export type BookingPaymentOption = {
  id: string;
  label: string;
  description: string;
  priceGbp: number;
  href: string;
  /** Opens Mindbody checkout in a new tab */
  external: boolean;
};

function resolveSiteId(): string {
  return import.meta.env.VITE_MINDBODY_SITE_ID?.trim() || REBASE_MINDBODY_SITE_ID;
}

export function isCommunalContrastService(serviceName: string | undefined | null): boolean {
  if (!serviceName) return false;
  return /communal\s*contrast|members?\s*suite/i.test(serviceName);
}

/** True when the signed-in client has an unused pass/credit for communal contrast. */
export function hasCommunalContrastCredit(clientServices: ClientService[] | undefined): boolean {
  if (!clientServices?.length) return false;
  return clientServices.some((s) => {
    if (/contrast|communal|members?\s*suite|off\s*peak|pass|unlimited|visit/i.test(s.name)) {
      return s.remaining === undefined || s.remaining > 0;
    }
    return false;
  });
}

export function buildCommunalContrastPaymentOptions(
  services: MindbodyService[] | undefined,
): BookingPaymentOption[] {
  const siteId = resolveSiteId();
  const options: BookingPaymentOption[] = [];
  const dropIn = findCommunalContrastDropInProduct(services);
  const dropInPrice =
    dropIn?.price != null && dropIn.price > 0
      ? dropIn.price
      : (priceOverrides['Communal Contrast'] ?? 65);

  options.push({
    id: 'drop-in',
    label: `Pay for this visit — £${dropInPrice}`,
    description: 'Single communal contrast session. Checkout on Mindbody, then return here to confirm your time.',
    priceGbp: dropInPrice,
    href: dropIn?.id
      ? mindbodyBuySaleServiceUrl(siteId, dropIn.id)
      : mindbodyCatalogUrl(siteId),
    external: true,
  });

  if (isContrastPassSaleActive()) {
    const pass = findContrastPassProduct(services);
    const passPrice =
      pass?.price != null && pass.price > 0 ? pass.price : CONTRAST_PASS_OFFER.priceGbp;
    options.push({
      id: 'two-week-pass',
      label: `2-week unlimited pass — £${passPrice}`,
      description: 'One session per day for 14 days from purchase (June offer).',
      priceGbp: passPrice,
      href: CONTRAST_PASS_OFFER.path,
      external: false,
    });
  }

  return options;
}
