import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, ChevronRight, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useMindbodyServices } from '@/hooks/useMindbodyServices';
import { useMyBookings } from '@/hooks/useMindbodyBookings';
import { useHiddenServices } from '@/hooks/useHiddenServices';
import Logo from '@/components/Logo';
import { BookingServiceData } from '@/components/booking/BookingDrawer';
import {
  serviceImages,
  categoryImages,
  staticWebsiteCatalogue,
} from '@/config/serviceConfig';

interface HomePageProps {
  onNavigate: (tab: 'home' | 'services' | 'bookings' | 'account') => void;
  onSelectService: (service: BookingServiceData) => void;
}

// Popular service groups (Communal Contrast booked via class schedule)
const POPULAR_GROUPS = ['Infrared Suite', 'Cryotherapy', 'Hyperbaric Oxygen'];

const groupingPatterns: { pattern: RegExp; groupName: string }[] = [
  { pattern: /^infrared\s*sauna/i, groupName: 'Infrared Suite' },
  { pattern: /cryo(therapy)?/i, groupName: 'Cryotherapy' },
  { pattern: /^hyperbaric\s*oxygen/i, groupName: 'Hyperbaric Oxygen' },
];

const HomePage = ({ onNavigate, onSelectService }: HomePageProps) => {
  const { mbSession, isAuthenticated } = useAuth();
  const { data: services } = useMindbodyServices();
  const { data: hiddenServices = [] } = useHiddenServices();
  const { data: bookingsData } = useMyBookings();

  const hiddenIds = useMemo(() => new Set(hiddenServices.map(h => h.service_id)), [hiddenServices]);

  // Build a lookup from service_id to service info
  const serviceInfoMap = useMemo(() => {
    if (!services) return new Map<string, { name: string; image: string; price: number | null; duration: number | null; category: string; description: string }>();
    const map = new Map();
    for (const s of services) {
      if (!hiddenIds.has(s.id)) {
        const cat = s.programName || s.category || 'Wellness';
        map.set(s.id, {
          name: s.name,
          image: serviceImages[s.name] || categoryImages[cat] || categoryImages['default'],
          price: s.price,
          duration: s.defaultTimeLength,
          category: cat,
          description: s.onlineDescription || s.description || '',
        });
      }
    }
    return map;
  }, [services, hiddenIds]);

  // Next upcoming booking
  const nextBooking = useMemo(() => {
    if (!bookingsData?.bookings) return null;
    const now = new Date();
    const upcoming = bookingsData.bookings
      .filter((b: any) => new Date(b.startDateTime) >= now)
      .sort((a: any, b: any) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
    return upcoming[0] || null;
  }, [bookingsData]);

  // Popular services: seed from the static catalogue so cards render instantly,
  // then merge live Mindbody variants/prices/descriptions when they arrive.
  const popularServices = useMemo(() => {
    const result: { groupName: string; name: string; image: string; price: number | null; duration: number | null; category: string; description: string; variants: { id: string; name: string; duration: number | null; price: number | null }[] }[] = [];

    for (const groupName of POPULAR_GROUPS) {
      const pattern = groupingPatterns.find(p => p.groupName === groupName);
      if (!pattern) continue;

      const staticEntry = staticWebsiteCatalogue.find(e => e.baseName === groupName);
      const matches = services
        ? services.filter(s => !hiddenIds.has(s.id) && pattern.pattern.test(s.name))
        : [];

      const first = matches[0];
      const cat = first?.programName || first?.category || staticEntry?.category || 'Wellness';
      const variants = matches.map(m => ({ id: m.id, name: m.name, duration: m.defaultTimeLength, price: m.price }));
      const livePrices = variants.map(v => v.price).filter((p): p is number => p !== null && p > 0);
      const fromPrice = livePrices.length ? Math.min(...livePrices) : staticEntry?.fromPrice ?? null;

      result.push({
        groupName,
        name: groupName,
        image: serviceImages[groupName] || (first ? serviceImages[first.name] : undefined) || staticEntry?.image || categoryImages[cat] || categoryImages['default'],
        price: fromPrice,
        duration: first?.defaultTimeLength ?? null,
        category: cat,
        description: first?.onlineDescription || first?.description || staticEntry?.shortDescription || '',
        variants,
      });
    }
    return result;
  }, [services, hiddenIds]);

  const handleBookService = (service: typeof popularServices[number]) => {
    onSelectService({
      title: service.name,
      description: service.description,
      category: service.category,
      image: service.image,
      variants: service.variants,
    });
  };

  const greeting = isAuthenticated && mbSession?.firstName
    ? `Hi, ${mbSession.firstName}`
    : 'Welcome to Rebase';

  return (
    <div className="px-4 pt-2 pb-2 space-y-2 max-w-lg mx-auto">
      {/* Logo */}
      <div className="flex justify-center">
        <Logo className="h-16 w-auto opacity-80" />
      </div>

      {/* Divider */}
      <div className="h-px bg-black/10 mx-2" />

      {/* My Bookings / Next Appointment */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        {nextBooking ? (
          <Card
            className="cursor-pointer border border-white/[0.04] bg-white/[0.04] backdrop-blur-2xl active:shadow-champagne-strong active:border-champagne/25 transition-all"
            onClick={() => onNavigate('bookings')}
          >
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Next Appointment
              </p>
              <h3 className="font-semibold text-foreground">{nextBooking.serviceName}</h3>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(nextBooking.startDateTime), 'EEE, MMM d')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {format(new Date(nextBooking.startDateTime), 'h:mm a')}
                </span>
                {nextBooking.locationName && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {nextBooking.locationName}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card
            className="cursor-pointer border border-black/[0.06] bg-black/[0.03] backdrop-blur-2xl active:shadow-champagne-strong active:border-champagne/15 transition-all"
            onClick={() => onNavigate('services')}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-black/40 uppercase tracking-wider">
                  My Bookings
                </p>
                <p className="text-sm text-black/70 mt-1">No sessions scheduled</p>
                <p className="text-[11px] text-black/35 mt-0.5">Book a moment of restoration</p>
              </div>
              <Button variant="outline" size="sm" className="shrink-0 border-black/10 text-black/50 hover:bg-black/5 bg-transparent">
                Book
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Divider */}
      <div className="h-px bg-black/10 mx-2" />

      {/* Popular Services */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-medium text-black/40 uppercase tracking-wider">
            Popular
          </p>
          <button
            onClick={() => onNavigate('services')}
            className="text-xs text-black/50 flex items-center gap-1 hover:underline"
          >
            View all <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        <div className="space-y-3">
          {popularServices.map((service, index) => (
              <motion.div
                key={service.groupName}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.08 }}
              >
                <button
                  onClick={() => handleBookService(service)}
                  className="w-full text-left group"
                >
                  <div className="relative h-[18vh] rounded-lg overflow-hidden border border-white/[0.04] active:border-champagne/25 active:shadow-champagne-strong transition-all">
                    <img
                      src={service.image}
                      alt={service.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
                    {/* Title only – lower left */}
                    <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                      <h3 className="font-medium text-[#F9ECD9] text-base">
                        {service.name}
                      </h3>
                    </div>
                  </div>
                </button>
              </motion.div>
          ))}
        </div>

      </motion.div>
    </div>
  );
};

export default HomePage;
