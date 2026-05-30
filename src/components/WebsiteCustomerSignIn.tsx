import { Link } from 'react-router-dom';
import { ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const WebsiteCustomerSignIn = () => {
  const { login, authError, isRedirecting, openMindbodySignUp, mindbodySignUpUrl } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center max-w-md mx-auto">
      <div className="w-16 h-16 rounded-full bg-[#3B2712]/[0.06] flex items-center justify-center mb-6">
        <Calendar className="h-7 w-7 text-[#3B2712]/60" strokeWidth={1.25} />
      </div>
      <h1 className="text-3xl font-light text-[#3B2712] tracking-tight mb-3">Sign in to book</h1>
      <p className="text-sm text-[#3B2712]/60 mb-8 leading-relaxed">
        Use your Mindbody account to book sessions, view upcoming visits, and manage your bookings at
        Rebase.
      </p>

      {authError && (
        <p className="text-sm text-red-800/90 bg-red-100/80 border border-red-300/40 rounded-lg px-3 py-2 mb-4 w-full">
          {authError}
        </p>
      )}

      <div className="w-full space-y-3">
        <Button
          onClick={() => login()}
          disabled={isRedirecting}
          className="rounded-none px-8 h-11 w-full bg-[#3B2712] text-[#F9ECD9] hover:bg-[#3B2712]/90 tracking-[0.08em] text-[13px]"
        >
          {isRedirecting ? 'Redirecting to Mindbody…' : 'Sign in with Mindbody'}
          {!isRedirecting && <ChevronRight className="ml-1.5 h-3.5 w-3.5" />}
        </Button>
        {mindbodySignUpUrl && (
          <Button
            type="button"
            variant="outline"
            onClick={openMindbodySignUp}
            disabled={isRedirecting}
            className="rounded-none px-8 h-11 w-full border-[#3B2712]/25 text-[#3B2712] hover:bg-[#3B2712]/5 tracking-[0.08em] text-[13px]"
          >
            Create Mindbody account
          </Button>
        )}
      </div>

      {mindbodySignUpUrl && (
        <p className="mt-4 text-xs text-[#3B2712]/45 leading-relaxed">
          New to Rebase? Create your Mindbody account first, then return here to sign in and book.
        </p>
      )}

      <Link
        to="/experiences"
        className="mt-6 text-[12px] uppercase tracking-[0.18em] text-[#3B2712]/50 hover:text-[#3B2712] transition-colors"
      >
        Browse experiences →
      </Link>
    </div>
  );
};

export default WebsiteCustomerSignIn;
