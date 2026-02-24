import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ServiceVariant } from '@/components/ServiceCard';
import { BookingServiceData } from '@/components/booking/BookingDrawer';

interface ServiceChipProps {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  variants: ServiceVariant[];
  fillWidth?: boolean;
  hideImage?: boolean;
  listMode?: boolean;
  onSelectService?: (service: BookingServiceData) => void;
}

const ServiceChip = ({
  id,
  title,
  description,
  category,
  image,
  variants,
  fillWidth = false,
  hideImage = false,
  listMode = false,
  onSelectService,
}: ServiceChipProps) => {
  const handleClick = () => {
    onSelectService?.({
      title,
      description,
      category,
      image,
      variants,
    });
  };

  // Get price for display
  const getPrice = () => {
    const prices = variants.map(v => v.price).filter((p): p is number => p !== null && p > 0);
    if (prices.length === 0) return null;
    return Math.min(...prices);
  };

  // Get min duration
  const getDuration = () => {
    const durations = variants.map(v => v.duration).filter((d): d is number => d !== null);
    if (durations.length === 0) return null;
    return Math.min(...durations);
  };

  const price = getPrice();
  const duration = getDuration();
  const hasMultipleVariants = variants.length > 1;

  // List mode: full-width horizontal row
  if (listMode) {
    return (
      <button
        onClick={handleClick}
        className="w-full flex items-center justify-between px-4 py-3 bg-black/[0.03] rounded-lg border border-black/[0.05] hover:bg-black/[0.06] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px]"
      >
        <div className="flex flex-col items-start gap-0.5 min-w-0 flex-1 mr-3">
          <span className="text-sm font-medium text-black/70 text-left">{title}</span>
          {hasMultipleVariants && (
            <span className="text-[11px] text-black/35">{variants.length} options</span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {duration && (
            <span className="text-xs text-black/40 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {duration} min
            </span>
          )}
          {price && (
            <span className="text-sm font-semibold text-black/70">
              {hasMultipleVariants ? 'from ' : ''}£{price}
            </span>
          )}
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'text-left group',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl',
        fillWidth ? 'w-full' : 'w-[100px] flex-shrink-0'
      )}
    >
      {/* Thumbnail */}
      {!hideImage && (
        <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          {/* Price badge */}
          {price && (
            <div className="absolute bottom-1.5 right-1.5 bg-background/90 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
              <span className="text-xs font-semibold text-foreground">£{price}</span>
            </div>
          )}
        </div>
      )}
      {hideImage && price && (
        <div className="mt-1">
          <span className="text-xs font-semibold text-foreground/70">from £{price}</span>
        </div>
      )}
      
      {/* Title */}
      <p className="text-xs font-medium text-black/70 mt-2 line-clamp-2 leading-tight">
        {title}
      </p>
      
      {/* Duration */}
      {duration && (
        <p className="text-[10px] text-black/40 mt-0.5 flex items-center gap-0.5">
          <Clock className="h-2.5 w-2.5" />
          {duration} min
        </p>
      )}
    </button>
  );
};

export default ServiceChip;
