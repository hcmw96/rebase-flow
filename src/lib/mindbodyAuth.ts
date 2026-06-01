/** Rebase studio Mindbody site (public — used in OAuth and cart URLs). */
export const REBASE_MINDBODY_SITE_ID = '5736189';

/** Mindbody branded-web URLs for a studio site (site ID is public in OAuth). */
export function mindbodySignUpUrl(siteId: string): string {
  return `https://cart.mindbodyonline.com/sites/${siteId}/client/new`;
}

export function mindbodySignInUrl(siteId: string): string {
  return `https://cart.mindbodyonline.com/sites/${siteId}/session/new`;
}

/** Branded-web catalog (pricing options / passes). */
export function mindbodyCatalogUrl(siteId: string): string {
  return `https://cart.mindbodyonline.com/sites/${siteId}`;
}

/**
 * Deep link to buy a sale/pricing option by Mindbody service Id (from `pack-{id}` in our API).
 * Override with VITE_CONTRAST_PASS_BUY_URL if your studio uses a custom Mindbody link.
 */
export function mindbodyBuySaleServiceUrl(siteId: string, saleServiceId: string | number): string {
  const override = import.meta.env.VITE_CONTRAST_PASS_BUY_URL?.trim();
  if (override) return override;

  const id = String(saleServiceId).replace(/^pack-/, '');
  return `https://cart.mindbodyonline.com/sites/${encodeURIComponent(siteId)}/cart?itemId=${encodeURIComponent(id)}`;
}

/** Sign-up URL for the client app (env override, then studio default). */
export function resolveMindbodySignUpUrl(apiUrl?: string | null): string {
  const fromEnv = import.meta.env.VITE_MINDBODY_SITE_ID?.trim();
  if (fromEnv) return mindbodySignUpUrl(fromEnv);
  if (apiUrl && typeof apiUrl === 'string') return apiUrl;
  return mindbodySignUpUrl(REBASE_MINDBODY_SITE_ID);
}
