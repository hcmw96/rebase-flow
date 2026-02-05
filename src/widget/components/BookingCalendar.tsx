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
    <div className="bg-[hsl(25,12%,12%)]/50 border border-[hsl(25,10%,20%)] rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
          className="p-2 rounded-lg hover:bg-[hsl(25,10%,15%)] transition-colors text-[hsl(35,15%,88%)]"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h3 className="text-lg font-medium text-[hsl(35,15%,88%)]">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button
          onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
          className="p-2 rounded-lg hover:bg-[hsl(25,10%,15%)] transition-colors text-[hsl(35,15%,88%)]"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-[hsl(35,8%,55%)] py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const isPast = isBefore(day, today);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          const isAvailable = isDateAvailable(day) && !isPast;

          return (
            <button
              key={day.toISOString()}
              onClick={() => isAvailable && onSelect(day)}
              disabled={!isAvailable}
              className={`
                aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all
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
