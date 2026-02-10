import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useMindbody } from '@/contexts/MindbodyContext';
import { useMindbodyServices } from '@/hooks/useMindbodyServices';
import { useFeaturedServices } from '@/hooks/useFeaturedServices';
import { useMyBookings } from '@/hooks/useMindbodyBookings';
import { useHiddenServices } from '@/hooks/useHiddenServices';
import { Skeleton } from '@/components/ui/skeleton';

// Same image maps from Services page
const categoryImages: Record<string, string> = {
  'Recovery': '/images/rebase-hbot-new.png',
  'Wellness': '/images/rebase-ice-sauna.webp',
  'Classes': '/images/rebase-class.webp',
  'Private': '/images/rebase-private-suites.webp',
  'default': '/images/rebase-suite.webp',
};

const serviceImages: Record<string, string> = {
  'Cryotherapy': '/images/rebase-cryo.webp',
  'Infrared Sauna & Ice Bath': '/images/rebase-ice-sauna-new.webp',
};

interface HomePageProps {
  onNavigate: (tab: 'home' | 'services' | 'bookings' | 'account') => void;
}

const HomePage = ({ onNavigate }: HomePageProps) => {
  const navigate = useNavigate();
  const { session, isAuthenticated } = useMindbody();
  const { data: services } = useMindbodyServices();
  const { data: featuredServicesData = [] } = useFeaturedServices();
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

  // Featured services with resolved info
  const popularServices = useMemo(() => {
    return featuredServicesData
      .map(f => {
        const info = serviceInfoMap.get(f.service_id);
        if (!info) return null;
        return { ...f, ...info };
      })
      .filter(Boolean)
      .slice(0, 4);
  }, [featuredServicesData, serviceInfoMap]);

  const handleBookService = (serviceId: string, info: any) => {
    localStorage.setItem('selectedService', JSON.stringify({
      id: serviceId,
      title: info.name,
      description: info.description,
      category: info.category,
      image: info.image,
    }));
    navigate(`/book/${serviceId}`);
  };

  const greeting = isAuthenticated && session?.firstName
    ? `Hi, ${session.firstName}`
    : 'Welcome to Rebase';

  return (
    <div className="px-4 pt-6 pb-4 space-y-6 max-w-lg mx-auto">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-light text-foreground">{greeting}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Book your next recovery session
        </p>
      </motion.div>

      {/* Next Appointment */}
      {nextBooking && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Next Appointment
          </p>
          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => onNavigate('bookings')}
          >
            <CardContent className="p-4 space-y-2">
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
        </motion.div>
      )}

      {/* Popular Services */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Popular
          </p>
          <button
            onClick={() => onNavigate('services')}
            className="text-xs text-primary flex items-center gap-1 hover:underline"
          >
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {popularServices.length === 0 ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : (
          <div className="space-y-3">
            {popularServices.map((service: any, index: number) => (
              <motion.div
                key={service.service_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + index * 0.08 }}
              >
                <button
                  onClick={() => handleBookService(service.service_id, service)}
                  className="w-full text-left group"
                >
                  <div className="relative h-32 rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all">
                    <img
                      src={service.image}
                      alt={service.service_name || service.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground text-base">
                          {service.service_name || service.name}
                        </h3>
                        {service.duration && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {service.duration} min
                          </p>
                        )}
                      </div>
                      {service.price != null && service.price > 0 && (
                        <span className="text-sm font-semibold text-foreground">
                          From £{service.price}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Browse All CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          variant="outline"
          className="w-full"
          onClick={() => onNavigate('services')}
        >
          Browse All Services
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
};

export default HomePage;
