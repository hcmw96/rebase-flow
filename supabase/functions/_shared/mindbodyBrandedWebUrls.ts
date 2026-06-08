/** Branded-web URLs for Mindbody consumer site (studio site id is public in OAuth). */

export function mindbodySignUpUrl(siteId: string): string {
  return `https://clients.mindbodyonline.com/classic/ws?studioid=${encodeURIComponent(siteId)}&stype=42`;
}

/** Client account area — payment cards, profile (stype -2 + account sub-tab). */
export function mindbodyClientAccountUrl(siteId: string): string {
  return `https://clients.mindbodyonline.com/classic/ws?studioid=${encodeURIComponent(siteId)}&stype=-2&subTab=account`;
}
