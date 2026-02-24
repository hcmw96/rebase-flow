import { GroupedService } from '../context/WidgetContext';

interface ServiceChipProps {
  service: GroupedService;
  hideImage?: boolean;
  listMode?: boolean;
  onSelect: (service: GroupedService) => void;
}

export function ServiceChip({ service, hideImage = false, listMode = false, onSelect }: ServiceChipProps) {
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
  const hasMultipleVariants = service.variants.length > 1;

  // List mode: full-width horizontal row
  if (listMode) {
    return (
      <button
        onClick={() => onSelect(service)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[hsl(25,10%,15%)]/30 rounded-lg border border-[hsl(25,10%,20%)]/40 hover:bg-[hsl(25,10%,15%)]/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(35,15%,75%)] min-h-[44px]"
      >
        <div className="flex flex-col items-start gap-0.5 min-w-0 flex-1 mr-3">
          <span className="text-sm font-medium text-[hsl(35,15%,88%)] text-left">{service.baseName}</span>
          {hasMultipleVariants && (
            <span className="text-[11px] text-[hsl(35,8%,45%)]">{service.variants.length} options</span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {duration && (
            <span className="text-xs text-[hsl(35,8%,55%)] flex items-center gap-1">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {duration} min
            </span>
          )}
          {price && (
            <span className="text-sm font-semibold text-[hsl(35,15%,75%)]">
              {hasMultipleVariants ? 'from ' : ''}£{price}
            </span>
          )}
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => onSelect(service)}
      className="w-[100px] flex-shrink-0 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(35,15%,75%)] rounded-xl"
    >
      {/* Thumbnail */}
      {!hideImage && (
        <div className="relative aspect-square rounded-xl overflow-hidden bg-[hsl(25,12%,15%)]">
          <img
            src={service.image}
            alt={service.baseName}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        </div>
      )}
      {hideImage && price && (
        <div className="mt-1">
          <span className="text-xs font-semibold text-[hsl(35,8%,55%)]">from £{price}</span>
        </div>
      )}
      
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
