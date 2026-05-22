import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface MindbodySession {
  sessionId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  expiresAt: string;
}

interface AuthContextType {
  mbSession: MindbodySession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRedirecting: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const MB_STORAGE_KEY = 'mb_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [mbSession, setMbSession] = useState<MindbodySession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Check URL hash for native OAuth redirect session on mount
  useEffect(() => {
    const hash = window.location.hash;

    if (hash.includes('#auth-session=')) {
      try {
        const encoded = hash.split('#auth-session=')[1];
        const decoded = JSON.parse(atob(decodeURIComponent(encoded)));
        const session: MindbodySession = {
          sessionId: decoded.sessionId,
          email: decoded.email,
          firstName: decoded.firstName,
          lastName: decoded.lastName,
          expiresAt: decoded.expiresAt,
        };
        localStorage.setItem(MB_STORAGE_KEY, JSON.stringify(session));
        setMbSession(session);
        // Clear the hash from the URL
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch (e) {
        console.error('Failed to parse auth session from hash:', e);
      }
      setIsLoading(false);
      return;
    }

    // Load session from localStorage
    const stored = localStorage.getItem(MB_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as MindbodySession;
        setMbSession(parsed);
      } catch {
        localStorage.removeItem(MB_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async () => {
    setIsRedirecting(true);
    try {
      const isNative = navigator.userAgent.includes('despia');

      const res = await fetch(`${SUPABASE_URL}/functions/v1/mindbody-oauth-init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          native: isNative,
          origin: window.location.origin,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.authUrl) {
        throw new Error(data.error || 'Failed to get login URL');
      }

      // Native: redirect the full page instead of popup
      if (isNative) {
        window.location.href = data.authUrl;
        return;
      }

      // Web: open popup
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        data.authUrl,
        'rebase-mb-login',
        `width=${width},height=${height},left=${left},top=${top},popup=yes`
      );

      // Hide redirect overlay once the popup is open — overlay was only needed for native full-page redirects.
      setIsRedirecting(false);

      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'rebase-oauth-callback' && event.data.session) {
          const session = event.data.session as MindbodySession;
          localStorage.setItem(MB_STORAGE_KEY, JSON.stringify(session));
          setMbSession(session);
          setIsRedirecting(false);
          popup?.close();
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);

      const check = setInterval(() => {
        if (popup?.closed) {
          clearInterval(check);
          setIsRedirecting(false);
          window.removeEventListener('message', handleMessage);
        }
      }, 500);
    } catch (error) {
      console.error('Login error:', error);
      setIsRedirecting(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(MB_STORAGE_KEY);
    setMbSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        mbSession,
        isAuthenticated: !!mbSession,
        isLoading,
        isRedirecting,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
