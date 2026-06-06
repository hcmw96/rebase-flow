const NO_CARD_SESSION_KEY = 'rebase_mb_needs_card';

/** Remember that this Mindbody session needs a card (same browser tab/session). */
export function markSessionNeedsPaymentCard(sessionId: string): void {
  try {
    sessionStorage.setItem(NO_CARD_SESSION_KEY, sessionId);
  } catch {
    /* ignore */
  }
}

export function sessionNeedsPaymentCard(sessionId: string | undefined): boolean {
  if (!sessionId) return false;
  try {
    return sessionStorage.getItem(NO_CARD_SESSION_KEY) === sessionId;
  } catch {
    return false;
  }
}

export function clearSessionNeedsPaymentCard(): void {
  try {
    sessionStorage.removeItem(NO_CARD_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
