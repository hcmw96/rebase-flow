/** Rebase studio Mindbody site (public — used in OAuth and cart URLs). */
export const REBASE_MINDBODY_SITE_ID = '5736189';

/** Mindbody branded-web URLs for a studio site (site ID is public in OAuth). */
export function mindbodySignUpUrl(siteId: string): string {
  return `https://cart.mindbodyonline.com/sites/${siteId}/client/new`;
}

export function mindbodySignInUrl(siteId: string): string {
  return `https://cart.mindbodyonline.com/sites/${siteId}/session/new`;
}

/** Client account area (add card, profile) — not the public pricing catalog. */
export function mindbodyClientAccountUrl(siteId?: string): string {
  const id = siteId?.trim() || import.meta.env.VITE_MINDBODY_SITE_ID?.trim() || REBASE_MINDBODY_SITE_ID;
  return `https://cart.mindbodyonline.com/sites/${encodeURIComponent(id)}/client`;
}

/**
 * All online pricing options (Mindbody Marketing Links format).
 * @see https://support.mindbodyonline.com/s/article/How-to-create-and-use-Mindbody-Marketing-Links
 */
export function mindbodyPricingListUrl(siteId: string): string {
  return `https://go.mindbodyonline.com/book/app/pricing/${encodeURIComponent(siteId)}`;
}

/** @deprecated Use mindbodyPricingListUrl */
export function mindbodyCatalogUrl(siteId: string): string {
  return mindbodyPricingListUrl(siteId);
}

/**
 * Checkout for one pricing option (sale service id from API `pack-{id}`).
 * Override with VITE_CONTRAST_PASS_BUY_URL if Mindbody gives you a custom marketing link.
 */
export function mindbodyBuySaleServiceUrl(siteId: string, saleServiceId?: string | number): string {
  const override = import.meta.env.VITE_CONTRAST_PASS_BUY_URL?.trim();
  if (override) return override;

  const site = encodeURIComponent(siteId);
  if (saleServiceId != null && String(saleServiceId).replace(/^pack-/, '').length > 0) {
    const productId = String(saleServiceId).replace(/^pack-/, '');
    return `https://go.mindbodyonline.com/book/app/pricing/${site}/${encodeURIComponent(productId)}`;
  }
  return mindbodyPricingListUrl(siteId);
}

/** Sign-up URL for the client app (env override, then studio default). */
export function resolveMindbodySignUpUrl(apiUrl?: string | null): string {
  const fromEnv = import.meta.env.VITE_MINDBODY_SITE_ID?.trim();
  if (fromEnv) return mindbodySignUpUrl(fromEnv);
  if (apiUrl && typeof apiUrl === 'string') return apiUrl;
  return mindbodySignUpUrl(REBASE_MINDBODY_SITE_ID);
}
