import { useState, useEffect, useMemo } from 'react';
import { useWidget, GroupedService, ServiceVariant } from '../context/WidgetContext';
import { createApiClient, MindbodyService } from '../api/client';
import { CategorySection } from './CategorySection';
import {
  serviceGroupMappings,
  hiddenGroupNames,
  hiddenProgramIds,
  isHiddenServiceName,
  categoryOrder,
  categoryOverrides,
  programNameOverrides,
  serviceOrderWithinCategory,
  contactOnlyGroups,
  serviceImages as sharedServiceImages,
  categoryImages as sharedCategoryImages,
  extractDurationFromName,
} from '../../config/serviceConfig';

function canonicalizeServiceName(baseName: string): string {
  for (const { pattern, groupName } of serviceGroupMappings) {
    if (pattern.test(baseName)) return groupName;
  }
  return baseName;
}

interface ServiceListProps {
  onSelectService: (service: GroupedService) => void;
}

export function ServiceList({ onSelectService }: ServiceListProps) {
  const { config } = useWidget();
  const [services, setServices] = useState<MindbodyService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const client = createApiClient(config.apiUrl);
    client.getServices()
      .then((data) => { setServices(data); setIsLoading(false); })
      .catch((err) => { setError(err.message); setIsLoading(false); });
  }, [config.apiUrl]);

  const groupedServices = useMemo(() => {
    if (!services || services.length === 0) return [];

    const groups = new Map<string, GroupedService>();
    const baseUrl = config.apiUrl.replace('/functions/v1', '').replace('/functions', '');
    const getAbsoluteUrl = (path: string) => path.startsWith('http') ? path : `${baseUrl.replace(/\/$/, '')}${path}`;

    for (const service of services) {
      if (hiddenProgramIds.has(service.programId)) continue;
      if (isHiddenServiceName(service.name)) continue;

      const { baseName, duration } = extractDurationFromName(service.name);
      const canonicalName = canonicalizeServiceName(baseName);
      const rawCategory = service.programName || service.category || 'Wellness';
      const category =
        categoryOverrides[canonicalName] ||
        programNameOverrides[rawCategory] ||
        (rawCategory.startsWith('Sauna Suite') ? 'Private Suites' : rawCategory);

      if (category === 'General') continue;
      if (hiddenGroupNames.has(canonicalName)) continue;

      const image = getAbsoluteUrl(
        sharedServiceImages[canonicalName] ||
        sharedCategoryImages[service.programName] ||
        sharedCategoryImages[service.category] ||
        sharedCategoryImages['default']
      );

      const isContactOnly = contactOnlyGroups.has(canonicalName);

      if (!groups.has(canonicalName)) {
        groups.set(canonicalName, {
          baseName: canonicalName,
          description: service.onlineDescription || service.description || 'Experience our premium wellness service.',
          category, image, variants: [],
        });
      }

      const isIvFirstConsult = canonicalName === 'IV Drip' && /first\s*consult|initial/i.test(service.name);
      groups.get(canonicalName)!.variants.push({
        id: service.id,
        duration: duration ?? service.defaultTimeLength,
        price: isIvFirstConsult ? 0 : service.price,
        name: service.name,
        contactOnly: isIvFirstConsult || isContactOnly,
      });
    }

    for (const group of groups.values()) {
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
      const withinOrder = serviceOrderWithinCategory[a.category];
      if (withinOrder) {
        const wA = withinOrder[a.baseName] ?? 99;
        const wB = withinOrder[b.baseName] ?? 99;
        if (wA !== wB) return wA - wB;
      }
      return a.baseName.localeCompare(b.baseName);
    });

    return grouped;
  }, [services, config.apiUrl]);

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
    if (config.category) {
      filtered = filtered.filter(service =>
        service.category.toLowerCase() === config.category?.toLowerCase()
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
  }, [groupedServices, searchQuery, config.category]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-8 w-32 bg-[hsl(25,10%,15%)] rounded animate-pulse" />
            <div className="flex gap-3">
              <div className="h-[100px] w-[100px] bg-[hsl(25,10%,15%)] rounded-xl animate-pulse" />
              <div className="h-[100px] w-[100px] bg-[hsl(25,10%,15%)] rounded-xl animate-pulse" />
              <div className="h-[100px] w-[100px] bg-[hsl(25,10%,15%)] rounded-xl animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-[hsl(35,8%,55%)] mb-4">Unable to load services.</p>
        <p className="text-sm text-[hsl(35,8%,55%)]">Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="sticky top-0 z-10 bg-[hsl(25,18%,12%)] py-3 px-4">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[hsl(35,8%,55%)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 w-full pl-11 pr-4 text-base bg-[hsl(25,12%,15%)] border border-[hsl(25,10%,20%)] rounded-xl text-[hsl(35,15%,88%)] placeholder:text-[hsl(35,8%,55%)] focus:outline-none focus:ring-2 focus:ring-[hsl(35,15%,75%)] focus:border-transparent"
          />
        </div>
      </div>

      <div className="px-4 pb-4">
        {servicesByCategory.size === 0 ? (
          <div className="text-center py-12">
            <p className="text-[hsl(35,8%,55%)]">
              {searchQuery.trim()
                ? 'No services match your search.'
                : 'No services available.'}
            </p>
          </div>
        ) : (
          Array.from(servicesByCategory.entries()).map(([category, categoryServices], index) => (
            <CategorySection
              key={category}
              category={category}
              services={categoryServices}
              defaultExpanded={index < 3}
              onSelectService={onSelectService}
            />
          ))
        )}
      </div>
    </div>
  );
}
