import { useState, useMemo } from 'react';
import ServiceChip from '@/components/ServiceChip';
import CategorySection from '@/components/CategorySection';
import { useMindbodyServices } from '@/hooks/useMindbodyServices';
import { useHiddenServices } from '@/hooks/useHiddenServices';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ClassSchedule from '@/components/ClassSchedule';
import {
  serviceGroupMappings,
  hiddenGroupNames,
  hiddenProgramIds,
  isHiddenServiceName,
  categoryOverrides,
  programNameOverrides,
  categoryOrder,
  serviceOrderWithinCategory,
  serviceImages,
  categoryImages,
  contactOnlyGroups,
  priceOverrides,
  classDescriptionIdMap,
  extractDurationFromName,
  canonicalizeServiceName,
  resolveCategory,
  resolveImage,
  GroupedService,
  isPlaceholderDescription,
  resolveGroupDescription,
  resolveVariantDescription,
} from '@/config/serviceConfig';


interface ServicesProps {
  onSelectService?: (service: import('@/components/booking/BookingDrawer').BookingServiceData) => void;
}

const Services = ({ onSelectService }: ServicesProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('services');
  const { data: services, isLoading, error } = useMindbodyServices();
  const { data: hiddenServices = [] } = useHiddenServices();

  const hiddenServiceIds = useMemo(() => new Set(hiddenServices.map(h => h.service_id)), [hiddenServices]);

  const { groupedServices } = useMemo(() => {
    if (!services || services.length === 0) return { groupedServices: [] };

    const visibleServices = services.filter(s => !hiddenServiceIds.has(s.id));
    const groups = new Map<string, GroupedService>();

    for (const service of visibleServices) {
      if (hiddenProgramIds.has(service.programId)) continue;
      if (isHiddenServiceName(service.name)) continue;

      const { baseName, duration } = extractDurationFromName(service.name);
      const canonicalName = canonicalizeServiceName(baseName);
      const rawCategory = service.programName || service.category || 'Wellness';
      const category = resolveCategory(canonicalName, rawCategory);

      if (category === 'General') continue;
      if (hiddenGroupNames.has(canonicalName)) continue;

      const image = resolveImage(canonicalName, service.programName, service.category);
      const isContactOnly = contactOnlyGroups.has(canonicalName);

      if (!groups.has(canonicalName)) {
        groups.set(canonicalName, {
          baseName: canonicalName,
          description: service.onlineDescription || service.description || '',
          category, image, variants: [], contactOnly: isContactOnly,
        });
      } else {
        const existing = groups.get(canonicalName)!;
        const incoming = service.onlineDescription || service.description || '';
        if (isPlaceholderDescription(existing.description) && !isPlaceholderDescription(incoming)) {
          existing.description = incoming;
        }
      }

      const isIvFirstConsult = canonicalName === 'IV Drip' && /first\s*consult|initial/i.test(service.name);
      const variantDesc = resolveVariantDescription(
        service.name,
        canonicalName,
        service.onlineDescription || service.description,
      );
      groups.get(canonicalName)!.variants.push({
        id: service.id,
        duration: duration ?? service.defaultTimeLength,
        price: isIvFirstConsult ? 0 : (service.price ?? priceOverrides[canonicalName] ?? null),
        name: service.name,
        description: variantDesc,
        contactOnly: isIvFirstConsult || isContactOnly,
      });
    }

    for (const group of groups.values()) {
      group.description = resolveGroupDescription(group.description, group.baseName);
      group.variants.sort((a, b) => {
        const aI = /initial|first\s*consult/i.test(a.name) ? 0 : 1;
        const bI = /initial|first\s*consult/i.test(b.name) ? 0 : 1;
        if (aI !== bI) return aI - bI;
        const aF = /follow\s*up/i.test(a.name) ? 1 : 0;
        const bF = /follow\s*up/i.test(b.name) ? 1 : 0;
        if (aF !== bF) return aF - bF;
        return (a.duration ?? 0) - (b.duration ?? 0);
      });
    }

    const grouped = Array.from(groups.values());

    // Sort by category order, then within-category order
    grouped.sort((a, b) => {
      const catA = categoryOrder.indexOf(a.category);
      const catB = categoryOrder.indexOf(b.category);
      const orderA = catA >= 0 ? catA : 999;
      const orderB = catB >= 0 ? catB : 999;
      if (orderA !== orderB) return orderA - orderB;
      // Within same category
      const withinOrder = serviceOrderWithinCategory[a.category];
      if (withinOrder) {
        const wA = withinOrder[a.baseName] ?? 99;
        const wB = withinOrder[b.baseName] ?? 99;
        if (wA !== wB) return wA - wB;
      }
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
      if (!categoryOrder.includes(service.category)) continue;
      const cat = service.category;
      if (!categoryMap.has(cat)) categoryMap.set(cat, []);
      categoryMap.get(cat)!.push(service);
    }
    // Return in category order
    const sorted = new Map<string, GroupedService[]>();
    for (const cat of categoryOrder) {
      if (categoryMap.has(cat)) sorted.set(cat, categoryMap.get(cat)!);
    }
    return sorted;
  }, [groupedServices, searchQuery]);

  const handleSelectService = (service: any) => {
    onSelectService?.({
      ...service,
      contactOnly: service.contactOnly,
      ...(classDescriptionIdMap[service.baseName] ? { classDescriptionIds: classDescriptionIdMap[service.baseName] } : {}),
    });
  };

  return (
    <div className="min-h-full">
      {/* Search bar + Tabs */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-white/10 px-4 py-3 space-y-3">
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-lg mx-auto">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="px-4 py-4 max-w-lg mx-auto">
        {activeTab === 'services' ? (
          <>
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
                    onSelectService={handleSelectService}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <ClassSchedule />
        )}
      </div>
    </div>
  );
};

export default Services;
