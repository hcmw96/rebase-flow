/** True when the session start is strictly in the future (bookable). */
export function isUpcomingSession(
  startDateTime: string,
  now: number = Date.now(),
): boolean {
  const start = new Date(startDateTime).getTime();
  return Number.isFinite(start) && start > now;
}

/** Drop appointments/classes that have already started. */
export function filterUpcomingSessions<T extends { startDateTime: string }>(
  items: T[],
  now: number = Date.now(),
): T[] {
  return items.filter((item) => isUpcomingSession(item.startDateTime, now));
}
