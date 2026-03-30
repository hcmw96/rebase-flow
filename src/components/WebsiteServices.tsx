import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ArrowRight } from 'lucide-react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { useMindbodyServices } from '@/hooks/useMindbodyServices';
import { useHiddenServices } from '@/hooks/useHiddenServices';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
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
  { pattern: /^infrared\s*sauna/i, groupName: 'Infrared Suite' },
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
  { pattern: /^assisted\s*stretching/i, groupName: 'Assisted Stretching' },
  { pattern: /^deo.*body\s*alignment/i, groupName: "Deo's Body Alignment Method" },
];

const hiddenGroupNames = new Set([
  'Rebase Packages', 'Corporate Credits', 'Corporate credits',
  'Off Peak Access', 'MOCK CLASS', 'Vitamin Stack', 'Club Takeover',
  'Ozone Aesthetics Packages', 'Hydro Pro Facial', 'Members Wellness Event',
  'Members Only', 'Sound Bath',
  'Wellness Event', 'Saturday Buffer', 'Thursday Buffer', 'Nutritional Therapy',
]);

const hiddenProgramIds = new Set([12]);

const hiddenServiceNames = new Set([
  'Add On: Lymphatic Drainage Compression', 'Full Facial/Body Consultation',
  'Ozone - Aesthetics', 'Discovery Call', 'Saturday Buffer', 'Thursday Buffer',
  'Destress Head Neck and Shoulders', 'Destress Head, Neck & Shoulders',
  'Destress Head, Neck and Shoulders', 'Indian Head Massage', 'Indian Massage',
]);

const shortDescriptions: Record<string, string> = {
  'Infrared Suite': 'Detoxifying infrared heat followed by an invigorating ice bath.',
  'Premium Suite': 'Private suite with Finnish sauna, ice baths and bucket shower.',
  'Midday Reset': 'A restorative midday escape in our private wellness suite.',
  'Cryotherapy': 'Whole-body cold therapy to reduce inflammation and boost recovery.',
  'Hyperbaric Oxygen': 'Pressurised oxygen therapy to accelerate healing and recovery.',
  'IV Drip': 'Vitamin-rich IV infusions tailored to your wellness goals.',
  'NAD+': 'Cellular regeneration therapy to restore energy and vitality.',
  'Massage': 'Expert deep tissue and sports massage for total tension relief.',
  'Skin Rejuvenation': 'Advanced facial treatments for radiant, youthful skin.',
  'Skin Peel': 'Clinical-grade peels to resurface and refresh your complexion.',
  'BioStimulation': 'Targeted bio-electric therapy to stimulate tissue repair.',
  'Structural Fascia Therapy': 'Hands-on fascial release for posture and pain relief.',
  'Holistic Face Sculpting': 'Natural face-lift technique using sculpting massage.',
  'Divine Facial Healing': 'A deeply relaxing, restorative facial ritual.',
  'Osteopathy': 'Manual therapy to restore movement and relieve pain.',
  'Ozone Therapy': 'Medical-grade ozone to support detoxification and immunity.',
  'Brazilian Lymphatic': 'Specialised drainage massage to reduce fluid retention.',
  'Nutritional Therapy': 'Personalised nutrition guidance for optimal health.',
  'Myofascial Dry Needling': 'Precision needling to release deep muscular tension.',
};

const programNameOverrides: Record<string, string> = {
  "Member's Suite": 'Communal Members Suite',
  'Members Suite': 'Communal Members Suite',
};

