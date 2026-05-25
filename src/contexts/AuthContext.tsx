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

function parseHashPayload<T>(hash: string, key: string): T | null {
  const marker = `#${key}=`;
  if (!hash.includes(marker)) return null;
  try {
    const encoded = hash.split(marker)[1]?.split('&')[0] ?? '';
    return JSON.parse(atob(decodeURIComponent(encoded))) as T;
  } catch (e) {
    console.error(`Failed to parse ${key} from URL hash:`, e);
    return null;
  }
}

function persistSession(session: MindbodySession) {
  localStorage.setItem(MB_STORAGE_KEY, JSON.stringify(session));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [mbSession, setMbSession] = useState<MindbodySession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // OAuth return: #auth-session= or #auth-error= in hash (native full-page or web popup)
  useEffect(() => {
    const hash = window.location.hash;
    const appOrigin = window.location.origin;

    const authError = parseHashPayload<{ error?: string }>(hash, 'auth-error');
    if (authError?.error) {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          { type: 'rebase-oauth-callback', error: authError.error },
          appOrigin
        );
        window.close();
      } else {
        console.error('Mindbody sign-in failed:', authError.error);
      }
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      setIsLoading(false);
      return;
    }

    const decoded = parseHashPayload<MindbodySession>(hash, 'auth-session');
    if (decoded?.sessionId) {
      const session: MindbodySession = {
        sessionId: decoded.sessionId,
        email: decoded.email ?? null,
        firstName: decoded.firstName ?? null,
        lastName: decoded.lastName ?? null,
        expiresAt: decoded.expiresAt,
      };

      // Web popup: opener receives session via postMessage (same-origin, reliable)
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'rebase-oauth-callback', session }, appOrigin);
        window.close();
        setIsLoading(false);
        return;
      }

      persistSession(session);
      setMbSession(session);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
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
        if (event.origin !== window.location.origin) return;
        if (event.data?.type !== 'rebase-oauth-callback') return;

        if (event.data.error) {
          console.error('Mindbody sign-in failed:', event.data.error);
          setIsRedirecting(false);
          popup?.close();
          window.removeEventListener('message', handleMessage);
          return;
        }

        if (event.data.session) {
          const session = event.data.session as MindbodySession;
          persistSession(session);
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
