import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ServiceVariant } from '@/components/ServiceCard';
import { priceOverrides } from '@/config/serviceConfig';

interface FeaturedServiceData {
  id: string;
  service_id: string;
  service_name: string | null;
  label: string | null;
}

interface ServiceInfo {
  baseName: string;
  description: string;
  category: string;
  image: string;
  variants: ServiceVariant[];
}

interface FeaturedServicesProps {
  featuredServices: FeaturedServiceData[];
  servicesMap: Map<string, ServiceInfo>;
}

const FeaturedServices = ({ featuredServices, servicesMap }: FeaturedServicesProps) => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [featuredServices]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleBook = (service: ServiceInfo) => {
    const variant = service.variants[0];
    localStorage.setItem('selectedService', JSON.stringify({
      id: variant.id,
      title: variant.name,
      description: service.description,
      duration: variant.duration ? `${variant.duration} min` : null,
      price: variant.price ? `£${variant.price.toFixed(2)}` : 'Contact for pricing',
      category: service.category,
      image: service.image,
    }));
    navigate(`/book/${variant.id}`);
  };

  const formatPrice = (price: number | null, baseName?: string) => {
    if (price !== null && price > 0) return `£${price.toFixed(0)}`;
    if (baseName && priceOverrides[baseName] !== undefined) return `£${priceOverrides[baseName]}`;
    return 'Contact';
  };

  // Filter to only show services that exist in the services map
  const validFeatured = featuredServices.filter(f => {
    // Check if any variant ID matches
    for (const [_, serviceInfo] of servicesMap) {
      if (serviceInfo.variants.some(v => v.id === f.service_id)) {
        return true;
      }
    }
    return false;
  });

  if (validFeatured.length === 0) {
    return null;
  }

  // Get service info for each featured service
  const getFeaturedServiceInfo = (featured: FeaturedServiceData): ServiceInfo | null => {
    for (const [_, serviceInfo] of servicesMap) {
      if (serviceInfo.variants.some(v => v.id === featured.service_id)) {
        return serviceInfo;
      }
    }
    return null;
  };

  return (
    <section className="py-6">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-5 w-5 text-gold fill-gold" />
          <h2 className="text-lg font-semibold text-foreground">Most Popular</h2>
        </div>

        <div className="relative">
          {/* Left scroll button */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-background/90 rounded-full shadow-md border border-border -ml-4"
            >
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </button>
          )}

          {/* Scrollable cards */}
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {validFeatured.map((featured, index) => {
              const service = getFeaturedServiceInfo(featured);
              if (!service) return null;

              const variant = service.variants[0];

              return (
                <motion.div
                  key={featured.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleBook(service)}
                  className="flex-shrink-0 w-40 cursor-pointer group"
                >
                  <div className="relative rounded-xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all">
                    {/* Image */}
                    <div className="relative h-28 overflow-hidden">
                      <img
                        src={service.image}
                        alt={service.baseName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {featured.label && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-gold text-background text-xs font-medium rounded-full">
                          {featured.label}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3">
                      <h3 className="font-medium text-foreground text-sm line-clamp-1">
                        {service.baseName}
                      </h3>
                      <div className="flex items-center justify-between mt-1">
                        {variant.duration && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {variant.duration}m
                          </span>
                        )}
                        <span className="text-sm font-semibold text-foreground">
                          {formatPrice(variant.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Right scroll button */}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-background/90 rounded-full shadow-md border border-border -mr-4"
            >
              <ChevronRight className="h-4 w-4 text-foreground" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedServices;
