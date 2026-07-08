import { format } from 'date-fns';

export const STUDIO_TIMEZONE = 'Europe/London';

function getLondonParts(date: Date) {
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
      .formatToParts(date)
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

/** Mindbody returns site-local datetimes without a timezone offset. */
export function parseMindbodyDateTime(value: string): Date {
  if (!value) return new Date(NaN);
  const trimmed = value.trim();
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(trimmed)) return new Date(trimmed);

  const normalized = trimmed.replace(' ', 'T');
  const match = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}(?:\.\d+)?)?)?/,
  );
  if (!match) return new Date(trimmed);

  const [, y, mo, d, h, mi, sec = '0'] = match;
  const target = {
    year: Number(y),
    month: Number(mo),
    day: Number(d),
    hour: Number(h),
    minute: Number(mi),
    second: Math.floor(Number(sec)),
  };

  let guess = Date.UTC(target.year, target.month - 1, target.day, target.hour, target.minute, target.second);
  for (let i = 0; i < 3; i++) {
    const parts = getLondonParts(new Date(guess));
    const diffMs =
      ((target.year - parts.year) * 372 +
        (target.month - parts.month) * 31 +
        (target.day - parts.day)) *
        86_400_000 +
      (target.hour - parts.hour) * 3_600_000 +
      (target.minute - parts.minute) * 60_000 +
      (target.second - parts.second) * 1_000;
    if (diffMs === 0) break;
    guess -= diffMs;
  }

  return new Date(guess);
}

export function mindbodyDateKey(value: string): string {
  const date = parseMindbodyDateTime(value);
  return new Intl.DateTimeFormat('en-CA', { timeZone: STUDIO_TIMEZONE }).format(date);
}

export function formatMindbodyTime(value: string, pattern = 'h:mm a'): string {
  return format(parseMindbodyDateTime(value), pattern);
}

export function formatMindbodyDate(value: string, pattern = 'EEEE, MMMM d, yyyy'): string {
  return format(parseMindbodyDateTime(value), pattern);
}

export function formatAppointmentTimeRange(
  startDateTime: string,
  endDateTime: string | null | undefined,
  customerDurationMinutes?: number | null,
): string {
  const start = parseMindbodyDateTime(startDateTime);
  if (customerDurationMinutes && customerDurationMinutes > 0) {
    const end = new Date(start.getTime() + customerDurationMinutes * 60_000);
    return `${format(start, 'h:mm a')} – ${format(end, 'h:mm a')}`;
  }
  if (endDateTime) {
    return `${format(start, 'h:mm a')} – ${format(parseMindbodyDateTime(endDateTime), 'h:mm a')}`;
  }
  return format(start, 'h:mm a');
}

export function isSameMindbodyDay(value: string, selectedDate: Date): boolean {
  return mindbodyDateKey(value) === format(selectedDate, 'yyyy-MM-dd');
}

export function studioCalendarDate(value: string): Date {
  const [y, m, d] = mindbodyDateKey(value).split('-').map(Number);
  return new Date(y, m - 1, d);
}

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
