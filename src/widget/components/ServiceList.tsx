import { useState, useEffect, useMemo } from 'react';
import { useWidget, GroupedService, ServiceVariant } from '../context/WidgetContext';
import { createApiClient, MindbodyService } from '../api/client';
import { CategorySection } from './CategorySection';

// Fallback images for services without images
const categoryImages: Record<string, string> = {
  'Recovery': '/images/rebase-hbot-new.png',
  'Wellness': '/images/rebase-ice-sauna.webp',
  'Classes': '/images/rebase-class.webp',
  'Private': '/images/rebase-private-suites.webp',
  'default': '/images/rebase-suite.webp',
};

// Service-specific images
const serviceImages: Record<string, string> = {
  'Cryotherapy': '/images/rebase-cryo.webp',
  'Infrared Sauna & Ice Bath': '/images/rebase-ice-sauna-new.webp',
  'Hyperbaric Oxygen': '/images/rebase-hbot-treatment.webp',
};

// Extract duration from service name
function extractDurationFromName(name: string): { baseName: string; duration: number | null } {
  const durationMatch = name.match(/\((\d+)\s*(?:mins?|minutes?)\)/i);
  if (durationMatch) {
    const duration = parseInt(durationMatch[1], 10);
    const baseName = name.replace(durationMatch[0], '').trim();
    return { baseName, duration };
  }
  return { baseName: name, duration: null };
}

// Service group mappings
const serviceGroupMappings: Array<{ pattern: RegExp; groupName: string }> = [
  { pattern: /^skin\s*rejuv(enation)?/i, groupName: 'Skin Rejuvenation' },
  { pattern: /^skin\s*peels?/i, groupName: 'Skin Peel' },
  { pattern: /^bio\s*stim(ulation)?/i, groupName: 'BioStimulation' },
  { pattern: /^deep\s*tissue\s*massage/i, groupName: 'Deep Tissue Massage' },
  { pattern: /^sports\s*massage/i, groupName: 'Sports Massage' },
  { pattern: /^destress\s*head/i, groupName: 'Destress Head, Neck & Shoulder Massage' },
  { pattern: /^indian\s*head\s*massage/i, groupName: 'Indian Head Massage' },
  { pattern: /^brazilian\s*lymphatic/i, groupName: 'Brazilian Lymphatic' },
  { pattern: /^brazillian\s*lymphatic/i, groupName: 'Brazilian Lymphatic' },
  { pattern: /^assisted\s*stretching/i, groupName: 'Assisted Stretching' },
  { pattern: /^deo.*body\s*alignment/i, groupName: "Deo's Body Alignment Method" },
  { pattern: /cryo(therapy)?/i, groupName: 'Cryotherapy' },
  { pattern: /^hyperbaric\s*oxygen/i, groupName: 'Hyperbaric Oxygen' },
  { pattern: /^infrared\s*sauna/i, groupName: 'Infrared Sauna & Ice Bath' },
  { pattern: /^premium\s*suite/i, groupName: 'Premium Suite' },
  { pattern: /^structural\s*fascia/i, groupName: 'Structural Fascia Therapy' },
  { pattern: /^myofascial\s*dry\s*needling/i, groupName: 'Myofascial Dry Needling' },
  { pattern: /^holistic\s*face\s*sculpt/i, groupName: 'Holistic Face Sculpting' },
  { pattern: /^divine\s*facial/i, groupName: 'Divine Facial Healing' },
  { pattern: /^four\s*hand\s*divine/i, groupName: 'Four Hand Divine Healing' },
  { pattern: /^osteopathy/i, groupName: 'Osteopathy' },
  { pattern: /^(oxygen-?)?ozone/i, groupName: 'Ozone Therapy' },
  { pattern: /^iv\s*drip/i, groupName: 'IV Drip' },
  { pattern: /^nad\+/i, groupName: 'NAD+' },
  { pattern: /^vitamin\s*shots?/i, groupName: 'Vitamin Shots' },
  { pattern: /^touch\s*&\s*(flow|glow)/i, groupName: 'Reflexology' },
  { pattern: /^flow\s*&\s*glow/i, groupName: 'Reflexology' },
  { pattern: /^ultimate\s*flow/i, groupName: 'Reflexology' },
  { pattern: /^the\s*midday\s*reset\s*-\s*infrared/i, groupName: 'The Midday Reset - Infrared Suite' },
  { pattern: /^the\s*midday\s*reset\s*-\s*premium/i, groupName: 'The Midday Reset - Premium Suite' },
  { pattern: /^gate\s*\+?\s*ground/i, groupName: 'Gate + Ground' },
  { pattern: /^acupuncture/i, groupName: 'Acupuncture' },
  { pattern: /^sound\s*bath/i, groupName: 'Sound Bath' },
  { pattern: /^neuro\s*regulation/i, groupName: 'Neuro Regulation' },
  { pattern: /minute\s*classes$/i, groupName: 'Classes' },
  { pattern: /^all\s*classes$/i, groupName: 'Classes' },
];

// Service groups to hide from the UI
const hiddenGroupNames = new Set([
  'Rebase Packages',
  'Corporate Credits',
  'Corporate credits',
  'Classes',
  'Off Peak Access',
  'MOCK CLASS',
  'Club Takeover',
  'Ozone Aesthetics Packages',
  'Hydro Pro Facial',
  'Injectables',
]);

// Program IDs to hide entirely (e.g. Aesthetics/Injectables)
const hiddenProgramIds = new Set([12, 34]); // 12=Aesthetics/Injectables, 34=Members Only

