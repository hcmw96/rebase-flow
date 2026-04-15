import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';

const VIDEO_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/vids2/REBASE - HERO FILM - 03.01.mp4`;

const AuthPage = () => {
  const { login } = useAuth();

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          controls={false}
          webkit-playsinline="true"
          x-webkit-airplay="deny"
          disablePictureInPicture
          className="w-full h-full object-cover"
          style={{ pointerEvents: 'none' }}
          ref={(el) => {
            if (el) {
              el.setAttribute('playsinline', '');
              el.setAttribute('webkit-playsinline', '');
              el.play().catch(() => {});
            }
          }}
          onLoadedMetadata={(e) => { e.currentTarget.currentTime = 2; }}
          onTimeUpdate={(e) => {
            const vid = e.currentTarget;
            if (vid.duration && vid.currentTime >= vid.duration - 5) {
              vid.currentTime = 2;
            }
          }}
        >
          <source src={VIDEO_URL} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/50" />
      </div>

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

          <Button
            onClick={login}
            className="w-full bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm"
          >
            Sign in with Mindbody
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
