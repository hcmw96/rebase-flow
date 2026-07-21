import { addDays } from 'date-fns';
import { studioCalendarDate, studioDateKeyAddDays, studioTodayKey } from './sessionTimes';

/** How far ahead guests can book appointments and classes on the website. */
export const BOOKING_DAYS_AHEAD = 90;

/**
 * Near window painted first on calendars. Premium Suite 90d days-view can take
 * tens of seconds cold; ~30d returns in a few seconds so dates aren't blank forever.
 */
export const BOOKING_NEAR_HORIZON_DAYS = 30;

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
