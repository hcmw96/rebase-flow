import { formatMindbodyTime } from '../../lib/sessionTimes';
import { AvailableItem } from '../api/client';

interface TimeSlotPickerProps {
  slots: AvailableItem[];
  selectedSlot: AvailableItem | null;
  onSelect: (slot: AvailableItem) => void;
  isLoading?: boolean;
}

export function TimeSlotPicker({ slots, selectedSlot, onSelect, isLoading }: TimeSlotPickerProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-12 bg-[hsl(25,10%,15%)] rounded-xl animate-pulse" />
        <div className="h-4 w-36 bg-[hsl(25,10%,15%)] rounded animate-pulse" />
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[hsl(35,8%,55%)]">No available times for this date.</p>
        <p className="text-sm text-[hsl(35,8%,45%)] mt-1">Please try another date.</p>
      </div>
    );
  }

  const sorted = [...slots].sort(
    (a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime(),
  );

  const staffNames = new Set(sorted.map((s) => s.staffName?.trim()).filter(Boolean));
  const showStaff = staffNames.size > 1;

  return (
    <div className="space-y-2">
      <p className="text-sm text-[hsl(35,8%,55%)]">
        {sorted.length} start time{sorted.length === 1 ? '' : 's'} available
      </p>
      <select
        aria-label="Choose a start time"
        className="w-full h-12 rounded-xl bg-[hsl(25,10%,15%)] text-[hsl(35,15%,88%)] border border-[hsl(25,10%,20%)] px-4 text-base appearance-none"
        value={selectedSlot?.id ?? ''}
        onChange={(event) => {
          const match = sorted.find((slot) => slot.id === event.target.value);
          if (match) onSelect(match);
        }}
      >
        <option value="" disabled>
          Choose a start time
        </option>
        {sorted.map((slot) => {
          const time = formatMindbodyTime(slot.startDateTime);
          const label =
            showStaff && slot.staffName ? `${time} · ${slot.staffName}` : time;
          return (
            <option key={slot.id} value={slot.id}>
              {label}
            </option>
          );
        })}
      </select>
    </div>
  );
}
