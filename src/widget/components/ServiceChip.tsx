import { GroupedService } from '../context/WidgetContext';

interface ServiceChipProps {
  service: GroupedService;
  onSelect: (service: GroupedService) => void;
}

export function ServiceChip({ service, onSelect }: ServiceChipProps) {
  // Get price for display
  const getPrice = () => {
    const prices = service.variants.map(v => v.price).filter((p): p is number => p !== null && p > 0);
    if (prices.length === 0) return null;
    return Math.min(...prices);
  };

  // Get min duration
  const getDuration = () => {
    const durations = service.variants.map(v => v.duration).filter((d): d is number => d !== null);
    if (durations.length === 0) return null;
    return Math.min(...durations);
  };

  const price = getPrice();
  const duration = getDuration();

  return (
    <button
      onClick={() => onSelect(service)}
      className="w-[100px] flex-shrink-0 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(35,15%,75%)] rounded-xl"
    >
      {/* Thumbnail */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-[hsl(25,12%,15%)]">
        <img
          src={service.image}
          alt={service.baseName}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
      </div>
      
      {/* Title */}
      <p className="text-xs font-medium text-[hsl(35,15%,88%)] mt-2 line-clamp-2 leading-tight">
        {service.baseName}
      </p>
      
      {/* Duration */}
      {duration && (
        <p className="text-[10px] text-[hsl(35,8%,55%)] mt-0.5 flex items-center gap-0.5">
          <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {duration} min
        </p>
      )}
    </button>
  );
}
