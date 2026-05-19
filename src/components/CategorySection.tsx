import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import ServiceChip from '@/components/ServiceChip';
import { ServiceVariant } from '@/components/ServiceCard';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { BookingServiceData } from '@/components/booking/BookingDrawer';

interface GroupedService {
  baseName: string;
  description: string;
  category: string;
  image: string;
  variants: ServiceVariant[];
}

interface CategorySectionProps {
  category: string;
  services: GroupedService[];
  defaultExpanded?: boolean;
  onSelectService?: (service: BookingServiceData) => void;
}

const techTherapies = new Set([
  'Infrared Sauna & Ice Bath',
  'Premium Suite',
  'Cryotherapy',
  'Hyperbaric Oxygen',
]);

const CategorySection = ({
  category,
  services,
  defaultExpanded = true,
  onSelectService,
}: CategorySectionProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Check if all services in this category are non-tech (no images)
  const isNonImageCategory = services.every(s => !techTherapies.has(s.baseName));

  if (services.length === 0) return null;

  return (
    <div className="border-b border-black/[0.08] last:border-b-0">
      {/* Category Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between py-3 px-1',
          'transition-colors rounded-lg -mx-1',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
        )}
      >
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-black/80">{category}</h2>
          <span className="text-xs text-black/40 bg-black/[0.06] px-1.5 py-0.5 rounded-full">
            {services.length}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </motion.div>
      </button>

      {/* Services Container */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {isNonImageCategory ? (
              <div className="flex flex-col gap-2 px-1 pb-4">
                {services.map((service) => (
                  <ServiceChip
                    key={service.baseName}
                    id={service.variants[0]?.id ?? service.baseName}
                    title={service.baseName}
                    description={service.description}
                    category={service.category}
                    image={service.image}
                    variants={service.variants}
                    listMode
                    onSelectService={onSelectService}
                  />
                ))}
              </div>
            ) : services.length <= 3 ? (
              <div className={cn(
                'grid gap-3 px-1 pb-4',
                services.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
              )}>
                {services.map((service) => (
                  <ServiceChip
                    key={service.baseName}
                    id={service.variants[0]?.id ?? service.baseName}
                    title={service.baseName}
                    description={service.description}
                    category={service.category}
                    image={service.image}
                    variants={service.variants}
                    fillWidth
                    hideImage={!techTherapies.has(service.baseName)}
                    onSelectService={onSelectService}
                  />
                ))}
              </div>
            ) : (
              <ScrollArea className="w-full pb-4">
                <div className="flex gap-3 px-1">
                  {services.map((service) => (
                    <ServiceChip
                      key={service.baseName}
                      id={service.variants[0]?.id ?? service.baseName}
                      title={service.baseName}
                      description={service.description}
                      category={service.category}
                      image={service.image}
                      variants={service.variants}
                      hideImage={!techTherapies.has(service.baseName)}
                      onSelectService={onSelectService}
                    />
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="mt-2" />
              </ScrollArea>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategorySection;
