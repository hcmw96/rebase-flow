import { useMemo } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AvailableItem } from '@/hooks/useMindbodyServices';
import { formatMindbodyTime, isUpcomingSession } from '@/lib/sessionTimes';
import { resolveDisplayName } from '@/config/serviceConfig';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TimeSlotPickerProps {
  slots: AvailableItem[];
  selectedSlot: AvailableItem | null;
  onSelect: (slot: AvailableItem) => void;
  isLoading?: boolean;
  className?: string;
}

function slotLabel(slot: AvailableItem, showStaff: boolean): string {
  const time = formatMindbodyTime(slot.startDateTime);
  if (!showStaff || !slot.staffName) return time;
  return `${time} · ${resolveDisplayName(slot.staffName)}`;
}

const TimeSlotPicker = ({
  slots,
  selectedSlot,
  onSelect,
  isLoading,
  className,
}: TimeSlotPickerProps) => {
  const upcomingSlots = useMemo(
    () =>
      slots
        .filter((slot) => isUpcomingSession(slot.startDateTime))
        .sort(
          (a, b) =>
            new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime(),
        ),
    [slots],
  );

  const showStaffInLabel = useMemo(() => {
    const staffNames = new Set(
      upcomingSlots.map((s) => s.staffName?.trim()).filter(Boolean),
    );
    return staffNames.size > 1;
  }, [upcomingSlots]);

  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="h-11 rounded-lg bg-secondary/50 animate-pulse" />
        <div className="h-4 w-40 rounded bg-secondary/40 animate-pulse" />
      </div>
    );
  }

  if (upcomingSlots.length === 0) {
    return (
      <div className={cn('text-center py-8 space-y-3', className)}>
        <p className="text-muted-foreground">No available time slots for this date.</p>
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

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4 shrink-0" />
        <span>
          {upcomingSlots.length} start time{upcomingSlots.length === 1 ? '' : 's'} available
        </span>
      </div>

      <Select
        value={selectedSlot?.id ?? undefined}
        onValueChange={(id) => {
          const match = upcomingSlots.find((slot) => slot.id === id);
          if (match) onSelect(match);
        }}
      >
        <SelectTrigger
          className="h-12 min-h-12 w-full text-base"
          aria-label="Choose a start time"
        >
          <SelectValue placeholder="Choose a start time" />
        </SelectTrigger>
        <SelectContent className="max-h-[min(22rem,60dvh)]">
          {upcomingSlots.map((slot) => (
            <SelectItem key={slot.id} value={slot.id} className="py-3 text-base">
              {slotLabel(slot, showStaffInLabel)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!showStaffInLabel && upcomingSlots[0]?.staffName && (
        <p className="text-xs text-muted-foreground">
          With {resolveDisplayName(upcomingSlots[0].staffName)}
          {upcomingSlots[0].locationName
            ? ` · ${upcomingSlots[0].locationName}`
            : ''}
        </p>
      )}
    </div>
  );
};

export default TimeSlotPicker;
