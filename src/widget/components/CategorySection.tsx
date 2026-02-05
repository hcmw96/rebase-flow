import { useState } from 'react';
import { GroupedService } from '../context/WidgetContext';
import { ServiceChip } from './ServiceChip';

interface CategorySectionProps {
  category: string;
  services: GroupedService[];
  defaultExpanded?: boolean;
  onSelectService: (service: GroupedService) => void;
}

export function CategorySection({
  category,
  services,
  defaultExpanded = true,
  onSelectService,
}: CategorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (services.length === 0) return null;

  return (
    <div className="border-b border-[hsl(25,10%,20%)]/50 last:border-b-0">
      {/* Category Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-4 px-1 hover:bg-[hsl(25,10%,15%)]/30 transition-colors rounded-lg -mx-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(35,15%,75%)]"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-[hsl(35,15%,88%)]">{category}</h2>
          <span className="text-sm text-[hsl(35,8%,55%)] bg-[hsl(25,10%,15%)] px-2 py-0.5 rounded-full">
            {services.length}
          </span>
        </div>
        <div
          style={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <svg className="h-5 w-5 text-[hsl(35,8%,55%)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Services Container */}
      {isExpanded && (
        <div 
          className="overflow-hidden"
          style={{
            animation: 'slideDown 0.25s ease-out',
          }}
        >
          <div className="w-full pb-4 overflow-x-auto">
            <div className="flex gap-3 px-1">
              {services.map((service) => (
                <ServiceChip
                  key={service.baseName}
                  service={service}
                  onSelect={onSelectService}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
