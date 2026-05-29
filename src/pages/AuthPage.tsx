import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import BackgroundVideo from '@/components/BackgroundVideo';

const AuthPage = () => {
  const { login, authError, isRedirecting } = useAuth();

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <BackgroundVideo overlayClassName="bg-black/50" />

      {/* Auth Form */}
      <div className="relative z-10 w-full px-6 max-w-sm mx-auto flex flex-col items-center justify-center min-h-[70vh]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full space-y-8 text-center"
        >
          <div className="flex flex-col items-center space-y-3">
            <Logo className="h-14 w-auto opacity-80" invert={false} />
            <p className="text-sm text-white/50">Sign in to book and manage your sessions</p>
          </div>

          {authError && (
            <p className="text-sm text-red-300/90 bg-red-950/40 border border-red-400/20 rounded-lg px-3 py-2">
              Sign-in failed: {authError}
            </p>
          )}

          <Button
            onClick={login}
            disabled={isRedirecting}
            className="w-full bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm"
          >
            {isRedirecting ? 'Redirecting…' : 'Sign in with Mindbody'}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