const categoryOverrides: Record<string, string> = {
  "Member's Suite": 'Communal Members Suite',
  'Members Suite': 'Communal Members Suite',
  'Classes': 'Signature Classes',
  'Infrared Suite': 'Private Suites',
  'Premium Suite': 'Private Suites',
  'Midday Reset': 'Private Suites',
  'Hyperbaric Oxygen': 'Hyperbaric Oxygen',
  'Cryotherapy': 'Cryotherapy',
  'Massage': 'Massage Therapy',
  'Brazilian Lymphatic': 'Massage Therapy',
  'Assisted Stretching': 'Massage Therapy',
  "Deo's Body Alignment Method": 'Massage Therapy',
  'Holistic Face Sculpting': 'Massage Therapy',
  'Divine Facial Healing': 'Massage Therapy',
  'IV Drip': 'IV Drips',
  'NAD+': 'IV Drips',
  'Blood Test': 'IV Drips',
  'Vitamin Shot': 'IV Drips',
  'Osteopathy': 'Regen and Manual Therapies',
  'Myofascial Dry Needling': 'Regen and Manual Therapies',
  'Structural Fascia Therapy': 'Regen and Manual Therapies',
  'Ozone Therapy': 'Regen and Manual Therapies',
  'Skin Rejuvenation': 'Regen and Manual Therapies',
  'Skin Peel': 'Regen and Manual Therapies',
  'BioStimulation': 'Regen and Manual Therapies',
};

const categoryOrder = [
  'Communal Members Suite',
  'Signature Classes',
  'Private Suites',
  'Hyperbaric Oxygen',
  'Cryotherapy',
  'Massage Therapy',
  'IV Drips',
  'Regen and Manual Therapies',
];

