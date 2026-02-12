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
  onSelectService?: (service: BookingServiceData) => void;
}

const ServiceChip = ({
  id,
  title,
  description,
  category,
  image,
  variants,
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

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-[100px] flex-shrink-0 text-left group',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl'
      )}
    >
      {/* Thumbnail */}
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
