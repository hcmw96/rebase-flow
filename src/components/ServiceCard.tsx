import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { serviceImagePositions } from '@/config/serviceConfig';

export interface ServiceVariant {
  id: string;
  duration: number | null;
  price: number | null;
  name: string;
  contactOnly?: boolean;
}

interface ServiceCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  variants: ServiceVariant[];
}

// Strip HTML tags from description
const stripHtml = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

const ServiceCard = ({
  id,
  title,
  description,
  category,
  image,
  variants,
}: ServiceCardProps) => {
  const navigate = useNavigate();
  const [selectedVariant, setSelectedVariant] = useState<ServiceVariant>(variants[0]);
  const [isExpanded, setIsExpanded] = useState(false);

  const cleanDescription = stripHtml(description);
  const isLongDescription = cleanDescription.length > 100;

  const handleBookNow = () => {
    // Store service data for the booking page
    localStorage.setItem('selectedService', JSON.stringify({
      id: selectedVariant.id,
      title: selectedVariant.name,
      description: cleanDescription,
      duration: selectedVariant.duration ? `${selectedVariant.duration} min` : null,
      price: selectedVariant.price ? `£${selectedVariant.price.toFixed(2)}` : 'Contact for pricing',
      category,
      image,
    }));
    navigate(`/book/${selectedVariant.id}`);
  };

  const formatPrice = (price: number | null) => {
    if (price === null || price === 0) return 'Contact';
    return `£${price.toFixed(0)}`;
  };

  // Get lowest price for "From £X" display
  const getFromPrice = () => {
    const prices = variants.map(v => v.price).filter((p): p is number => p !== null && p > 0);
    if (prices.length === 0) return null;
    const min = Math.min(...prices);
    return min;
  };

  const fromPrice = getFromPrice();
  const hasMultipleVariants = variants.length > 1;

  return (
    <Card 
      className="overflow-hidden group hover:shadow-lg transition-shadow duration-300 cursor-pointer"
      onClick={handleBookNow}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          style={{ objectPosition: serviceImagePositions[title] || 'center' }}
        />
        <Badge className="absolute top-4 left-4 bg-background/90 text-foreground">
          {category}
        </Badge>
      </div>
      
      <CardContent className="p-6 space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {title}
          </h3>
          <div className="relative">
            <p className={`text-muted-foreground text-sm ${!isExpanded && isLongDescription ? 'line-clamp-2' : ''}`}>
              {cleanDescription}
            </p>
            {isLongDescription && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-1 transition-colors"
              >
                {isExpanded ? (
                  <>Show less <ChevronUp className="h-3 w-3" /></>
                ) : (
                  <>Read more <ChevronDown className="h-3 w-3" /></>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Price & Options Summary */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-foreground">
            {fromPrice !== null ? `From £${fromPrice}` : 'Contact for pricing'}
          </span>
          {hasMultipleVariants && (
            <span className="text-sm text-muted-foreground">
              {variants.length} options
            </span>
          )}
        </div>

        {/* Single variant info */}
        {!hasMultipleVariants && selectedVariant.duration && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {selectedVariant.duration} min
          </div>
        )}
        
        <div className="pt-2">
          <Button size="sm" className="w-full">
            Book Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceCard;
