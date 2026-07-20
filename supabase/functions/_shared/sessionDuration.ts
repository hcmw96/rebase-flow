/**
 * Customer-facing session length from Mindbody service names
 * (e.g. "Hyperbaric Oxygen (90 mins)"). Mindbody DefaultTimeLength often
 * includes prep/cleanup buffer and must not be used to cut evening slots.
 */
export function extractMinutesFromName(name: string | null | undefined): number | null {
  if (!name) return null;
  const match = name.match(/(\d+)\s*(?:mins?|minutes?|min|minute)\b/i);
  return match ? parseInt(match[1], 10) : null;
}

/** Prefer name duration; fall back to DefaultTimeLength. */
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
