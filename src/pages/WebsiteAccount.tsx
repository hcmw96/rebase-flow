import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import AccountPage from '@/pages/AccountPage';
import { Loader2 } from 'lucide-react';

const WebsiteAccount = () => {
  const { isAuthenticated, isLoading, login } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      login();
    }
  }, [isLoading, isAuthenticated, login]);

  return (
    <div className="fixed inset-0 overflow-y-auto bg-[#F9ECD9]" style={{ overflowY: 'auto' }}>
      <Navigation />
      <main className="pt-24 pb-12 min-h-screen">
        {isLoading || !isAuthenticated ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#3B2712]/40" />
            <p className="text-sm text-[#3B2712]/50">Signing you in...</p>
          </div>
        ) : (
          <AccountPage />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default WebsiteAccount;
