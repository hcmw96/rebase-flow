/** Rebase studio Mindbody site (public — used in OAuth and cart URLs). */
export const REBASE_MINDBODY_SITE_ID = '5736189';

/** Mindbody branded-web URLs for a studio site (site ID is public in OAuth). */
export function mindbodySignUpUrl(siteId: string): string {
  return `https://cart.mindbodyonline.com/sites/${siteId}/client/new`;
}

export function mindbodySignInUrl(siteId: string): string {
  return `https://cart.mindbodyonline.com/sites/${siteId}/session/new`;
}

/** Sign-up URL for the client app (env override, then studio default). */
export function resolveMindbodySignUpUrl(apiUrl?: string | null): string {
  const fromEnv = import.meta.env.VITE_MINDBODY_SITE_ID?.trim();
  if (fromEnv) return mindbodySignUpUrl(fromEnv);
  if (apiUrl && typeof apiUrl === 'string') return apiUrl;
  return mindbodySignUpUrl(REBASE_MINDBODY_SITE_ID);
}
