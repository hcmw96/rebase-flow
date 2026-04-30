import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  'Midday Reset': ['Massage', 'Cryotherapy', 'IV Drip'],
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
  addedServices?: string[];
  /** When true, shows "Book Next" buttons for added services (success screen mode) */
  successMode?: boolean;
  /** ISO end time of the user's currently selected booking. Required to surface upsells. */
  referenceEndDateTime: string | null;
}

interface UpsellCardProps {
  name: string;
  serviceId: string | null;
  referenceEnd: Date;
  isAdded: boolean;
  successMode: boolean;
  onSelect: (name: string) => void;
}

const UpsellCard = ({
  name,
  serviceId,
  referenceEnd,
  isAdded,
  successMode,
  onSelect,
}: UpsellCardProps) => {
  const dateKey = format(referenceEnd, 'yyyy-MM-dd');

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
      .map((slot) => ({ slot, start: new Date(slot.startDateTime) }))
      .filter(({ start }) => start >= referenceEnd && start <= windowEnd)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
    return candidates[0] ?? null;
  }, [data, referenceEnd]);

  // While loading we don't know yet — render nothing to avoid flicker / fake info.
  if (isLoading) return null;
  // No real bookable slot in the window → hide entirely.
  if (!nextSlot) return null;

  const info = serviceInfo[name];
  if (!info) return null;

  return (
    <button
      onClick={() => onSelect(name)}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left group',
        isAdded && !successMode
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/40 hover:bg-primary/5'
      )}
    >
      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
        <img src={info.image} alt={name} className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">{name}</div>
        <div className="text-xs text-muted-foreground">
          Right after your session — {format(nextSlot.start, 'h:mm a')}
        </div>
      </div>
      {successMode ? (
        <div className="shrink-0 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
          Book
        </div>
      ) : (
        <div
          className={cn(
            'shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors',
            isAdded ? 'bg-primary' : 'bg-secondary group-hover:bg-primary/10'
          )}
        >
          {isAdded ? (
            <Check className="h-3.5 w-3.5 text-primary-foreground" />
          ) : (
            <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          )}
        </div>
      )}
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
  addedServices = [],
  successMode = false,
  referenceEndDateTime,
}: UpsellSuggestionsProps) => {
  const { data: services } = useMindbodyServices();

  const referenceEnd = useMemo(
    () => (referenceEndDateTime ? new Date(referenceEndDateTime) : null),
    [referenceEndDateTime],
  );

  const candidates = useMemo(() => {
    const names = upsellMap[currentServiceTitle]?.slice(0, 2) || [];
    return names
      .map((name) => ({ name, serviceId: resolveServiceId(name, services) }))
      .filter((c) => c.serviceId !== null);
  }, [currentServiceTitle, services]);

  // Need a reference end time and at least one resolvable candidate.
  if (!referenceEnd || candidates.length === 0) return null;

  // In success mode, only surface upsells the user already added.
  const visible = successMode
    ? candidates.filter((c) => addedServices.includes(c.name))
    : candidates;
  if (visible.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      className="space-y-2.5"
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {successMode ? 'Continue booking' : 'Stay & enhance your visit'}
      </p>
      <div className="space-y-2">
        {visible.map(({ name, serviceId }) => (
          <UpsellCard
            key={name}
            name={name}
            serviceId={serviceId}
            referenceEnd={referenceEnd}
            isAdded={addedServices.includes(name)}
            successMode={successMode}
            onSelect={onSelectUpsell}
          />
        ))}
      </div>
    </motion.div>
  );
};

export { upsellMap, serviceInfo };
export default UpsellSuggestions;
