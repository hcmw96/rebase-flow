/** True for http(s) URLs that leave this origin (Instagram, Maps, etc.). */
export function isExternalHttpUrl(href: string | null | undefined): boolean {
  if (!href || typeof window === 'undefined') return false;
  try {
    const url = new URL(href, window.location.href);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    return url.origin !== window.location.origin;
  } catch {
    return false;
  }
}