// Individual service names to hide
const hiddenServiceNames = new Set([
  'Add On: Lymphatic Drainage Compression',
  'Full Facial/Body Consultation',
  'Ozone - Aesthetics',
  'Iv add on',
  'IV Add On - Paracetamol',
  'Blood Test',
  'First Consultation',
  'Thursday Buffer',
  'Saturday Buffer',
  'members only',
  'Rebase Biohack Protocol',
  'Free Neurotox Top Up',
  'Facial Augmentation - Chin',
  'Members wellness event',
  'Vitamin Stack',
  'Hyalouronic Acid - 1 Joint',
  'Hyalouronic Acid - 2 Joints',
  'Hyde Pro Facial - Deluxe',
  'Hydro Pro Facial - Express',
  'Discovery Call',
  'Athlete Performance Package',
  'Longevity Package',
  'High Performance Recovery',
  'Core Radiance (Women\'s Health Package)',
  'Initial Consultation',
  'Follow Up Consultation',
]);

function canonicalizeServiceName(baseName: string, programName?: string): string {
  for (const { pattern, groupName } of serviceGroupMappings) {
    if (pattern.test(baseName)) {
      return groupName;
    }
  }
  // Fallback: use programName for known categories
  if (programName === 'Reflexology') return 'Reflexology';
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

  // Fetch services
  useEffect(() => {
    const client = createApiClient(config.apiUrl);
    
    client.getServices()
      .then((data) => {
        setServices(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [config.apiUrl]);

  // Group services by base name
  const groupedServices = useMemo(() => {
    if (!services || services.length === 0) return [];

    const groups = new Map<string, GroupedService>();

    for (const service of services) {
      // Skip hidden program IDs and individual service names
      if (hiddenProgramIds.has(service.programId)) continue;
      if (hiddenServiceNames.has(service.name.trim())) continue;

      const { baseName, duration } = extractDurationFromName(service.name);
      const canonicalName = canonicalizeServiceName(baseName, service.programName);
      const rawCategory = service.programName || service.category || 'Wellness';
      const category = rawCategory.startsWith('Sauna Suite') ? 'Sauna' : rawCategory;
      
      // Make image URLs absolute
      const baseUrl = config.apiUrl.replace('/functions/v1', '').replace('/functions', '');
      const getAbsoluteUrl = (path: string) => {
        if (path.startsWith('http')) return path;
        return `${baseUrl.replace(/\/$/, '')}${path}`;
      };
      
      const image = getAbsoluteUrl(
        serviceImages[canonicalName] || 
        categoryImages[service.programName] || 
        categoryImages[service.category] || 
        categoryImages['default']
      );

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

    // Sort variants: initial/first consult first, follow-up last, then by duration
    for (const group of groups.values()) {
      group.variants.sort((a, b) => {
        const aInitial = /initial|first\s*consult/i.test(a.name) ? 0 : 1;
        const bInitial = /initial|first\s*consult/i.test(b.name) ? 0 : 1;
        const aFollowUp = /follow\s*up/i.test(a.name) ? 1 : 0;
        const bFollowUp = /follow\s*up/i.test(b.name) ? 1 : 0;
        if (aInitial !== bInitial) return aInitial - bInitial;
        if (aFollowUp !== bFollowUp) return aFollowUp - bFollowUp;
        return (a.duration ?? 0) - (b.duration ?? 0);
      });
    }

    const grouped = Array.from(groups.values());
    
    // Custom sort order
    const serviceOrder: Record<string, number> = {
      'Infrared Sauna & Ice Bath': 0,
      'The Midday Reset - Infrared Suite': 1,
      'Premium Suite': 2,
      'The Midday Reset - Premium Suite': 3,
      'Cryotherapy': 4,
      'Hyperbaric Oxygen': 5,
      'Osteopathy': 10,
      'Ozone Therapy': 11,
      'Structural Fascia Therapy': 12,
      'Myofascial Dry Needling': 13,
      'Deep Tissue Massage': 20,
      'Sports Massage': 21,
      'Destress Head, Neck & Shoulder Massage': 22,
      'Indian Head Massage': 23,
      'Brazilian Lymphatic': 24,
      'Assisted Stretching': 25,
      "Deo's Body Alignment Method": 26,
      'Holistic Face Sculpting': 30,
      'Divine Facial Healing': 31,
      'Four Hand Divine Healing': 32,
      'Reflexology': 40,
      'IV Drip': 50,
      'NAD+': 51,
      'Vitamin Shots': 52,
      'Neuro Regulation': 53,
      'Acupuncture': 60,
      'Gate + Ground': 61,
      'Sound Bath': 70,
    };
    
    grouped.sort((a, b) => {
      const orderA = serviceOrder[a.baseName] ?? 999;
      const orderB = serviceOrder[b.baseName] ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.baseName.localeCompare(b.baseName);
    });

    return grouped;
  }, [services, config.apiUrl]);

  // Group services by category
  const servicesByCategory = useMemo(() => {
    const categoryMap = new Map<string, GroupedService[]>();
    
    // Filter by search
    let filtered = groupedServices;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(service => 
        service.baseName.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query)
      );
    }

    // Filter by category attribute
    if (config.category) {
      filtered = filtered.filter(service => 
        service.category.toLowerCase() === config.category?.toLowerCase()
      );
    }
    
    for (const service of filtered) {
      const cat = service.category;
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, []);
      }
      categoryMap.get(cat)!.push(service);
    }
    
    return categoryMap;
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
      {/* Search Bar */}
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

      {/* Categories */}
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
