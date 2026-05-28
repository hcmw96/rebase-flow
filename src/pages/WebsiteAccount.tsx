import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import AccountPage from '@/pages/AccountPage';
import WebsiteCustomerSignIn from '@/components/WebsiteCustomerSignIn';
import { Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://rebaselaunch.netlify.app';

const WebsiteAccount = () => {
  const { isAuthenticated, isLoading, isRedirecting } = useAuth();

  return (
    <div className="fixed inset-0 overflow-y-auto bg-[#F9ECD9]" style={{ overflowY: 'auto' }}>
      <Helmet>
        <title>Account | Rebase Recovery</title>
        <meta
          name="description"
          content="Sign in with Mindbody to book wellness sessions and view your bookings at Rebase Recovery."
        />
        <link rel="canonical" href={`${SITE_URL}/account`} />
      </Helmet>
      <Navigation />
      <main className="pt-24 pb-12 min-h-screen">
        {isLoading || isRedirecting ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#3B2712]/40" />
            <p className="text-sm text-[#3B2712]/50">
              {isRedirecting ? 'Connecting to Mindbody…' : 'Loading…'}
            </p>
          </div>
        ) : !isAuthenticated ? (
          <WebsiteCustomerSignIn />
        ) : (
          <AccountPage />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default WebsiteAccount;