const serviceImages: Record<string, string> = {
  'Cryotherapy': '/images/rebase-cryo.webp',
  'Infrared Suite': '/images/rebase-infrared-suite.jpg',
  'Hyperbaric Oxygen': '/images/rebase-hbot-treatment.webp',
  'Premium Suite': '/images/rebase-private-suites.webp',
  'IV Drip': '/images/rebase-iv-drip.jpg',
  'NAD+': '/images/rebase-iv-drip.jpg',
  'Massage': '/images/rebase-massage.jpg',
  'Assisted Stretching': '/images/rebase-treatment-room.jpg',
  'Brazilian Lymphatic': '/images/rebase-brazilian-lymphatic.jpg',
  "Deo's Body Alignment Method": '/images/rebase-deo-body-alignment.jpg',
  'Holistic Face Sculpting': '/images/rebase-holistic-face-sculpting.jpg',
  'Divine Facial Healing': '/images/rebase-divine-facial.jpg',
  'Blood Test': '/images/rebase-blood-test.jpg',
  'Osteopathy': '/images/rebase-osteopathy.jpg',
  'Structural Fascia Therapy': '/images/rebase-structural-fascia.jpg',
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

const classOfferings = [
  {
    name: 'Urban Oasis',
    image: '/images/rebase-class-urban-oasis.jpg',
    description: 'A calming escape combining breathwork and meditation in candlelit surroundings.',
  },
  {
    name: 'Contrast Immersion',
    image: '/images/rebase-class-contrast-immersion.jpg',
    description: 'Guided hot-cold contrast therapy to boost circulation and recovery.',
  },
  {
    name: 'Yoga',
    image: '/images/rebase-class-yoga.jpg',
    description: 'Prana Flow and Dynamic Flow sessions to build strength and flexibility.',
  },
  {
    name: 'Mat Pilates',
    image: '/images/rebase-class-mat-pilates.jpg',
    description: 'Core-focused mat work to improve posture, tone and stability.',
  },
];

const WebsiteServices = ({ onSelectService }: WebsiteServicesProps) => {
  const { data: services, isLoading } = useMindbodyServices();
  const { data: hiddenServices = [] } = useHiddenServices();
  const [expandedService, setExpandedService] = useState<string | null>(null);
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
        || programNameOverrides[rawCategory]
        || (rawCategory.startsWith('Sauna Suite') ? 'Private Suites' : rawCategory);

      if (category === 'General') continue;
      if (hiddenGroupNames.has(canonicalName)) continue;

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

    return Array.from(groups.values());
  }, [services, hiddenServiceIds]);

  const servicesByCategory = useMemo(() => {
    const map = new Map<string, GroupedService[]>();
    for (const service of groupedServices) {
      // Only include services in allowed categories
      if (!categoryOrder.includes(service.category)) continue;
      if (!map.has(service.category)) map.set(service.category, []);
      map.get(service.category)!.push(service);
    }
    // Within-category ordering
    const serviceOrderWithinCategory: Record<string, Record<string, number>> = {
      'IV Drips': { 'IV Drip': 0, 'Blood Test': 1, 'NAD+': 2 },
    };
    // Sort by defined category order
    const sorted = new Map<string, GroupedService[]>();
    for (const cat of categoryOrder) {
      if (!map.has(cat)) continue;
      const items = map.get(cat)!;
      const orderMap = serviceOrderWithinCategory[cat];
      if (orderMap) {
        items.sort((a, b) => (orderMap[a.baseName] ?? 99) - (orderMap[b.baseName] ?? 99));
      }
      sorted.set(cat, items);
    }
    return sorted;
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
    <section id="services" className="pt-44 pb-24 px-6 scroll-mt-20" style={{ background: 'hsl(25, 18%, 10%)' }}>
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
                {category === 'Signature Classes' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-4">
                    {classOfferings.map((cls) => (
                      <motion.div
                        key={cls.name}
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="group rounded-lg overflow-hidden bg-[hsl(25,15%,14%)] border border-[#F9ECD9]/8 hover:border-[#F9ECD9]/20 transition-colors"
                      >
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={cls.image}
                            alt={cls.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(25,15%,14%)] via-transparent to-transparent" />
                        </div>
                        <div className="p-5 space-y-2">
                          <h4 className="font-serif text-xl text-[#F9ECD9] font-light">
                            {cls.name}
                          </h4>
                          <p className="text-[#F9ECD9]/50 text-xs font-light leading-relaxed">
                            {cls.description}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
                  {catServices.map((service) => {
                    const fromPrice = getFromPrice(service.variants);
                    const firstVariant = service.variants[0];
                    const shortDesc = shortDescriptions[service.baseName] || 'Experience our premium wellness service.';
                    const isExpanded = expandedService === service.baseName;

                      return (
                        <motion.button
                          key={service.baseName}
                          onClick={() => {
                            if (isExpanded) {
                              setExpandedService(null);
                            } else {
                              setExpandedService(service.baseName);
                            }
                          }}
                          whileHover={{ y: -4 }}
                          transition={{ duration: 0.2 }}
                          className="group text-left rounded-lg overflow-hidden bg-[hsl(25,15%,14%)] border border-[#F9ECD9]/8 hover:border-[#F9ECD9]/20 transition-colors relative"
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
                            <div className="flex items-center justify-between">
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

                          {/* Slide-up overlay */}
                          <div
                            className={`absolute inset-px rounded-lg backdrop-blur-sm flex flex-col justify-end p-5 transition-transform duration-300 ease-out ${
                              isExpanded ? 'translate-y-0' : 'translate-y-full'
                            } sm:group-hover:translate-y-0`}
                            style={{ backgroundColor: 'hsla(25, 15%, 12%, 0.95)' }}
                          >
                            <h4 className="font-serif text-xl text-[#F9ECD9] font-light mb-2">
                              {service.baseName}
                            </h4>
                            <p className="text-[#F9ECD9]/60 text-xs line-clamp-2 font-light leading-relaxed mb-3">
                              {shortDesc}
                            </p>
                            <div className="flex items-center gap-3 mb-4">
                              <span className="text-[#F9ECD9]/90 font-medium text-sm">
                                {fromPrice !== null ? `From £${fromPrice}` : 'Contact for pricing'}
                              </span>
                              {firstVariant?.duration && (
                                <span className="flex items-center gap-1 text-xs text-[#F9ECD9]/40">
                                  <Clock className="h-3 w-3" />
                                  {firstVariant.duration} min
                                </span>
                              )}
                            </div>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClick(service);
                              }}
                              className="w-full bg-[#F9ECD9] text-[hsl(25,15%,12%)] hover:bg-[#F9ECD9]/90 font-medium"
                              size="sm"
                            >
                              Book Now
                            </Button>
                          </div>
                        </motion.button>
                      );
                  })}
                </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 flex justify-center"
        >
          <Link
            to="/auth"
            className="px-10 py-4 bg-white/10 backdrop-blur-md border border-[#F9ECD9]/20 text-[#F9ECD9] hover:bg-white/20 hover:border-[#F9ECD9]/40 transition-all duration-300 uppercase tracking-[0.2em] text-sm font-light"
          >
            Join Our Community
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default WebsiteServices;
