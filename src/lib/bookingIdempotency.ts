/** Stable idempotency key for a single confirm attempt (prevents double-book on retry). */
export function createBookingIdempotencyKey(): string {
  return (
    (crypto as Crypto & { randomUUID?: () => string })?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}
