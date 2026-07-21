import { useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { localCalendarDayKey, studioCalendarDate, studioTodayKey } from '@/lib/sessionTimes';
import { Loader2 } from 'lucide-react';

interface BookingCalendarProps {
  selectedDate: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  availableDates?: Date[];
  isLoading?: boolean;
  /** True when availability request failed — never conflate with empty schedule. */
  isError?: boolean;
  className?: string;
  /** Last selectable day (inclusive). */
  toDate?: Date;
}

const BookingCalendar = ({
  selectedDate,
  onSelect,
  availableDates,
  isLoading,
  isError,
  className,
  toDate,
}: BookingCalendarProps) => {
  const today = studioCalendarDate(studioTodayKey());
  const availabilityLoaded = !isLoading;

  const availableKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const d of availableDates ?? []) {
      keys.add(localCalendarDayKey(d));
    }
    return keys;
  }, [availableDates]);

  const isDateAvailable = (date: Date) => {
    if (!availabilityLoaded) return false;
    if (!availableKeys.size) return false;
    return availableKeys.has(localCalendarDayKey(date));
  };

  // Prefer the month that has slots so we don't open on an empty later month.
  const defaultMonth = selectedDate ?? availableDates?.[0] ?? today;
  // Remount when availability first resolves so defaultMonth applies.
  const calendarKey = availabilityLoaded
    ? `ready-${availableDates?.[0] ? localCalendarDayKey(availableDates[0]) : 'none'}`
    : 'loading';

  return (
    <div
      className={cn(
        'glass-card relative w-full min-w-0 max-w-full overflow-hidden rounded-xl p-3 sm:p-4',
        className,
      )}
    >
      {isLoading && (
        <div className="absolute top-3 right-3 z-10">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
      {!isLoading && isError && availableKeys.size === 0 && (
        <p className="mb-3 text-sm text-foreground/80">
          Couldn&apos;t load availability right now. Close and try again, or email
          reception@rebaserecovery.com.
        </p>
      )}
      {!isLoading && !isError && availableKeys.size === 0 && (
        <p className="mb-3 text-sm text-foreground/80">
          No bookable dates in the next few months for this session type. Try another type, or email
          reception@rebaserecovery.com.
        </p>
      )}
      {!isLoading && availableKeys.size > 0 && (
        <p className="mb-3 text-xs text-foreground/70">
          Highlighted days have availability — tap one to continue.
        </p>
      )}
      <Calendar
        key={calendarKey}
        mode="single"
        selected={selectedDate}
        onSelect={onSelect}
        defaultMonth={defaultMonth}
        fromDate={today}
        toDate={toDate}
        disabled={(date) => {
          const isAfterRange = toDate ? date > toDate : false;
          if (isAfterRange || date < today) return true;
          // Block picks until we know which days are open (avoids selecting a dead day while loading).
          if (!availabilityLoaded) return true;
          return !isDateAvailable(date);
        }}
        className={cn('w-full min-w-0 max-w-full p-0 pointer-events-auto')}
        classNames={{
          caption_label: 'text-sm font-medium text-foreground sm:text-base',
          head_cell:
            'flex h-8 items-center justify-center text-[0.7rem] font-normal text-foreground/60 sm:h-9 sm:text-[0.8rem]',
          day: cn(
            buttonVariants({ variant: 'ghost' }),
            'h-full w-full max-h-full min-h-0 touch-manipulation rounded-md p-0 text-sm font-normal text-foreground/90 aria-selected:opacity-100',
          ),
          day_outside: 'day-outside text-foreground/45 opacity-80 aria-selected:opacity-100',
          day_disabled: 'text-foreground/25 opacity-40',
          day_selected:
            'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        }}
        modifiers={{
          available: (date) => date >= today && isDateAvailable(date),
          unavailable: (date) =>
            availabilityLoaded && date >= today && !isDateAvailable(date),
        }}
        modifiersClassNames={{
          available:
            'font-semibold text-white bg-white/20 hover:bg-white/30 ring-1 ring-inset ring-white/35 opacity-100 aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:ring-0',
          unavailable: 'text-foreground/25 opacity-40 cursor-not-allowed',
        }}
      />
    </div>
  );
};

export default BookingCalendar;
