/** Mindbody branded-web URLs for a studio site (site ID is public in OAuth). */
export function mindbodySignUpUrl(siteId: string): string {
  return `https://cart.mindbodyonline.com/sites/${siteId}/client/new`;
}

export function mindbodySignInUrl(siteId: string): string {
  return `https://cart.mindbodyonline.com/sites/${siteId}/session/new`;
}
