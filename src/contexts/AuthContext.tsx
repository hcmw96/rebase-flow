import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import despia from 'despia-native';

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
  authError: string | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const MB_STORAGE_KEY = 'mb_session';

/** Marketing / web routes (not the native shell at `/`). */
const WEBSITE_PATH_PREFIXES = [
  '/website',
  '/account',
  '/membership',
  '/members',
  '/contact',
  '/experiences',
  '/faq',
  '/privacy-policy',
  '/terms',
  '/cookie-policy',
] as const;

function isWebsitePath(pathname: string): boolean {
  return WEBSITE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Where Mindbody should send the user after OAuth (path + query, same origin). */
function getOAuthReturnTo(): string {
  const { pathname, search } = window.location;
  const pathWithSearch = `${pathname}${search}`;
  const isNativeApp = navigator.userAgent.includes('despia');

  if (isNativeApp) {
    return pathWithSearch || '/';
  }

  // Web: `/` is the native shell; signed-in users should land on the public site.
  if (pathname === '/' || pathname === '') {
    return '/website';
  }

  if (isWebsitePath(pathname)) {
    return pathWithSearch;
  }

  return '/website';
}

function decodeHashPayload<T>(encoded: string): T | null {
  try {
    const binary = atob(decodeURIComponent(encoded));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch {
    return null;
  }
}

function parseHashPayload<T>(hash: string, key: string): T | null {
  const marker = `#${key}=`;
  if (!hash.includes(marker)) return null;
  const encoded = hash.split(marker)[1]?.split('&')[0] ?? '';
  const decoded = decodeHashPayload<T>(encoded);
  if (!decoded) {
    console.error(`Failed to parse ${key} from URL hash`);
  }
  return decoded;
}

function persistSession(session: MindbodySession) {
  localStorage.setItem(MB_STORAGE_KEY, JSON.stringify(session));
}

function isValidMindbodySession(value: unknown): value is MindbodySession {
  if (!value || typeof value !== 'object') return false;
  const session = value as Record<string, unknown>;
  const optionalStringOrNull = (field: unknown) =>
    field === null || typeof field === 'string' || typeof field === 'undefined';

  return (
    typeof session.sessionId === 'string' &&
    session.sessionId.length > 0 &&
    typeof session.expiresAt === 'string' &&
    session.expiresAt.length > 0 &&
    optionalStringOrNull(session.email) &&
    optionalStringOrNull(session.firstName) &&
    optionalStringOrNull(session.lastName)
  );
}

function registerNativePush(session: MindbodySession) {
  const isNative = navigator.userAgent.includes('despia');
  if (isNative) {
    despia('registerpush://');
    if (session.email) {
      const userId = btoa(session.email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
      despia(`setonesignalplayerid://?user_id=${userId}`);
    }
  }
}

function isSessionExpired(expiresAt: string): boolean {
  const expires = Date.parse(expiresAt);
  return Number.isNaN(expires) || expires <= Date.now();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [mbSession, setMbSession] = useState<MindbodySession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // OAuth return: #auth-session= or #auth-error= in hash (native full-page or web popup)
  useEffect(() => {
    const hash = window.location.hash;
    const appOrigin = window.location.origin;

    const authErrorPayload = parseHashPayload<{ error?: string }>(hash, 'auth-error');
    if (authErrorPayload?.error) {
      setAuthError(authErrorPayload.error);
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          { type: 'rebase-oauth-callback', error: authErrorPayload.error },
          appOrigin
        );
        window.close();
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

      setAuthError(null);
      persistSession(session);
      setMbSession(session);
      registerNativePush(session);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      setIsLoading(false);
      return;
    }

    // Load session from localStorage
    const stored = localStorage.getItem(MB_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as MindbodySession;
        if (isSessionExpired(parsed.expiresAt)) {
          localStorage.removeItem(MB_STORAGE_KEY);
        } else {
          setMbSession(parsed);
          registerNativePush(parsed);
        }
      } catch {
        localStorage.removeItem(MB_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // Main window: receive session from OAuth popup via postMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'rebase-oauth-callback') return;

      const fromApp = event.origin === window.location.origin;
      const fromSupabase =
        typeof event.origin === 'string' && event.origin.endsWith('.supabase.co');
      if (!fromApp && !fromSupabase) return;

      if (event.data.error) {
        setAuthError(String(event.data.error));
        setIsRedirecting(false);
        return;
      }

      if (isValidMindbodySession(event.data.session)) {
        const session = event.data.session;
        setAuthError(null);
        persistSession(session);
        setMbSession(session);
        setIsRedirecting(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const login = useCallback(async () => {
    setAuthError(null);
    setIsRedirecting(true);
    try {
      const isNative = navigator.userAgent.includes('despia');

      const res = await fetch(`${SUPABASE_URL}/functions/v1/mindbody-oauth-init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          native: isNative,
          origin: window.location.origin,
          returnTo: getOAuthReturnTo(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.authUrl) {
        throw new Error(data.error || 'Failed to get login URL');
      }

      // Use full-page redirect for both native and web.
      // Popup OAuth can be blocked/blanked by browser cross-origin restrictions.
      window.location.href = data.authUrl;
      return;
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
        authError,
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
