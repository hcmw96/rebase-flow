/** Despia native shell — always use same-tab redirects (no popups). */
export function isDespiaNative(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /despia/i.test(navigator.userAgent);
}

/** Phone / tablet browsers and the native app wrapper. */
export function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (isDespiaNative()) return true;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * OAuth popups break on mobile (new tab, blocked, or no postMessage back).
 * Same-tab redirect + stashed booking progress is the reliable path.
 */
export function shouldUseOAuthPopup(): boolean {
  return !isMobileBrowser();
}

/**
 * Open a Mindbody page. Mobile uses same-tab navigation so sessionStorage
 * booking progress survives the round trip; desktop prefers a new tab.
 */
export function openMindbodyExternalUrl(url: string, options?: { forceSameTab?: boolean }): void {
  const sameTab = options?.forceSameTab ?? isMobileBrowser();
  if (sameTab) {
    window.location.assign(url);
    return;
  }
  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (!opened) {
    window.location.assign(url);
  }
}
