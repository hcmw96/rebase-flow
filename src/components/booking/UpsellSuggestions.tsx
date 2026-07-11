import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatMindbodyTime, parseMindbodyDateTime, studioDateKeyFromCalendar } from '@/lib/sessionTimes';
import {
  useMindbodyServices,
  useMindbodyAvailability,
  type MindbodyService,
} from '@/hooks/useMindbodyServices';
import {
  canonicalizeServiceName,
  extractDurationFromName,
  contactOnlyGroups,
  classDescriptionIdMap,
} from '@/config/serviceConfig';

// Logical upsell mappings: service group → complementary services
const upsellMap: Record<string, string[]> = {
  'Cryotherapy': ['Infrared Sauna & Ice Bath', 'Massage', 'IV Drip'],
  'Infrared Sauna & Ice Bath': ['Cryotherapy', 'Massage', 'Premium Suite'],
  'Premium Suite': ['Massage', 'Cryotherapy', 'IV Drip'],
  
  'Massage': ['Cryotherapy', 'Infrared Sauna & Ice Bath', 'IV Drip'],
  'IV Drip': ['NAD+', 'Hyperbaric Oxygen', 'Cryotherapy'],
  'NAD+': ['IV Drip', 'Hyperbaric Oxygen', 'Cryotherapy'],
  'Hyperbaric Oxygen': ['Cryotherapy', 'IV Drip', 'Infrared Sauna & Ice Bath'],
  'Osteopathy': ['Massage', 'Cryotherapy', 'Structural Fascia Therapy'],
  'Structural Fascia Therapy': ['Osteopathy', 'Massage', 'Cryotherapy'],
  'Myofascial Dry Needling': ['Osteopathy', 'Massage', 'Cryotherapy'],
  'Brazilian Lymphatic': ['Massage', 'Infrared Sauna & Ice Bath', 'Cryotherapy'],
  'Skin Rejuvenation': ['IV Drip', 'Hyperbaric Oxygen', 'NAD+'],
  'Skin Peel': ['Skin Rejuvenation', 'IV Drip', 'Hyperbaric Oxygen'],
  'BioStimulation': ['Skin Rejuvenation', 'IV Drip', 'NAD+'],
  'Holistic Face Sculpting': ['Skin Rejuvenation', 'Massage', 'IV Drip'],
  'Divine Facial Healing': ['Skin Rejuvenation', 'Massage', 'IV Drip'],
  'Ozone Therapy': ['Hyperbaric Oxygen', 'IV Drip', 'Cryotherapy'],
  'Nutritional Therapy': ['IV Drip', 'NAD+', 'Hyperbaric Oxygen'],
};

const serviceInfo: Record<string, { image: string; shortDesc: string }> = {
  'Cryotherapy': { image: '/images/rebase-cryo.webp', shortDesc: 'Whole-body cold therapy' },
  'Infrared Sauna & Ice Bath': { image: '/images/rebase-ice-sauna-new.webp', shortDesc: 'Heat & cold contrast therapy' },
  'Premium Suite': { image: '/images/rebase-private-suites.webp', shortDesc: 'Private wellness suite' },
  'Massage': { image: '/images/rebase-suite.webp', shortDesc: 'Therapeutic bodywork' },
  'IV Drip': { image: '/images/rebase-suite.webp', shortDesc: 'Vitamin & mineral infusion' },
  'NAD+': { image: '/images/rebase-suite.webp', shortDesc: 'Cellular regeneration therapy' },
  'Hyperbaric Oxygen': { image: '/images/rebase-hbot-treatment.webp', shortDesc: 'Pressurised oxygen therapy' },
  'Osteopathy': { image: '/images/rebase-suite.webp', shortDesc: 'Manual musculoskeletal therapy' },
  'Structural Fascia Therapy': { image: '/images/rebase-suite.webp', shortDesc: 'Deep connective tissue work' },
  'Skin Rejuvenation': { image: '/images/rebase-suite.webp', shortDesc: 'Advanced skin treatments' },
  'Ozone Therapy': { image: '/images/rebase-suite.webp', shortDesc: 'Oxygen-ozone healing' },
};

