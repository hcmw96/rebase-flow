/** Stable idempotency key for a single confirm attempt (prevents double-book on retry). */
export function createBookingIdempotencyKey(): string {
  return (
    (crypto as Crypto & { randomUUID?: () => string })?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

/** Deterministic key for a specific slot — survives step navigation and blocks duplicate charges. */
export function buildSlotBookingIdempotencyKey(parts: {
  sessionId: string;
  bookingType: 'class' | 'appointment';
  classId?: string;
  sessionTypeId?: string;
  staffId?: string;
  startDateTime?: string;
}): string {
  return [
    'slot',
    parts.sessionId,
    parts.bookingType,
    parts.classId || parts.sessionTypeId || '',
    parts.staffId || '',
    parts.startDateTime || '',
  ].join(':');
}
