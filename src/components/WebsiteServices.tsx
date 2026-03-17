import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, ArrowRight } from 'lucide-react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { useMindbodyServices } from '@/hooks/useMindbodyServices';
import { useHiddenServices } from '@/hooks/useHiddenServices';
import { Skeleton } from '@/components/ui/skeleton';
import { BookingServiceData } from '@/components/booking/BookingDrawer';
import { ServiceVariant } from '@/components/ServiceCard';
import {
  contactOnlyGroups,
} from '@/pages/Services';

// Reuse the same grouping logic from Services.tsx
const serviceGroupMappings: Array<{ pattern: RegExp; groupName: string }> = [
  { pattern: /^iv\s*(drip|add\s*on)/i, groupName: 'IV Drip' },
  { pattern: /^nad\+?/i, groupName: 'NAD+' },
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
  { pattern: /^brazil+ian\s*lymphatic/i, groupName: 'Brazilian Lymphatic' },
  { pattern: /^(the\s+)?midday\s*resets?/i, groupName: 'Midday Reset' },
  { pattern: /^nutritional\s*therap/i, groupName: 'Nutritional Therapy' },
  { pattern: /^myofascial\s*dry\s*needl/i, groupName: 'Myofascial Dry Needling' },
];

const hiddenGroupNames = new Set([
  'Rebase Packages', 'Corporate Credits', 'Corporate credits', 'Classes',
  'Off Peak Access', 'MOCK CLASS', 'Vitamin Stack', 'Club Takeover',
  'Ozone Aesthetics Packages', 'Hydro Pro Facial', 'Members Wellness Event',
  'Members Only', 'Sound Bath', "Member's Suite", 'Members Suite',
  'Wellness Event', 'Saturday Buffer', 'Thursday Buffer',
]);

const hiddenProgramIds = new Set([12]);

const hiddenServiceNames = new Set([
  'Add On: Lymphatic Drainage Compression', 'Full Facial/Body Consultation',
  'Ozone - Aesthetics', 'Discovery Call', 'Saturday Buffer', 'Thursday Buffer',
  'Destress Head Neck and Shoulders', 'Destress Head, Neck & Shoulders',
  'Destress Head, Neck and Shoulders', 'Indian Head Massage', 'Indian Massage',
]);

const categoryOverrides: Record<string, string> = { 'Midday Reset': 'Private Suites' };
const regenWhitelist = new Set(['Osteopathy', 'Myofascial Dry Needling', 'Structural Fascia Therapy']);

const serviceImages: Record<string, string> = {
  'Cryotherapy': '/images/rebase-cryo.webp',
  'Infrared Sauna & Ice Bath': '/images/rebase-ice-sauna-new.webp',
  'Hyperbaric Oxygen': '/images/rebase-hbot-treatment.webp',
  'Premium Suite': '/images/rebase-private-suites.webp',
  'IV Drip': '/images/rebase-suite.webp',
  'NAD+': '/images/rebase-suite.webp',
  'Massage': '/images/rebase-suite.webp',
};

const categoryImages: Record<string, string> = {
  'Recovery': '/images/rebase-hbot-new.png',
  'Wellness': '/images/rebase-ice-sauna.webp',
  'Private': '/images/rebase-private-suites.webp',
  'default': '/images/rebase-suite.webp',
};

function extractDurationFromName(name: string): { baseName: string; duration: number | null } {
  const match = name.match(/\((\d+)\s*(?:mins?|minutes?)\)/i);
  if (match) return { baseName: name.replace(match[0], '').trim(), duration: parseInt(match[1], 10) };
  return { baseName: name, duration: null };
}

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
  contactOnly?: boolean;
}

interface WebsiteServicesProps {
  onSelectService: (service: BookingServiceData) => void;
}

const stripHtml = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

