import { useState } from 'react';
import SignIn from '@/pages/SignIn';
import SignUp from '@/pages/SignUp';

const VIDEO_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/vids/REBASE - CHAPTER ONE - 03.01.mov`;

const AuthPage = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          onLoadedMetadata={(e) => { e.currentTarget.currentTime = 3; }}
          onTimeUpdate={(e) => {
            const vid = e.currentTarget;
            if (vid.duration && vid.currentTime >= vid.duration - 5) {
              vid.currentTime = 3;
            }
          }}
        >
          <source src={VIDEO_URL} type="video/quicktime" />
          <source src={VIDEO_URL} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Auth Form */}
      <div className="relative z-10 w-full">
        {mode === 'signin' ? (
          <SignIn onSwitchToSignUp={() => setMode('signup')} />
        ) : (
          <SignUp onSwitchToSignIn={() => setMode('signin')} />
        )}
      </div>
    </div>
  );
};

export default AuthPage;
