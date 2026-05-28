import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface BookingCalendarProps {
  selectedDate: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  availableDates?: Date[];
  isLoading?: boolean;
  className?: string;
}

const BookingCalendar = ({
  selectedDate,
  onSelect,
  availableDates,
  isLoading,
  className,
}: BookingCalendarProps) => {
  // Disable dates in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const availabilityLoaded = !isLoading;

  const isDateAvailable = (date: Date) => {
    if (!availabilityLoaded) return true;
    if (!availableDates?.length) return false;
    return availableDates.some((d) => d.toDateString() === date.toDateString());
  };

  return (
    <div className={cn("glass-card rounded-xl p-4 relative", className)}>
      {isLoading && (
        <div className="absolute top-3 right-3 z-10">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onSelect}
        disabled={(date) => {
          const isPast = date < today;
          if (!availabilityLoaded) return isPast;
          return isPast || !isDateAvailable(date);
        }}
        className={cn("p-3 pointer-events-auto")}
        modifiers={{
          available: (date) => date >= today && isDateAvailable(date),
          unavailable: (date) =>
            availabilityLoaded && date >= today && !isDateAvailable(date),
        }}
        modifiersClassNames={{
          available: 'font-semibold',
          unavailable:
            'text-muted-foreground/40 line-through opacity-60 cursor-not-allowed',
        }}
      />
    </div>
  );
};

export default BookingCalendar;
