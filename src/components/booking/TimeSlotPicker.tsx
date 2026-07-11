import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Clock, User } from 'lucide-react';
import { AvailableItem } from '@/hooks/useMindbodyServices';
import { formatMindbodyTime, isUpcomingSession } from '@/lib/sessionTimes';

interface TimeSlotPickerProps {
  slots: AvailableItem[];
  selectedSlot: AvailableItem | null;
  onSelect: (slot: AvailableItem) => void;
  isLoading?: boolean;
  className?: string;
}

const TimeSlotPicker = ({
  slots,
  selectedSlot,
  onSelect,
  isLoading,
  className,
}: TimeSlotPickerProps) => {
  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-lg bg-secondary/50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  const upcomingSlots = slots.filter((slot) => isUpcomingSession(slot.startDateTime));

  if (upcomingSlots.length === 0) {
    return (
      <div className={cn("text-center py-8 space-y-3", className)}>
        <p className="text-muted-foreground">
          No available time slots for this date.
        </p>
        <p className="text-sm text-muted-foreground">
          Try selecting a different date, or contact us if you need assistance booking.
        </p>
        <a
          href="mailto:reception@rebaserecovery.com"
          className="inline-block text-sm text-primary hover:underline"
        >
          Contact reception →
        </a>
      </div>
    );
  }

  // Group slots by time
  const groupedSlots = upcomingSlots.reduce((acc, slot) => {
    const time = formatMindbodyTime(slot.startDateTime, 'HH:mm');
    if (!acc[time]) {
      acc[time] = [];
    }
    acc[time].push(slot);
    return acc;
  }, {} as Record<string, AvailableItem[]>);

  return (
    <div className={cn("space-y-3", className)}>
      {Object.entries(groupedSlots).map(([time, timeSlots]) => (
        <div key={time} className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{time}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {timeSlots.map((slot) => {
              const isSelected = selectedSlot?.id === slot.id;
              return (
                <Button
                  key={slot.id}
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "h-auto py-3 px-4 justify-start",
                    isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                  onClick={() => onSelect(slot)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="text-left flex-1">
                      <div className="font-medium">
                        {formatMindbodyTime(slot.startDateTime)}
                      </div>
                      {slot.staffName && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <User className="h-3 w-3" />
                          {slot.staffName}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {slot.locationName}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TimeSlotPicker;
