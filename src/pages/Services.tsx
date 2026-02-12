import { useState, useMemo } from 'react';
import ServiceChip from '@/components/ServiceChip';
import CategorySection from '@/components/CategorySection';
import { useMindbodyServices } from '@/hooks/useMindbodyServices';
import { useHiddenServices } from '@/hooks/useHiddenServices';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ServiceVariant } from '@/components/ServiceCard';

// Fallback images for services without images
const categoryImages: Record<string, string> = {
  'Recovery': '/images/rebase-hbot-new.png',
  'Wellness': '/images/rebase-ice-sauna.webp',
  'Classes': '/images/rebase-class.webp',
  'Private': '/images/rebase-private-suites.webp',
  'default': '/images/rebase-suite.webp',
};

const serviceImages: Record<string, string> = {
  'Cryotherapy': '/images/rebase-cryo.webp',
  'Infrared Sauna & Ice Bath': '/images/rebase-ice-sauna-new.webp',
};

function extractDurationFromName(name: string): { baseName: string; duration: number | null } {
  const durationMatch = name.match(/\((\d+)\s*(?:mins?|minutes?)\)/i);
  if (durationMatch) {
    const duration = parseInt(durationMatch[1], 10);
    const baseName = name.replace(durationMatch[0], '').trim();
    return { baseName, duration };
  }
  return { baseName: name, duration: null };
}

const serviceGroupMappings: Array<{ pattern: RegExp; groupName: string }> = [
  { pattern: /^skin\s*rejuv(enation)?/i, groupName: 'Skin Rejuvenation' },
  { pattern: /^skin\s*peels?/i, groupName: 'Skin Peel' },
  { pattern: /^bio\s*stim(ulation)?/i, groupName: 'BioStimulation' },
  { pattern: /^deep\s*tissue\s*massage/i, groupName: 'Massage' },
  { pattern: /^sports\s*massage/i, groupName: 'Massage' },
  { pattern: /massage/i, groupName: 'Massage' },
  { pattern: /cryo(therapy)?/i, groupName: 'Cryotherapy' },
  { pattern: /^hyperbaric\s*oxygen/i, groupName: 'Hyperbaric Oxygen' },
  { pattern: /^infrared\s*sauna/i, groupName: 'Infrared Sauna & Ice Bath' },
  { pattern: /^premium\s*suite/i, groupName: 'Premium Suite' },
  { pattern: /^structural\s*fascia/i, groupName: 'Structural Fascia Therapy' },
  { pattern: /^holistic\s*face\s*sculpt/i, groupName: 'Holistic Face Sculpting' },
  { pattern: /^divine\s*facial/i, groupName: 'Divine Facial Healing' },
  { pattern: /^osteopathy/i, groupName: 'Osteopathy' },
  { pattern: /^(oxygen-?)?ozone/i, groupName: 'Ozone Therapy' },
  { pattern: /minute\s*classes$/i, groupName: 'Classes' },
  { pattern: /^all\s*classes$/i, groupName: 'Classes' },
];

// Service groups to hide from the UI
const hiddenGroupNames = new Set([
  'Rebase Packages',
  'Corporate Credits',
  'Classes',
]);

function canonicalizeServiceName(baseName: string): string {
  for (const { pattern, groupName } of serviceGroupMappings) {
    if (pattern.test(baseName)) return groupName;
  }
  return baseName;
}

interface GroupedService {
  baseName: string;
  description: string;
  category: string;
  image: string;
  variants: ServiceVariant[];
}

interface ServicesProps {
  onSelectService?: (service: import('@/components/booking/BookingDrawer').BookingServiceData) => void;
}

const Services = ({ onSelectService }: ServicesProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: services, isLoading, error } = useMindbodyServices();
  const { data: hiddenServices = [] } = useHiddenServices();

  const hiddenServiceIds = useMemo(() => new Set(hiddenServices.map(h => h.service_id)), [hiddenServices]);

  const { groupedServices } = useMemo(() => {
    if (!services || services.length === 0) return { groupedServices: [] };

    const visibleServices = services.filter(s => !hiddenServiceIds.has(s.id));
    const groups = new Map<string, GroupedService>();

    for (const service of visibleServices) {
      const { baseName, duration } = extractDurationFromName(service.name);
      const canonicalName = canonicalizeServiceName(baseName);
      const rawCategory = service.programName || service.category || 'Wellness';
      const category = rawCategory.startsWith('Sauna Suite') ? 'Sauna' : rawCategory;
      const image = serviceImages[canonicalName] || categoryImages[service.programName] || categoryImages[service.category] || categoryImages['default'];

      // Skip hidden groups
      if (hiddenGroupNames.has(canonicalName)) continue;

      if (!groups.has(canonicalName)) {
        groups.set(canonicalName, {
          baseName: canonicalName,
          description: service.onlineDescription || service.description || 'Experience our premium wellness service.',
          category,
          image,
          variants: [],
        });
      }

      groups.get(canonicalName)!.variants.push({
        id: service.id,
        duration: duration ?? service.defaultTimeLength,
        price: service.price,
        name: service.name,
      });
    }

    for (const group of groups.values()) {
      group.variants.sort((a, b) => (a.duration ?? 0) - (b.duration ?? 0));
    }

    const grouped = Array.from(groups.values());
    const serviceOrder: Record<string, number> = {
      'Infrared Sauna & Ice Bath': 0,
      'Premium Suite': 1,
      'Cryotherapy': 2,
    };
    grouped.sort((a, b) => {
      const orderA = serviceOrder[a.baseName] ?? 999;
      const orderB = serviceOrder[b.baseName] ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.baseName.localeCompare(b.baseName);
    });

    return { groupedServices: grouped };
  }, [services, hiddenServiceIds]);

  const servicesByCategory = useMemo(() => {
    const categoryMap = new Map<string, GroupedService[]>();
    let filtered = groupedServices;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(service =>
        service.baseName.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query)
      );
    }
    for (const service of filtered) {
      const cat = service.category;
      if (!categoryMap.has(cat)) categoryMap.set(cat, []);
      categoryMap.get(cat)!.push(service);
    }
    return categoryMap;
  }, [groupedServices, searchQuery]);

  return (
    <div className="min-h-full">
      {/* Search bar */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-white/10 px-4 py-3">
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
          <Input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full pl-10 text-sm text-white placeholder:text-white/40 bg-white/[0.06] border-white/10 rounded-md focus-visible:ring-white/20"
          />
        </div>
      </div>

      {/* Services */}
      <div className="px-4 py-4 max-w-lg mx-auto">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-6 w-24" />
                <div className="flex gap-3">
                  <Skeleton className="h-[100px] w-[100px] rounded-xl" />
                  <Skeleton className="h-[100px] w-[100px] rounded-xl" />
                  <Skeleton className="h-[100px] w-[100px] rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Unable to load services.</p>
          </div>
        ) : servicesByCategory.size === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery.trim() ? 'No services match your search.' : 'No services available.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from(servicesByCategory.entries()).map(([category, categoryServices], index) => (
              <CategorySection
                key={category}
                category={category}
                services={categoryServices}
                defaultExpanded={index < 3}
                onSelectService={onSelectService}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Services;
