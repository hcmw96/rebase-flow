/** Branded-web URLs for Mindbody consumer site (studio site id is public in OAuth). */

/** New-client registration — su1.asp (stype=42 opens the online store, not sign-up). */
export function mindbodySignUpUrl(siteId: string): string {
  return `https://clients.mindbodyonline.com/ASP/su1.asp?studioid=${encodeURIComponent(siteId)}`;
}

/** Client account area — payment cards, profile (stype -2 + account sub-tab). */
export function mindbodyClientAccountUrl(siteId: string): string {
  return `https://clients.mindbodyonline.com/classic/ws?studioid=${encodeURIComponent(siteId)}&stype=-2&subTab=account`;
}
