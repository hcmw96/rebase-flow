export const STUDIO_TIMEZONE = 'Europe/London';

const LONDON_DATE_FORMATS: Record<string, Intl.DateTimeFormatOptions> = {
  'h:mm a': { hour: 'numeric', minute: '2-digit', hour12: true },
  'HH:mm': { hour: '2-digit', minute: '2-digit', hour12: false },
  'EEEE, MMMM d, yyyy': { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
  'EEE, MMM d': { weekday: 'short', month: 'short', day: 'numeric' },
  'EEE, MMM d, yyyy': { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' },
  'MMM d, yyyy': { month: 'short', day: 'numeric', year: 'numeric' },
};

function getLondonParts(timestamp: number) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: STUDIO_TIMEZONE,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    })
      .formatToParts(new Date(timestamp))
      .filter((part) => part.type !== 'literal')
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

function formatInLondon(date: Date, pattern: string): string {
  const options = LONDON_DATE_FORMATS[pattern];
  if (!options) {
    throw new Error(`Unsupported London date format: ${pattern}`);
  }
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: STUDIO_TIMEZONE,
    ...options,
  }).format(date);
}

/** Mindbody datetimes without an offset are site-local London wall times. */
export function parseMindbodyDateTime(value: string): Date {
  if (!value) return new Date(NaN);
  const trimmed = value.trim();
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(trimmed);
  }

  const normalized = trimmed.replace(' ', 'T');
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

export function mindbodyDateKey(value: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: STUDIO_TIMEZONE,
  }).format(parseMindbodyDateTime(value));
}

export function studioTodayKey(now: number = Date.now()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: STUDIO_TIMEZONE,
  }).format(new Date(now));
}

export function studioDateKeyFromCalendar(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: STUDIO_TIMEZONE,
  }).format(date);
}

/** Local Y-M-D from a DayPicker date (studio day encoded as local calendar components). */
export function localCalendarDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Add calendar days to a YYYY-MM-DD studio date key. */
export function studioDateKeyAddDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const noonUtc = Date.UTC(y, m - 1, d, 12, 0, 0);
  const shifted = noonUtc + days * 24 * 60 * 60 * 1000;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: STUDIO_TIMEZONE,
  }).format(new Date(shifted));
}

export function formatMindbodyTime(value: string, pattern = 'h:mm a'): string {
  return formatInLondon(parseMindbodyDateTime(value), pattern);
}

export function formatMindbodyDate(value: string, pattern = 'EEEE, MMMM d, yyyy'): string {
  return formatInLondon(parseMindbodyDateTime(value), pattern);
}

export function formatAppointmentTimeRange(
  startDateTime: string,
  endDateTime: string | null | undefined,
  customerDurationMinutes?: number | null,
): string {
  const start = parseMindbodyDateTime(startDateTime);
  if (customerDurationMinutes && customerDurationMinutes > 0) {
    const end = new Date(start.getTime() + customerDurationMinutes * 60_000);
    return `${formatInLondon(start, 'h:mm a')} – ${formatInLondon(end, 'h:mm a')}`;
  }
  if (endDateTime) {
    const end = parseMindbodyDateTime(endDateTime);
    return `${formatInLondon(start, 'h:mm a')} – ${formatInLondon(end, 'h:mm a')}`;
  }
  return formatInLondon(start, 'h:mm a');
}

export function isSameMindbodyDay(value: string, selectedDate: Date): boolean {
  // DayPicker values are local Y-M-D stand-ins for studio calendar days — do not
  // re-format midnight through London or far timezones shift the day.
  return mindbodyDateKey(value) === localCalendarDayKey(selectedDate);
}

export function studioCalendarDate(value: string): Date {
  const [y, m, d] = mindbodyDateKey(value).split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** True when the session start is strictly in the future (bookable). */
export function isUpcomingSession(
  startDateTime: string,
  now: number = Date.now(),
): boolean {
  const start = parseMindbodyDateTime(startDateTime).getTime();
  return Number.isFinite(start) && start > now;
}

/** Drop appointments/classes that have already started. */
export function filterUpcomingSessions<T extends { startDateTime: string }>(
  items: T[],
  now: number = Date.now(),
): T[] {
  return items.filter((item) => isUpcomingSession(item.startDateTime, now));
}

/** Mindbody bookings may expose `startTime` (API) or `startDateTime` (local rows). */
export function bookingStartDateTime(
  booking: { startTime?: string | null; startDateTime?: string | null },
): string {
  return (booking.startTime || booking.startDateTime || '').trim();
}

export function parseBookingStartTime(
  booking: { startTime?: string | null; startDateTime?: string | null },
): Date {
  return parseMindbodyDateTime(bookingStartDateTime(booking));
}

export function formatBookingDate(
  booking: { startTime?: string | null; startDateTime?: string | null },
  pattern = 'EEEE, MMMM d, yyyy',
): string {
  const value = bookingStartDateTime(booking);
  return value ? formatMindbodyDate(value, pattern) : '';
}

export function formatBookingTime(
  booking: { startTime?: string | null; startDateTime?: string | null },
  pattern = 'h:mm a',
): string {
  const value = bookingStartDateTime(booking);
  return value ? formatMindbodyTime(value, pattern) : '';
}
