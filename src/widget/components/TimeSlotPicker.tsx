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
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-16 bg-[hsl(25,10%,15%)] rounded-xl animate-pulse"
          />
        ))}
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

  const slotsByStaff = slots.reduce((acc, slot) => {
    const staffKey = slot.staffName || 'Any Available';
    if (!acc[staffKey]) {
      acc[staffKey] = [];
    }
    acc[staffKey].push(slot);
    return acc;
  }, {} as Record<string, AvailableItem[]>);

  return (
    <div className="space-y-4">
      {Object.entries(slotsByStaff).map(([staffName, staffSlots]) => (
        <div key={staffName}>
          <h4 className="text-sm font-medium text-[hsl(35,8%,55%)] mb-2">{staffName}</h4>
          <div className="grid grid-cols-3 gap-2">
            {staffSlots.map((slot) => {
              const isSelected = selectedSlot?.id === slot.id;
              const time = formatMindbodyTime(slot.startDateTime);

              return (
                <button
                  key={slot.id}
                  onClick={() => onSelect(slot)}
                  className={`
                    py-3 px-4 rounded-xl text-sm font-medium transition-all
                    ${isSelected
                      ? 'bg-[hsl(35,15%,75%)] text-[hsl(25,8%,8%)]'
                      : 'bg-[hsl(25,10%,15%)] text-[hsl(35,15%,88%)] hover:bg-[hsl(25,12%,18%)] border border-[hsl(25,10%,20%)]'}
                  `}
                >
                  {time}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
