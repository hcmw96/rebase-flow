import { useState } from 'react';
import { Home, Search, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import HomePage from '@/pages/HomePage';
import Services from '@/pages/Services';
import MyBookings from '@/pages/MyBookings';
import AccountPage from '@/pages/AccountPage';

type Tab = 'home' | 'services' | 'bookings' | 'account';

const tabs: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'services', label: 'Services', icon: Search },
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'account', label: 'Account', icon: User },
];

const AppShell = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage onNavigate={setActiveTab} />;
      case 'services':
        return <Services />;
      case 'bookings':
        return <MyBookings />;
      case 'account':
        return <AccountPage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Content area */}
      <main className="flex-1 pb-[calc(64px+env(safe-area-inset-bottom,0px))] overflow-y-auto">
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

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md">
        <div className="flex items-stretch" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center py-2 pt-3 gap-0.5 transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.5} />
                <span className={cn('text-[10px]', isActive && 'font-semibold')}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppShell;
