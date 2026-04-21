import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Skeleton } from '@/components/ui/skeleton';
import { useMindbodyServices } from '@/hooks/useMindbodyServices';
import { useHiddenServices } from '@/hooks/useHiddenServices';
import BookingDrawer, { BookingServiceData } from '@/components/booking/BookingDrawer';
import {
  hiddenProgramIds,
  isHiddenServiceName,
  hiddenGroupNames,
  categoryOverrides,
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
  packageGroups,
} from '@/config/serviceConfig';
import { ServiceVariant } from '@/components/ServiceCard';

interface ExperienceDrawerProps {
  open: boolean;
  onClose: () => void;
  experience: {
    name: string;
    image: string;
    description: string;
  } | null;
}

const ExperienceDrawer = ({ open, onClose, experience }: ExperienceDrawerProps) => {
  const { data: services, isLoading } = useMindbodyServices();
  const { data: hiddenServices = [] } = useHiddenServices();
  const [bookingService, setBookingService] = useState<BookingServiceData | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  const hiddenServiceIds = useMemo(() => new Set(hiddenServices.map(h => h.service_id)), [hiddenServices]);

  const categoryServices = useMemo(() => {
    if (!services?.length || !experience) return [];
    const visibleServices = services.filter(s => !hiddenServiceIds.has(s.id));
    const groups = new Map<string, GroupedService>();

    for (const service of visibleServices) {
      if (hiddenProgramIds.has(service.programId)) continue;
      if (isHiddenServiceName(service.name)) continue;

      const { baseName, duration } = extractDurationFromName(service.name);
      const canonicalName = canonicalizeServiceName(baseName);
      const rawCategory = service.programName || service.category || 'Wellness';
      const category = resolveCategory(canonicalName, rawCategory);

      if (category !== experience.name) continue;
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
        return (a.duration ?? 0) - (b.duration ?? 0);
      });
    }

    const items = Array.from(groups.values());
    const orderMap = serviceOrderWithinCategory[experience.name];
    if (orderMap) {
      items.sort((a, b) => (orderMap[a.baseName] ?? 99) - (orderMap[b.baseName] ?? 99));
    }
    return items;
  }, [services, hiddenServiceIds, experience]);

  const getFromPrice = (variants: ServiceVariant[], baseName?: string) => {
    const prices = variants.map(v => v.price).filter((p): p is number => p !== null && p > 0);
    if (prices.length) return Math.min(...prices);
    if (baseName && priceOverrides[baseName] !== undefined) return priceOverrides[baseName];
    return null;
  };

  const handleSelectService = (service: GroupedService) => {
    setBookingService({
      title: service.baseName,
      description: service.description,
      category: service.category,
      image: service.image,
      variants: service.variants,
      contactOnly: service.contactOnly,
      ...(classDescriptionIdMap[service.baseName] ? { classDescriptionIds: classDescriptionIdMap[service.baseName] } : {}),
    });
    setBookingOpen(true);
  };

  const handleSelectClass = (cls: typeof classOfferings[0]) => {
    setBookingService({
      title: cls.name,
      description: cls.description,
      category: 'Signature Classes',
      image: cls.image,
      variants: [],
      classDescriptionIds: cls.classDescriptionIds,
    });
    setBookingOpen(true);
  };

  const isSignatureClasses = experience?.name === 'Signature Classes';

  if (!experience) return null;

  return (
    <>
      <Drawer open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
        <DrawerContent className="h-[100dvh] max-h-[100dvh] rounded-none border-none outline-none bg-[#1a1a1a]" hideHandle>
          <div className="flex flex-col h-full overflow-hidden">
            {/* Hero */}
            <div className="relative shrink-0 min-h-[35vh] pb-2">
              <img
                src={experience.image}
                alt={experience.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/40 to-transparent" />

              <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10" style={{ paddingTop: 'max(1rem, var(--safe-area-top, env(safe-area-inset-top, 0px)))' }}>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-white" />
                </button>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                <h2 className="text-2xl font-light text-[#F9ECD9] tracking-wide">
                  {experience.name}
                </h2>
                <p className="text-[#F9ECD9]/50 text-sm font-light mt-2 leading-relaxed">
                  {experience.description}
                </p>
              </div>
            </div>

            {/* Services list */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-lg bg-white/5" />
                  ))}
                </div>
              ) : isSignatureClasses ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {classOfferings.map((cls) => (
                    <motion.button
                      key={cls.name}
                      onClick={() => handleSelectClass(cls)}
                      whileTap={{ scale: 0.965 }}
                      className="group text-left rounded-lg overflow-hidden bg-white/[0.03] border border-[#F9ECD9]/8 hover:border-[#F9ECD9]/20 transition-colors"
                    >
                      <div className="relative h-36 overflow-hidden">
                        <img
                          src={cls.image}
                          alt={cls.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent" />
                      </div>
                      <div className="p-4 space-y-1.5 pr-20">
                        <h4 className="text-base text-[#F9ECD9] font-light">{cls.name}</h4>
                        <p className="text-[#F9ECD9]/40 text-xs font-light leading-relaxed">{cls.description}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : categoryServices.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[#F9ECD9]/40 text-sm font-light">
                    Services temporarily unavailable. Please try again later.
                  </p>
                </div>
              ) : (
                categoryServices.map((service) => {
                  const fromPrice = getFromPrice(service.variants, service.baseName);
                  const firstVariant = service.variants[0];
                  const shortDesc = shortDescriptions[service.baseName] || 'Experience our premium wellness service.';

                  return (
                    <motion.button
                      key={service.baseName}
                      onClick={() => handleSelectService(service)}
                      whileTap={{ scale: 0.965 }}
                      className="w-full flex items-center gap-4 p-4 rounded-lg bg-white/[0.03] border border-[#F9ECD9]/8 hover:border-[#F9ECD9]/20 transition-colors text-left"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                        <img
                          src={service.image}
                          alt={service.baseName}
                          className="w-full h-full object-cover"
                          style={{ objectPosition: serviceImagePositions[service.baseName] || 'center' }}
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="text-[#F9ECD9] text-sm font-medium truncate">
                          {service.baseName}{packageGroups.has(service.baseName) ? ' Package' : ''}
                        </h4>
                        <p className="text-[#F9ECD9]/40 text-xs font-light line-clamp-1">{shortDesc}</p>
                        <div className="flex items-center gap-3">
                          <span className="text-[#F9ECD9]/70 text-xs font-medium">
                            {fromPrice !== null ? `From £${fromPrice}` : 'Contact for pricing'}
                          </span>
                          {!packageGroups.has(service.baseName) && firstVariant?.duration && (
                            <span className="flex items-center gap-1 text-[10px] text-[#F9ECD9]/30">
                              <Clock className="h-2.5 w-2.5" />
                              {firstVariant.duration} min
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#F9ECD9]/20 shrink-0" />
                    </motion.button>
                  );
                })
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <BookingDrawer
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        service={bookingService}
      />
    </>
  );
};

export default ExperienceDrawer;