const WebsiteServices = ({ onSelectService }: WebsiteServicesProps) => {
  const { data: services, isLoading } = useMindbodyServices();
  const { data: hiddenServices = [] } = useHiddenServices();
  const hiddenServiceIds = useMemo(() => new Set(hiddenServices.map(h => h.service_id)), [hiddenServices]);

  const groupedServices = useMemo(() => {
    if (!services?.length) return [];
    const visibleServices = services.filter(s => !hiddenServiceIds.has(s.id));
    const groups = new Map<string, GroupedService>();

    for (const service of visibleServices) {
      if (hiddenProgramIds.has(service.programId)) continue;
      if (hiddenServiceNames.has(service.name)) continue;

      const { baseName, duration } = extractDurationFromName(service.name);
      const canonicalName = canonicalizeServiceName(baseName);
      const rawCategory = service.programName || service.category || 'Wellness';
      let category = categoryOverrides[canonicalName]
        || (rawCategory.startsWith('Sauna Suite') ? 'Private Suites' : rawCategory);

      if (category === 'General') continue;
      if (hiddenGroupNames.has(canonicalName)) continue;
      if (/regen|manual\s*therap/i.test(category) && !regenWhitelist.has(canonicalName)) continue;

      const image = serviceImages[canonicalName] || categoryImages[service.programName] || categoryImages[service.category] || categoryImages['default'];
      const isContactOnly = contactOnlyGroups.has(canonicalName);

      if (!groups.has(canonicalName)) {
        groups.set(canonicalName, {
          baseName: canonicalName,
          description: service.onlineDescription || service.description || 'Experience our premium wellness service.',
          category, image, variants: [], contactOnly: isContactOnly,
        });
      }

      const isIvFirstConsult = canonicalName === 'IV Drip' && /first\s*consult|initial/i.test(service.name);
      groups.get(canonicalName)!.variants.push({
        id: service.id, duration: duration ?? service.defaultTimeLength,
        price: isIvFirstConsult ? 0 : service.price, name: service.name,
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
    const order: Record<string, number> = {
      'Infrared Sauna & Ice Bath': 0, 'Premium Suite': 1, 'Midday Reset': 2, 'Cryotherapy': 3,
    };
    grouped.sort((a, b) => {
      const oA = order[a.baseName] ?? 999;
      const oB = order[b.baseName] ?? 999;
      return oA !== oB ? oA - oB : a.baseName.localeCompare(b.baseName);
    });
    return grouped;
  }, [services, hiddenServiceIds]);

  const servicesByCategory = useMemo(() => {
    const map = new Map<string, GroupedService[]>();
    for (const service of groupedServices) {
      if (!map.has(service.category)) map.set(service.category, []);
      map.get(service.category)!.push(service);
    }
    return map;
  }, [groupedServices]);

  const handleClick = (service: GroupedService) => {
    onSelectService({
      title: service.baseName,
      description: service.description,
      category: service.category,
      image: service.image,
      variants: service.variants,
      contactOnly: service.contactOnly,
    });
  };

  const getFromPrice = (variants: ServiceVariant[]) => {
    const prices = variants.map(v => v.price).filter((p): p is number => p !== null && p > 0);
    return prices.length ? Math.min(...prices) : null;
  };

  if (isLoading) {
    return (
      <section id="services" className="py-24 px-6 bg-[hsl(25,18%,10%)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-5 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="services" className="py-24 px-6" style={{ background: 'hsl(25, 18%, 10%)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light text-[#F9ECD9] tracking-tight">
            Our Experiences
          </h2>
          <p className="mt-4 text-[#F9ECD9]/60 text-base sm:text-lg max-w-2xl mx-auto font-light">
            Discover a curated collection of wellness treatments designed to restore, rejuvenate, and elevate.
          </p>
        </motion.div>

        {/* Categories */}
        <Accordion
          type="multiple"
          defaultValue={servicesByCategory.size > 0 ? [Array.from(servicesByCategory.keys())[0]] : []}
        >
          {Array.from(servicesByCategory.entries()).map(([category, catServices]) => (
            <AccordionItem
              key={category}
              value={category}
              className="border-b border-[#F9ECD9]/10"
            >
              <AccordionTrigger className="text-sm uppercase tracking-[0.2em] text-[#F9ECD9]/50 font-medium py-5 hover:no-underline hover:text-[#F9ECD9]/70 [&>svg]:text-[#F9ECD9]/40">
                {category}
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
                  {catServices.map((service) => {
                    const fromPrice = getFromPrice(service.variants);
                    const firstVariant = service.variants[0];
                    const desc = stripHtml(service.description);

                    return (
                      <motion.button
                        key={service.baseName}
                        onClick={() => handleClick(service)}
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="group text-left rounded-lg overflow-hidden bg-[hsl(25,15%,14%)] border border-[#F9ECD9]/8 hover:border-[#F9ECD9]/20 transition-colors"
                      >
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={service.image}
                            alt={service.baseName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(25,15%,14%)] via-transparent to-transparent" />
                        </div>
                        <div className="p-5 space-y-3">
                          <h4 className="font-serif text-xl text-[#F9ECD9] font-light">
                            {service.baseName}
                          </h4>
                          <p className="text-[#F9ECD9]/50 text-sm line-clamp-2 font-light leading-relaxed">
                            {desc}
                          </p>
                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-3">
                              <span className="text-[#F9ECD9]/90 font-medium">
                                {fromPrice !== null ? `From £${fromPrice}` : 'Contact for pricing'}
                              </span>
                              {firstVariant?.duration && (
                                <span className="flex items-center gap-1 text-xs text-[#F9ECD9]/40">
                                  <Clock className="h-3 w-3" />
                                  {firstVariant.duration} min
                                </span>
                              )}
                            </div>
                            <ArrowRight className="h-4 w-4 text-[#F9ECD9]/30 group-hover:text-[#F9ECD9]/70 transition-colors" />
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default WebsiteServices;
