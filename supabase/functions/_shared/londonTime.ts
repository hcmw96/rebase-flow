export const STUDIO_TIMEZONE = "Europe/London";

function getLondonParts(timestamp: number) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: STUDIO_TIMEZONE,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    })
      .formatToParts(new Date(timestamp))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

/** Mindbody datetimes without an offset are site-local London wall times. */
export function parseMindbodyLocalDateTime(value: string): Date {
  if (!value) return new Date(NaN);
  const trimmed = value.trim();
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(trimmed);
  }

  const normalized = trimmed.replace(" ", "T");
  const match = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}(?:\.\d+)?)?)?/,
  );
  if (!match) return new Date(trimmed);

  const target = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Math.floor(Number(match[6] ?? 0)),
  };

  let timestamp = Date.UTC(
    target.year,
    target.month - 1,
    target.day,
    target.hour,
    target.minute,
    target.second,
  );

  for (let i = 0; i < 5; i++) {
    const parts = getLondonParts(timestamp);
    const asUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    const wantUtc = Date.UTC(
      target.year,
      target.month - 1,
      target.day,
      target.hour,
      target.minute,
      target.second,
    );
    const diff = wantUtc - asUtc;
    if (diff === 0) break;
    timestamp += diff;
  }

  return new Date(timestamp);
}

export function toUtcIsoFromMindbody(value: string): string {
  return parseMindbodyLocalDateTime(value).toISOString();
}

export function studioTodayKey(now: number = Date.now()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: STUDIO_TIMEZONE,
  }).format(new Date(now));
}

/** London Y-M-D for an absolute instant. */
export function studioDateKeyFromInstant(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: STUDIO_TIMEZONE,
  }).format(date);
}

/** Add calendar days to a YYYY-MM-DD studio date key. */
export function studioDateKeyAddDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const noonUtc = Date.UTC(y, m - 1, d, 12, 0, 0);
  const shifted = noonUtc + days * 24 * 60 * 60 * 1000;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: STUDIO_TIMEZONE,
  }).format(new Date(shifted));
}
