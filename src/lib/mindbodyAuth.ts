import { openMindbodyExternalUrl } from '@/lib/mobileBrowser';

/** Rebase studio Mindbody site (public — used in OAuth and cart URLs). */
export const REBASE_MINDBODY_SITE_ID = '5736189';

function resolveSiteId(siteId?: string): string {
  return siteId?.trim() || import.meta.env.VITE_MINDBODY_SITE_ID?.trim() || REBASE_MINDBODY_SITE_ID;
}

/** Branded-web new-client registration (stype 42 = create account). */
export function mindbodySignUpUrl(siteId: string): string {
  return `https://clients.mindbodyonline.com/classic/ws?studioid=${encodeURIComponent(siteId)}&stype=42`;
}

/** @deprecated Rebase uses OAuth sign-in — kept for reference only. */
export function mindbodySignInUrl(siteId: string): string {
  return mindbodyClientAccountUrl(siteId);
}

/**
 * Mindbody client account — payment cards & profile.
 * @see https://clients.mindbodyonline.com/classic/ws?studioid=5736189&stype=-2&subTab=account
 */
export function mindbodyClientAccountUrl(siteId?: string): string {
  const override = import.meta.env.VITE_MINDBODY_ACCOUNT_URL?.trim();
  if (override) return override;

  const id = resolveSiteId(siteId);
  return `https://clients.mindbodyonline.com/classic/ws?studioid=${encodeURIComponent(id)}&stype=-2&subTab=account`;
}

/** Open the Mindbody account page (add card, profile) — same-tab on mobile. */
export function openMindbodyClientAccount(siteId?: string): void {
  openMindbodyExternalUrl(mindbodyClientAccountUrl(siteId));
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

/** Account URL for payment cards — env override, then studio default. */
export function resolveMindbodyClientAccountUrl(apiUrl?: string | null): string {
  const override = import.meta.env.VITE_MINDBODY_ACCOUNT_URL?.trim();
  if (override) return override;
  if (apiUrl && typeof apiUrl === 'string') return apiUrl;
  return mindbodyClientAccountUrl();
}
