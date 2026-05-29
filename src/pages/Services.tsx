import { useState, useMemo } from 'react';
import ServiceChip from '@/components/ServiceChip';
import CategorySection from '@/components/CategorySection';
import { useMindbodyServices } from '@/hooks/useMindbodyServices';
import { useHiddenServices } from '@/hooks/useHiddenServices';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ClassSchedule from '@/components/ClassSchedule';
import {
  hiddenGroupNames,
  hiddenProgramIds,
  isHiddenServiceName,
  categoryOrder,
  serviceOrderWithinCategory,
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
  staticWebsiteCatalogue,
  resolveDisplayName,
} from '@/config/serviceConfig';


import type { BookingServiceData } from '@/components/booking/BookingDrawer';

interface ServicesProps {
  onSelectService?: (service: BookingServiceData) => void;
}

const Services = ({ onSelectService }: ServicesProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('services');
  const { data: services, error } = useMindbodyServices();
  const { data: hiddenServices = [] } = useHiddenServices();

  const hiddenServiceIds = useMemo(() => new Set(hiddenServices.map(h => h.service_id)), [hiddenServices]);

  // Live groups built from Mindbody data (empty until the API responds).
  const liveGroups = useMemo(() => {
    const groups = new Map<string, GroupedService>();
    if (!services?.length) return groups;

    const visibleServices = services.filter(s => !hiddenServiceIds.has(s.id));

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
      const isPack = service.isPack === true;
      const variantDesc = resolveVariantDescription(
        service.name,
        canonicalName,
        service.onlineDescription || service.description,
      );
      groups.get(canonicalName)!.variants.push({
        id: service.id,
        duration: isPack ? null : (duration ?? service.defaultTimeLength),
        price: isIvFirstConsult ? 0 : (service.price ?? priceOverrides[canonicalName] ?? null),
        name: service.name,
        description: variantDesc,
        contactOnly: isIvFirstConsult || isContactOnly || isPack,
        isPack,
        packSessionCount: service.packSessionCount ?? null,
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
        if (a.isPack !== b.isPack) return a.isPack ? 1 : -1;
        return (a.duration ?? 0) - (b.duration ?? 0);
      });
    }

    return groups;
  }, [services, hiddenServiceIds]);

  // Seed from the static catalogue so cards render instantly; hydrate with live data when it arrives.
  const groupedServices = useMemo(() => {
    const merged = new Map<string, GroupedService>();

    for (const entry of staticWebsiteCatalogue) {
      const live = liveGroups.get(entry.baseName);
      merged.set(entry.baseName, {
        baseName: entry.baseName,
        category: entry.category,
        image: entry.image,
        description: live && !isPlaceholderDescription(live.description)
          ? live.description
          : entry.shortDescription,
        variants: live?.variants ?? [],
        contactOnly: entry.contactOnly,
      });
    }

    // Include any live groups not represented in the static catalogue.
    for (const [name, live] of liveGroups.entries()) {
      if (!merged.has(name)) merged.set(name, live);
    }

    return Array.from(merged.values());
  }, [liveGroups]);

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
    // Sort within category, then arrange categories in canonical order.
    const sorted = new Map<string, GroupedService[]>();
    for (const cat of categoryOrder) {
      if (!categoryMap.has(cat)) continue;
      const items = categoryMap.get(cat)!;
      const orderMap = serviceOrderWithinCategory[cat];
      if (orderMap) {
        items.sort((a, b) => (orderMap[a.baseName] ?? 99) - (orderMap[b.baseName] ?? 99));
      }
      sorted.set(cat, items);
    }
    return sorted;
  }, [groupedServices, searchQuery]);


  const handleSelectService = (service: BookingServiceData & { baseName?: string; contactOnly?: boolean }) => {
    const displayName = resolveDisplayName(service.title ?? service.baseName ?? '');
    onSelectService?.({
      title: displayName,
      description: service.description,
      category: service.category,
      image: service.image,
      variants: service.variants,
      contactOnly: service.contactOnly,
      ...(classDescriptionIdMap[displayName] ? { classDescriptionIds: classDescriptionIdMap[displayName] } : {}),
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
            {error && servicesByCategory.size === 0 ? (
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
