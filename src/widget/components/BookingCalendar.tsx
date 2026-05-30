import { useState, useMemo } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';

interface BookingCalendarProps {
  selectedDate: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  availableDates?: Date[];
}

export function BookingCalendar({ selectedDate, onSelect, availableDates }: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const today = startOfDay(new Date());

  // Check if a date is available
  const isDateAvailable = (date: Date) => {
    if (!availableDates || availableDates.length === 0) return true;
    return availableDates.some(d => isSameDay(d, date));
  };

  // Get days to display
  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start, end });

    // Pad with empty days at the start for proper alignment (Sunday start)
    const startDay = start.getDay();
    const paddedDays: (Date | null)[] = Array(startDay).fill(null);
    
    return [...paddedDays, ...daysInMonth];
  }, [currentMonth]);

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-[hsl(25,10%,20%)] bg-[hsl(25,12%,12%)]/50 p-3 sm:p-4">
      {/* Header */}
      <div className="mb-3 flex w-full min-w-0 items-center justify-between gap-2 sm:mb-4">
        <button
          type="button"
          onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
          className="touch-manipulation rounded-lg p-2.5 text-[hsl(35,15%,88%)] transition-colors hover:bg-[hsl(25,10%,15%)] sm:p-2"
          aria-label="Previous month"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h3 className="truncate text-base font-medium text-[hsl(35,15%,88%)] sm:text-lg">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button
          type="button"
          onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
          className="touch-manipulation rounded-lg p-2.5 text-[hsl(35,15%,88%)] transition-colors hover:bg-[hsl(25,10%,15%)] sm:p-2"
          aria-label="Next month"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Week day headers */}
      <div className="mb-1 grid w-full min-w-0 grid-cols-7 gap-0.5 sm:mb-2 sm:gap-1">
        {weekDays.map(day => (
          <div
            key={day}
            className="flex h-8 items-center justify-center text-center text-[0.7rem] font-medium text-[hsl(35,8%,55%)] sm:h-9 sm:text-xs"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid w-full min-w-0 grid-cols-7 gap-0.5 sm:gap-1">
        {days.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square w-full min-w-0" />;
          }

          const isPast = isBefore(day, today);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          const isAvailable = isDateAvailable(day) && !isPast;

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => isAvailable && onSelect(day)}
              disabled={!isAvailable}
              className={`
                flex aspect-square w-full min-w-0 touch-manipulation items-center justify-center rounded-lg text-sm font-medium transition-all
                ${isSelected 
                  ? 'bg-[hsl(35,15%,75%)] text-[hsl(25,8%,8%)]' 
                  : isTodayDate 
                    ? 'bg-[hsl(25,10%,15%)] text-[hsl(35,15%,88%)]'
                    : ''}
                ${!isAvailable 
                  ? 'text-[hsl(35,8%,35%)] cursor-not-allowed' 
                  : 'text-[hsl(35,15%,88%)] hover:bg-[hsl(25,10%,15%)] cursor-pointer'}
                ${!isCurrentMonth ? 'opacity-50' : ''}
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
