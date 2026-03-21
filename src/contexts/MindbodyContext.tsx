import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface MindbodySession {
  sessionId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  expiresAt: string;
}

interface MindbodyContextType {
  mbSession: MindbodySession | null;
  isMindbodyLinked: boolean;
  isLinking: boolean;
  linkMindbody: () => void;
  unlinkMindbody: () => Promise<void>;
}

const MindbodyContext = createContext<MindbodyContextType | undefined>(undefined);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const MB_STORAGE_KEY = 'mb_session';

export function MindbodyProvider({ children }: { children: ReactNode }) {
  const { profile, refreshProfile, isAuthenticated } = useAuth();
  const [mbSession, setMbSession] = useState<MindbodySession | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  // Load MB session from localStorage if profile has mb_session_id
  useEffect(() => {
    if (profile?.mb_session_id) {
      const stored = localStorage.getItem(MB_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as MindbodySession;
          if (parsed.sessionId === profile.mb_session_id) {
            setMbSession(parsed);
          }
        } catch {
          // ignore
        }
      }
    } else {
      setMbSession(null);
    }
  }, [profile?.mb_session_id]);

  const linkMindbody = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLinking(true);

    try {
      // Call the edge function to get the Mindbody auth URL (redirect URI is server-determined)
      const res = await fetch(`${SUPABASE_URL}/functions/v1/mindbody-oauth-init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (!res.ok || !data.authUrl) {
        throw new Error(data.error || 'Failed to get Mindbody login URL');
      }

      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        data.authUrl,
        'rebase-mb-link',
        `width=${width},height=${height},left=${left},top=${top},popup=yes`
      );

    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'rebase-oauth-callback' && event.data.session) {
        const mbData = event.data.session as MindbodySession;

        // Save locally
        localStorage.setItem(MB_STORAGE_KEY, JSON.stringify(mbData));
        setMbSession(mbData);

        // Link to profile
        await supabase
          .from('profiles')
          .update({ mb_session_id: mbData.sessionId } as any)
          .eq('id', profile!.id);

        await refreshProfile();
        setIsLinking(false);
        popup?.close();
        window.removeEventListener('message', handleMessage);
      }
    };

    window.addEventListener('message', handleMessage);

    // Fallback: if popup closed without linking
    const check = setInterval(() => {
      if (popup?.closed) {
        clearInterval(check);
        setIsLinking(false);
        window.removeEventListener('message', handleMessage);
      }
    }, 500);
    } catch (error) {
      console.error('Mindbody link error:', error);
      setIsLinking(false);
    }
  }, [isAuthenticated, profile, refreshProfile]);

  const unlinkMindbody = useCallback(async () => {
    localStorage.removeItem(MB_STORAGE_KEY);
    setMbSession(null);

    if (profile) {
      await supabase
        .from('profiles')
        .update({ mb_session_id: null } as any)
        .eq('id', profile.id);
      await refreshProfile();
    }
  }, [profile, refreshProfile]);

  return (
    <MindbodyContext.Provider
      value={{
        mbSession,
        isMindbodyLinked: !!profile?.mb_session_id,
        isLinking,
        linkMindbody,
        unlinkMindbody,
      }}
    >
      {children}
    </MindbodyContext.Provider>
  );
}

export function useMindbody() {
  const context = useContext(MindbodyContext);
  if (context === undefined) {
    throw new Error('useMindbody must be used within a MindbodyProvider');
  }
  return context;
}