// Window in minutes after the user's booking ends — only surface upsells
// that start within this many minutes so they're still on site.
const UPSELL_WINDOW_MINUTES = 60;

interface UpsellSuggestionsProps {
  currentServiceTitle: string;
  onSelectUpsell: (serviceName: string) => void;
  /** ISO end time of the user's currently selected booking. Required to surface upsells. */
  referenceEndDateTime: string | null;
  /** Kept for backwards-compat; ignored. */
  addedServices?: string[];
  /** Kept for backwards-compat; ignored. */
  successMode?: boolean;
}

interface UpsellCardProps {
  name: string;
  serviceId: string | null;
  referenceEnd: Date;
  onSelect: (name: string) => void;
}

const UpsellCard = ({ name, serviceId, referenceEnd, onSelect }: UpsellCardProps) => {
  const dateKey = studioDateKeyFromCalendar(referenceEnd);

  const { data, isLoading } = useMindbodyAvailability({
    sessionTypeId: serviceId ?? '',
    startDate: dateKey,
    endDate: dateKey,
    enabled: !!serviceId,
  });

  const nextSlot = useMemo(() => {
    if (!data?.availableItems?.length) return null;
    const windowEnd = new Date(referenceEnd.getTime() + UPSELL_WINDOW_MINUTES * 60 * 1000);
    const candidates = data.availableItems
      .map((slot) => ({ slot, start: parseMindbodyDateTime(slot.startDateTime) }))
      .filter(({ start }) => start >= referenceEnd && start <= windowEnd)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
    return candidates[0] ?? null;
  }, [data, referenceEnd]);

  if (isLoading) return null;
  if (!nextSlot) return null;

  const info = serviceInfo[name];
  if (!info) return null;

  return (
    <button
      onClick={() => onSelect(name)}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left group',
        'border-border hover:border-primary/40 hover:bg-primary/5',
      )}
    >
      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
        <img src={info.image} alt={name} className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">{name}</div>
        <div className="text-xs text-muted-foreground">
          Right after your session — {formatMindbodyTime(nextSlot.slot.startDateTime)}
        </div>
      </div>
      <div className="shrink-0 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
        Book next
      </div>
    </button>
  );
};

// Resolve an upsell group name → a representative Mindbody sessionTypeId.
// Skips contact-only and class-only services since those can't be booked
// instantly via the same availability flow.
function resolveServiceId(
  upsellName: string,
  services: MindbodyService[] | undefined,
): string | null {
  if (!services?.length) return null;
  if (contactOnlyGroups.has(upsellName)) return null;
  if (classDescriptionIdMap[upsellName]) return null;

  for (const s of services) {
    const { baseName } = extractDurationFromName(s.name);
    if (canonicalizeServiceName(baseName) === upsellName) {
      return s.id;
    }
  }
  return null;
}

const UpsellSuggestions = ({
  currentServiceTitle,
  onSelectUpsell,
  referenceEndDateTime,
}: UpsellSuggestionsProps) => {
  const { data: services } = useMindbodyServices();

  const referenceEnd = useMemo(
    () => (referenceEndDateTime ? parseMindbodyDateTime(referenceEndDateTime) : null),
    [referenceEndDateTime],
  );

  const candidates = useMemo(() => {
    const names = upsellMap[currentServiceTitle]?.slice(0, 2) || [];
    return names
      .map((name) => ({ name, serviceId: resolveServiceId(name, services) }))
      .filter((c) => c.serviceId !== null);
  }, [currentServiceTitle, services]);

  if (!referenceEnd || candidates.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      className="space-y-2.5"
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Stay & enhance your visit
      </p>
      <div className="space-y-2">
        {candidates.map(({ name, serviceId }) => (
          <UpsellCard
            key={name}
            name={name}
            serviceId={serviceId}
            referenceEnd={referenceEnd}
            onSelect={onSelectUpsell}
          />
        ))}
      </div>
    </motion.div>
  );
};

export { upsellMap, serviceInfo };
export default UpsellSuggestions;
