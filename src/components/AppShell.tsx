import { useState, useCallback } from 'react';
import { Home, Search, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import despia from 'despia-native';
import { useAuth } from '@/contexts/AuthContext';
import AuthPage from '@/pages/AuthPage';
import HomePage from '@/pages/HomePage';
import Services from '@/pages/Services';
import MyBookings from '@/pages/MyBookings';
import AccountPage from '@/pages/AccountPage';
import BookingDrawer, { BookingServiceData } from '@/components/booking/BookingDrawer';
import type { ClassBookingOptions } from '@/components/ClassSchedule';
import { useResumePendingBooking } from '@/hooks/useResumePendingBooking';
import type { PendingAppointmentState } from '@/lib/bookingResume';
import { clearPendingBooking } from '@/lib/bookingResume';

type Tab = 'home' | 'services' | 'bookings' | 'account';

const tabs: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'services', label: 'Services', icon: Search },
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'account', label: 'Account', icon: User },
];

const AppShell = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [bookingService, setBookingService] = useState<BookingServiceData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [resumeClassId, setResumeClassId] = useState<string | undefined>();
  const [resumeAppointment, setResumeAppointment] = useState<PendingAppointmentState | undefined>();

  useResumePendingBooking(
    useCallback((pending) => {
      setBookingService(pending.service);
      setResumeClassId(pending.selectedClassId);
      setResumeAppointment(pending.appointment);
      setDrawerOpen(true);
    }, []),
  );

  const handleSelectService = useCallback(
    (service: BookingServiceData, options?: ClassBookingOptions) => {
      setBookingService(service);
      setResumeClassId(options?.resumeClassId);
      setDrawerOpen(true);
    },
    [],
  );

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setResumeClassId(undefined);
    setResumeAppointment(undefined);
    clearPendingBooking();
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

  if (isLoading) {
    return (
      <div className="app-root">
        <div className="safe-area-top" />
        <main className="app-content flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
        </main>
      </div>
    );
  }

  // Auth is no longer required to browse — sign-in is triggered only when
  // the user attempts to book (handled inside BookingDrawer) or opens a personal tab.
  if (!isAuthenticated && (activeTab === 'account' || activeTab === 'bookings')) {
    return <AuthPage />;
  }

  return (
    <div className="app-root">
      {/* Safe area top spacer */}
      <div className="safe-area-top" />

      {/* Content area */}
      <main className="app-content pb-[calc(80px+var(--safe-area-bottom,env(safe-area-inset-bottom,0px)))]">
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
      <nav className="fixed bottom-0 left-4 right-4 z-50 mx-auto max-w-md" style={{ paddingBottom: 'var(--safe-area-bottom, env(safe-area-inset-bottom, 0px))' }}>
        <div
          className="rounded-2xl border border-white/[0.08] bg-black/60 backdrop-blur-2xl shadow-lg shadow-black/20 mb-2"
        >
          <div className="flex items-stretch">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (navigator.userAgent.includes('despia')) {
                      despia('lighthaptic://');
                    }
                  }}
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
        resumeClassId={resumeClassId}
        resumeAppointment={resumeAppointment}
        onSwitchService={(serviceName) => {
          setDrawerOpen(false);
          setTimeout(() => {
            setActiveTab('services');
          }, 300);
        }}
      />
    </div>
  );
};

export default AppShell;
