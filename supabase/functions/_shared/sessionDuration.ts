/**
 * Customer-facing session length from Mindbody service names
 * (e.g. "Hyperbaric Oxygen (90 mins)"). Mindbody DefaultTimeLength often
 * includes prep/cleanup buffer and must not be used to cut evening slots
 * for guest-facing display — but it *must* be used to reserve the room.
 */
export function extractMinutesFromName(name: string | null | undefined): number | null {
  if (!name) return null;
  const match = name.match(/(\d+)\s*(?:mins?|minutes?|min|minute)\b/i);
  return match ? parseInt(match[1], 10) : null;
}

/** Prefer name duration; fall back to DefaultTimeLength. Guest-facing treatment length. */
export function resolveBookableSessionMinutes(
  sessionTypeName: string | null | undefined,
  defaultTimeLength: number | null | undefined,
  fallback = 60,
): number {
  const fromName = extractMinutesFromName(sessionTypeName);
  if (fromName != null && fromName > 0) return fromName;
  if (defaultTimeLength != null && defaultTimeLength > 0) return defaultTimeLength;
  return fallback;
}

/**
 * Room block length for availability fit + Mindbody EndDateTime.
 * Prefer DefaultTimeLength (treatment + changeover); never shorter than the guest session.
 */
export function resolveRoomBlockMinutes(
  sessionTypeName: string | null | undefined,
  defaultTimeLength: number | null | undefined,
  fallback = 60,
): number {
  const guest = resolveBookableSessionMinutes(sessionTypeName, defaultTimeLength, fallback);
  if (defaultTimeLength != null && defaultTimeLength > 0) {
    return Math.max(defaultTimeLength, guest);
  }
  return guest;
}

/** ISO end instant for a start + duration in minutes. */
export function endDateTimeFromStart(
  startDateTime: string,
  durationMinutes: number,
): string | null {
  const startMs = Date.parse(startDateTime);
  if (!Number.isFinite(startMs) || durationMinutes <= 0) return null;
  return new Date(startMs + durationMinutes * 60_000).toISOString();
}

/**
 * Prefer the longer of the client-supplied end and start + room block.
 * Prevents short EndDateTime from under-blocking changeover.
 */
export function resolveEffectiveEndDateTime(
  startDateTime: string,
  clientEndDateTime: string | null | undefined,
  blockMinutes: number | null | undefined,
): string | undefined {
  const blockEnd =
    blockMinutes != null && blockMinutes > 0
      ? endDateTimeFromStart(startDateTime, blockMinutes)
      : null;

  if (!clientEndDateTime) return blockEnd ?? undefined;

  const clientMs = Date.parse(clientEndDateTime);
  if (!Number.isFinite(clientMs)) return blockEnd ?? undefined;

  if (blockEnd) {
    const blockMs = Date.parse(blockEnd);
    if (Number.isFinite(blockMs) && clientMs < blockMs - 500) return blockEnd;
  }
  return clientEndDateTime;
}
