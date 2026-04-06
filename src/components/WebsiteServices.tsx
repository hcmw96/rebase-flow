import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ChevronRight } from 'lucide-react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { useMindbodyServices } from '@/hooks/useMindbodyServices';
import { useHiddenServices } from '@/hooks/useHiddenServices';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { BookingServiceData } from '@/components/booking/BookingDrawer';
import { ServiceVariant } from '@/components/ServiceCard';
import {
  hiddenProgramIds,
  hiddenServiceNames,
  hiddenGroupNames,
  categoryOverrides,
  programNameOverrides,
  categoryOrder,
  serviceOrderWithinCategory,
  contactOnlyGroups,
  shortDescriptions,
  classOfferings,
  priceOverrides,
  classDescriptionIdMap,
  extractDurationFromName,
  canonicalizeServiceName,
  resolveCategory,
  resolveImage,
  serviceImagePositions,
  GroupedService,
} from '@/config/serviceConfig';

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
      const category = resolveCategory(canonicalName, rawCategory);

      if (category === 'General') continue;
      if (hiddenGroupNames.has(canonicalName)) continue;

      const image = resolveImage(canonicalName, service.programName, service.category);
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
        price: isIvFirstConsult ? 0 : (service.price ?? priceOverrides[canonicalName] ?? null), name: service.name,
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
      if (!categoryOrder.includes(service.category)) continue;
      if (!map.has(service.category)) map.set(service.category, []);
      map.get(service.category)!.push(service);
    }
    const sorted = new Map<string, GroupedService[]>();
    for (const cat of categoryOrder) {
      // Always include Signature Classes so the classOfferings grid renders
      if (cat === 'Signature Classes') {
        sorted.set(cat, map.get(cat) ?? []);
        continue;
      }
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
      ...(classDescriptionIdMap[service.baseName] ? { classDescriptionIds: classDescriptionIdMap[service.baseName] } : {}),
    });
  };

  const getFromPrice = (variants: ServiceVariant[], baseName?: string) => {
    const prices = variants.map(v => v.price).filter((p): p is number => p !== null && p > 0);
    if (prices.length) return Math.min(...prices);
    if (baseName && priceOverrides[baseName] !== undefined) return priceOverrides[baseName];
    return null;
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
                      <motion.button
                        key={cls.name}
                        onClick={() => onSelectService({
                          title: cls.name,
                          description: cls.description,
                          category: 'Signature Classes',
                          image: cls.image,
                          variants: [],
                          classDescriptionIds: cls.classDescriptionIds,
                        })}
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="group text-left rounded-lg overflow-hidden bg-[hsl(25,15%,14%)] border border-[#F9ECD9]/8 hover:border-[#F9ECD9]/20 transition-colors cursor-pointer"
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
                      </motion.button>
                    ))}
                  </div>
                ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
                  {catServices.map((service) => {
                    const fromPrice = getFromPrice(service.variants, service.baseName);
                    const firstVariant = service.variants[0];
                    const shortDesc = shortDescriptions[service.baseName] || 'Experience our premium wellness service.';

                      return (
                        <motion.button
                          key={service.baseName}
                          onClick={() => handleClick(service)}
                          whileHover={{ y: -4 }}
                          transition={{ duration: 0.2 }}
                          className="group text-left rounded-lg overflow-hidden bg-[hsl(25,15%,14%)] border border-[#F9ECD9]/8 hover:border-[#F9ECD9]/20 transition-colors relative"
                        >
                          <div className="relative h-48 overflow-hidden">
                            <img
                              src={service.image}
                              alt={service.baseName}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                              style={{ objectPosition: serviceImagePositions[service.baseName] || 'center' }}
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

                          {/* Hover-only overlay (desktop) */}
                          <div
                            className="absolute inset-0 backdrop-blur-sm flex-col justify-end p-5 translate-y-full transition-transform duration-300 ease-out hidden sm:flex sm:group-hover:translate-y-0"
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

        {/* Logo Ticker */}
        <div className="mt-16 overflow-hidden">
          <p className="text-center text-[#F9ECD9]/30 text-xs uppercase tracking-[0.25em] mb-6 font-light">As Featured In</p>
          <div className="relative">
            <div className="flex animate-ticker gap-16 w-max">
              {[...Array(2)].map((_, setIdx) => (
                <div key={setIdx} className="flex items-center gap-16 shrink-0">
                  {['/images/ticker-logo-1.svg', '/images/ticker-logo-2.svg', '/images/ticker-logo-3.svg', '/images/ticker-logo-4.svg', '/images/ticker-logo-5.svg', '/images/ticker-logo-6.svg', '/images/ticker-logo-7.svg', '/images/ticker-logo-8.svg'].map((logo, i) => (
                    <img
                      key={`${setIdx}-${i}`}
                      src={logo}
                      alt=""
                      className="h-8 w-auto opacity-40 brightness-0 invert"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Learn about Membership */}
        <div className="mt-10 text-center">
          <Link
            to="/membership"
            className="text-[#F9ECD9]/50 hover:text-[#F9ECD9]/80 text-xs uppercase tracking-[0.25em] font-light transition-colors duration-300"
          >
            Learn about Membership →
          </Link>
        </div>

        {/* Mission & Vision */}
        <div className="mt-24 max-w-3xl mx-auto space-y-16">
          <div className="text-center">
            <p className="text-[#F9ECD9]/40 text-xs uppercase tracking-[0.3em] mb-4 font-light">
              Our Mission
            </p>
            <p className="text-[#F9ECD9]/70 text-base sm:text-lg font-light leading-relaxed">
              To help boost your baseline and achieve elemental balance through a bespoke programme of precision treatments, structured classes and shared experience.
            </p>
          </div>

          <div className="text-center">
            <p className="text-[#F9ECD9]/40 text-xs uppercase tracking-[0.3em] mb-4 font-light">
              Our Vision
            </p>
            <div className="space-y-4 text-[#F9ECD9]/70 text-base sm:text-lg font-light leading-relaxed">
              <p>
                It seems at times that modern life is at odds with healthy living. Habitual screen-use and the struggle to strike the right work/life balance have disrupted our natural health and how hard it is to find time to relax and recharge.
              </p>
              <p>
                That's the bad news. The good news is we're here to change all that.
              </p>
              <p>
                Years of evolution have taught our bodies to respond to controlled stressors, like the cold and heat, and to reset our systems with the power of our breath. Contemporary studies have long shown the massive positive impact that social wellness can have on all our areas of our lives, from mental clarity and focus to more energy, better sleep and enhanced resilience.
              </p>
              <p>
                Rebase is our vision for a recalibrated social space, where health and happiness are no longer at odds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WebsiteServices;
