import { useNavigate } from 'react-router-dom';
import { Clock, ChevronRight, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ServiceVariant } from '@/components/ServiceCard';

interface ServiceCardCompactProps {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  variants: ServiceVariant[];
  isHidden?: boolean;
  isFeatured?: boolean;
  onToggleFeatured?: () => void;
  isEditMode?: boolean;
}

const ServiceCardCompact = ({
  id,
  title,
  description,
  category,
  image,
  variants,
  isHidden = false,
  isFeatured = false,
  onToggleFeatured,
  isEditMode = false,
}: ServiceCardCompactProps) => {
  const navigate = useNavigate();

  const handleBook = () => {
    // Store all variants so user can select on booking page
    localStorage.setItem('selectedService', JSON.stringify({
      id: variants[0].id,
      title,
      description,
      category,
      image,
      variants, // Pass all variants for selection on next page
    }));
    navigate(`/book/${variants[0].id}`);
  };

  // Get price range for display
  const priceRange = () => {
    const prices = variants.map(v => v.price).filter((p): p is number => p !== null && p > 0);
    if (prices.length === 0) return 'Contact';
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return `£${min}`;
    return `From £${min}`;
  };

  // Get duration range
  const durationRange = () => {
    const durations = variants.map(v => v.duration).filter((d): d is number => d !== null);
    if (durations.length === 0) return null;
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    if (min === max) return `${min} min`;
    return `${min}-${max} min`;
  };

  // Show variant count if multiple
  const variantCount = variants.length > 1 ? `${variants.length} options` : null;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl bg-card border border-border transition-all',
        'hover:bg-card/80 hover:border-border/80',
        isHidden && 'opacity-50'
      )}
    >
      {/* Thumbnail */}
      <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />
        {isFeatured && (
          <div className="absolute top-0.5 right-0.5 w-5 h-5 bg-gold rounded-full flex items-center justify-center">
            <Star className="w-3 h-3 text-background fill-current" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground truncate">{title}</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {durationRange() && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {durationRange()}
            </span>
          )}
          <span className="font-medium text-foreground">{priceRange()}</span>
        </div>
        <span className="text-xs text-muted-foreground min-h-[1rem]">
          {variantCount || '\u00A0'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {isEditMode && onToggleFeatured && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFeatured();
            }}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center transition-all',
              isFeatured
                ? 'bg-gold text-background'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            )}
          >
            <Star className={cn('w-4 h-4', isFeatured && 'fill-current')} />
          </button>
        )}

        {!isEditMode && (
          <button
            onClick={handleBook}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ServiceCardCompact;
