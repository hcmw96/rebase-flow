import { addDays } from 'date-fns';
import { studioCalendarDate, studioDateKeyAddDays, studioTodayKey } from './sessionTimes';

/** How far ahead guests can book appointments and classes on the website. */
export const BOOKING_DAYS_AHEAD = 90;

/**
 * First paint window for calendars. Suites are dense week-one; massage staff often
 * open further out — empty near windows keep the spinner until the full horizon lands.
 */
export const BOOKING_NEAR_HORIZON_DAYS = 21;

export function bookingHorizonEndDate(fromKey: string = studioTodayKey()): Date {
  return addDays(studioCalendarDate(fromKey), BOOKING_DAYS_AHEAD);
}

export function bookingHorizonDateRange(fromKey: string = studioTodayKey()) {
  return {
    startDate: fromKey,
    endDate: studioDateKeyAddDays(fromKey, BOOKING_DAYS_AHEAD),
  };
}

export function bookingNearHorizonDateRange(fromKey: string = studioTodayKey()) {
  return {
    startDate: fromKey,
    endDate: studioDateKeyAddDays(fromKey, BOOKING_NEAR_HORIZON_DAYS),
  };
}
