import { addDays, format, startOfDay } from 'date-fns';

/** How far ahead guests can book appointments and classes on the website. */
export const BOOKING_DAYS_AHEAD = 90;

export function bookingHorizonEndDate(from: Date = new Date()): Date {
  return addDays(startOfDay(from), BOOKING_DAYS_AHEAD);
}

export function bookingHorizonDateRange(from: Date = new Date()) {
  const start = startOfDay(from);
  return {
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(addDays(start, BOOKING_DAYS_AHEAD), 'yyyy-MM-dd'),
  };
}
