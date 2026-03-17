import { motion } from 'framer-motion';
import { Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface UpsellSuggestionsProps {
  currentServiceTitle: string;
  onSelectUpsell: (serviceName: string) => void;
  addedServices?: string[];
  /** When true, shows "Book Next" buttons for added services (success screen mode) */
  successMode?: boolean;
}

const UpsellSuggestions = ({ currentServiceTitle, onSelectUpsell, addedServices = [], successMode = false }: UpsellSuggestionsProps) => {
  const suggestions = upsellMap[currentServiceTitle]?.slice(0, 2) || [];

  if (suggestions.length === 0) return null;

  // In success mode, only show added services
  const displayItems = successMode ? suggestions.filter(s => addedServices.includes(s)) : suggestions;
  if (displayItems.length === 0 && successMode) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      className="space-y-2.5"
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {successMode ? 'Continue booking' : 'Enhance your visit'}
      </p>
      <div className="space-y-2">
        {displayItems.map((name) => {
          const info = serviceInfo[name];
          if (!info) return null;
          const isAdded = addedServices.includes(name);

          return (
            <button
              key={name}
              onClick={() => onSelectUpsell(name)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left group',
                isAdded && !successMode
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40 hover:bg-primary/5'
              )}
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                <img
                  src={info.image}
                  alt={name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{name}</div>
                <div className="text-xs text-muted-foreground">
                  {successMode ? 'Tap to book now' : info.shortDesc}
                </div>
              </div>
              {successMode ? (
                <div className="shrink-0 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
                  Book
                </div>
              ) : (
                <div className={cn(
                  'shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors',
                  isAdded
                    ? 'bg-primary'
                    : 'bg-secondary group-hover:bg-primary/10'
                )}>
                  {isAdded ? (
                    <Check className="h-3.5 w-3.5 text-primary-foreground" />
                  ) : (
                    <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};

export { upsellMap, serviceInfo };
export default UpsellSuggestions;
