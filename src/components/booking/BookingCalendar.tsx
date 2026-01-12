import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface BookingCalendarProps {
  selectedDate: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  availableDates?: Date[];
  className?: string;
}

const BookingCalendar = ({
  selectedDate,
  onSelect,
  availableDates,
  className,
}: BookingCalendarProps) => {
  // Disable dates in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if a date is available (if availableDates is provided)
  const isDateAvailable = (date: Date) => {
    if (!availableDates || availableDates.length === 0) return true;
    return availableDates.some(
      (d) => d.toDateString() === date.toDateString()
    );
  };

  return (
    <div className={cn("glass-card rounded-xl p-4", className)}>
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onSelect}
        disabled={(date) => {
          const isPast = date < today;
          const isNotAvailable = availableDates && !isDateAvailable(date);
          return isPast || !!isNotAvailable;
        }}
        className={cn("p-3 pointer-events-auto")}
        modifiers={{
          available: (date) => isDateAvailable(date) && date >= today,
        }}
        modifiersStyles={{
          available: {
            fontWeight: 'bold',
          },
        }}
      />
    </div>
  );
};

export default BookingCalendar;
