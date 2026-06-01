import { CONTRAST_PASS_OFFER } from '@/config/contrastPassOffer';
import type { MindbodyService } from '@/hooks/useMindbodyServices';

export function findContrastPassProduct(
  services: MindbodyService[] | undefined,
): MindbodyService | null {
  if (!services?.length) return null;
  const exact = services.find(
    (s) => s.isPack && s.name.trim() === CONTRAST_PASS_OFFER.mindbodyProductName,
  );
  if (exact) return exact;
  return (
    services.find((s) => s.isPack && CONTRAST_PASS_OFFER.mindbodyNamePattern.test(s.name)) ?? null
  );
}

const COMMUNAL_DROP_IN_NAME =
  /communal\s*contrast|members?\s*suite|off\s*peak\s*access|members?\s*only|drop[\s-]?in|single\s*visit/i;

/** Single-visit / drop-in pricing option for communal contrast (not the 2-week pass). */
export function findCommunalContrastDropInProduct(
  services: MindbodyService[] | undefined,
): MindbodyService | null {
  if (!services?.length) return null;
  const packs = services.filter((s) => s.isPack);
  const named = packs.find(
    (s) =>
      !CONTRAST_PASS_OFFER.mindbodyNamePattern.test(s.name) &&
      COMMUNAL_DROP_IN_NAME.test(s.name),
  );
  if (named) return named;
  return (
    packs.find(
      (s) =>
        !CONTRAST_PASS_OFFER.mindbodyNamePattern.test(s.name) &&
        s.price != null &&
        s.price >= 60 &&
        s.price <= 70,
    ) ?? null
  );
}
