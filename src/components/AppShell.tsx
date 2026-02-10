import { useState, useCallback } from 'react';
import { Home, Search, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import HomePage from '@/pages/HomePage';
import Services from '@/pages/Services';
import MyBookings from '@/pages/MyBookings';
import AccountPage from '@/pages/AccountPage';
import BookingDrawer, { BookingServiceData } from '@/components/booking/BookingDrawer';

type Tab = 'home' | 'services' | 'bookings' | 'account';

const tabs: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'services', label: 'Services', icon: Search },
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'account', label: 'Account', icon: User },
];

const AppShell = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [bookingService, setBookingService] = useState<BookingServiceData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSelectService = useCallback((service: BookingServiceData) => {
    setBookingService(service);
    setDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage onNavigate={setActiveTab} onSelectService={handleSelectService} />;
      case 'services':
        return <Services onSelectService={handleSelectService} />;
      case 'bookings':
        return <MyBookings />;
      case 'account':
        return <AccountPage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Content area */}
      <main className="flex-1 pb-[calc(80px+env(safe-area-inset-bottom,0px))] overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Bottom Tab Bar */}
      <nav className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md">
        <div
          className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-2xl shadow-lg shadow-black/10"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="flex items-stretch">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors rounded-2xl',
                    isActive
                      ? 'text-warm-gray-light'
                      : 'text-warm-gray/60 hover:text-warm-gray-light'
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.5} />
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Booking Drawer */}
      <BookingDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        service={bookingService}
      />
    </div>
  );
};

export default AppShell;
