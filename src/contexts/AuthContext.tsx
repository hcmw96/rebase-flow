import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import despia from 'despia-native';
import { toast } from 'sonner';
import {
  type MindbodySession,
  readOAuthReturnFromUrl,
  clearOAuthParamsFromUrl,
} from '@/lib/oauthReturn';
import { APP_HOME, WEBSITE_HOME } from '@/lib/routes';
import { resolveMindbodySignUpUrl } from '@/lib/mindbodyAuth';
import { clearSessionNeedsPaymentCard } from '@/lib/paymentCardSetupStorage';
import { supabaseFunctionHeaders } from '@/lib/supabaseFunctions';

export type { MindbodySession };

interface AuthContextType {
  mbSession: MindbodySession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRedirecting: boolean;
  authError: string | null;
  /** Full-page Mindbody OAuth. Pass `clearSession` when replacing an expired token. */
  login: (options?: { clearSession?: boolean }) => void;
  /** Branded-web URL where new clients create a Mindbody login for this studio. */
  mindbodySignUpUrl: string;
  /** Open Mindbody account creation (same tab). */
  openMindbodySignUp: () => void;
  logout: () => void;
  refreshMbSession: () => Promise<MindbodySession | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const MB_STORAGE_KEY = 'mb_session';

/** Marketing / web routes (not the member app at `/app`). */
const WEBSITE_PATH_PREFIXES = [
  '/account',
  '/sign-in',
  '/membership',
  '/contact',
  '/experiences',
  '/faq',
  '/privacy-policy',
  '/terms',
  '/cookie-policy',
] as const;

function isWebsitePath(pathname: string): boolean {
  if (pathname === WEBSITE_HOME) return true;
  return WEBSITE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isAppPath(pathname: string): boolean {
  return pathname === APP_HOME || pathname.startsWith(`${APP_HOME}/`);
}

/** Where Mindbody should send the user after OAuth (path + query, same origin). */
function getOAuthReturnTo(): string {
  const { pathname, search } = window.location;
  const pathWithSearch = `${pathname}${search}`;
  const isNativeApp = navigator.userAgent.includes('despia');

  if (isNativeApp) {
    return pathWithSearch || APP_HOME;
  }

  if (isAppPath(pathname)) {
    return pathWithSearch;
  }

  if (isWebsitePath(pathname)) {
    return pathWithSearch;
  }

  return WEBSITE_HOME;
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

/** Match server-side booking buffer so we do not show signed-in with a dead token. */
const SESSION_EXPIRY_BUFFER_MS = 2 * 60 * 1000;

function isSessionExpired(expiresAt: string): boolean {
  const expires = Date.parse(expiresAt);
  return Number.isNaN(expires) || expires - SESSION_EXPIRY_BUFFER_MS <= Date.now();
}

async function fetchServerSession(sessionId: string): Promise<MindbodySession | null> {
  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/mindbody-session-status?sessionId=${encodeURIComponent(sessionId)}`,
    { headers: supabaseFunctionHeaders() },
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.valid || !data.session?.sessionId) return null;
  return {
    sessionId: data.session.sessionId,
    email: data.session.email ?? null,
    firstName: data.session.firstName ?? null,
    lastName: data.session.lastName ?? null,
    expiresAt: data.session.expiresAt,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [mbSession, setMbSession] = useState<MindbodySession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [mindbodySignUpUrl, setMindbodySignUpUrl] = useState<string>(() =>
    resolveMindbodySignUpUrl(),
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/mindbody-oauth-init`, {
          headers: supabaseFunctionHeaders(),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && typeof data.signUpUrl === 'string') {
          setMindbodySignUpUrl(data.signUpUrl);
        }
      } catch {
        /* keep env/default sign-up URL */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // OAuth return + restore session from storage (validated against server when online)
  useEffect(() => {
    let cancelled = false;

    const finish = () => {
      if (!cancelled) setIsLoading(false);
    };

    (async () => {
      const appOrigin = window.location.origin;
      const oauthReturn = readOAuthReturnFromUrl();

      if (oauthReturn?.kind === 'error') {
        setAuthError(oauthReturn.error);
        toast.error('Mindbody sign-in failed', { description: oauthReturn.error });
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(
            { type: 'rebase-oauth-callback', error: oauthReturn.error },
            appOrigin,
          );
          window.close();
        }
        clearOAuthParamsFromUrl();
        finish();
        return;
      }

      if (oauthReturn?.kind === 'session') {
        const session = oauthReturn.session;

        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({ type: 'rebase-oauth-callback', session }, appOrigin);
          window.close();
          finish();
          return;
        }

        setAuthError(null);
        persistSession(session);
        setMbSession(session);
        registerNativePush(session);
        clearOAuthParamsFromUrl();
        finish();
        return;
      }

      const stored = localStorage.getItem(MB_STORAGE_KEY);
      if (!stored) {
        finish();
        return;
      }

      try {
        const parsed = JSON.parse(stored) as MindbodySession;
        if (isSessionExpired(parsed.expiresAt)) {
          localStorage.removeItem(MB_STORAGE_KEY);
          finish();
          return;
        }

        let serverSession: MindbodySession | null = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          serverSession = await fetchServerSession(parsed.sessionId);
          if (serverSession) break;
          await new Promise((r) => setTimeout(r, 400));
        }
        if (cancelled) return;

        if (serverSession) {
          persistSession(serverSession);
          setMbSession(serverSession);
          registerNativePush(serverSession);
        } else if (!isSessionExpired(parsed.expiresAt)) {
          // Trust local session if server check is slow/unreachable (e.g. right after OAuth).
          setMbSession(parsed);
          registerNativePush(parsed);
        } else {
          localStorage.removeItem(MB_STORAGE_KEY);
        }
      } catch {
        try {
          const parsed = JSON.parse(stored) as MindbodySession;
          if (!isSessionExpired(parsed.expiresAt)) {
            setMbSession(parsed);
            registerNativePush(parsed);
          } else {
            localStorage.removeItem(MB_STORAGE_KEY);
          }
        } catch {
          localStorage.removeItem(MB_STORAGE_KEY);
        }
      }

      finish();
    })();

    return () => {
      cancelled = true;
    };
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

  const login = useCallback(async (options?: { clearSession?: boolean }) => {
    setAuthError(null);
    if (options?.clearSession) {
      localStorage.removeItem(MB_STORAGE_KEY);
      setMbSession(null);
    }
    setIsRedirecting(true);
    try {
      const isNative = navigator.userAgent.includes('despia');

      const res = await fetch(`${SUPABASE_URL}/functions/v1/mindbody-oauth-init`, {
        method: 'POST',
        headers: supabaseFunctionHeaders({ 'Content-Type': 'application/json' }),
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

      if (!isNative) {
        const popup = window.open(
          data.authUrl,
          'rebase-mindbody-oauth',
          'popup=yes,width=480,height=720,noopener,noreferrer',
        );
        if (popup) {
          const poll = window.setInterval(() => {
            if (popup.closed) {
              window.clearInterval(poll);
              setIsRedirecting(false);
            }
          }, 400);
          return;
        }
      }

      window.location.assign(data.authUrl);
      return;
    } catch (error) {
      console.error('Login error:', error);
      const message = error instanceof Error ? error.message : 'Please try again.';
      setAuthError(message);
      toast.error('Could not start sign-in', { description: message });
      setIsRedirecting(false);
    }
  }, []);

  const openMindbodySignUp = useCallback(() => {
    window.location.assign(mindbodySignUpUrl || resolveMindbodySignUpUrl());
  }, [mindbodySignUpUrl]);

  const logout = useCallback(() => {
    localStorage.removeItem(MB_STORAGE_KEY);
    clearSessionNeedsPaymentCard();
    setMbSession(null);
  }, []);

  const refreshMbSession = useCallback(async (): Promise<MindbodySession | null> => {
    const stored = localStorage.getItem(MB_STORAGE_KEY);
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored) as MindbodySession;
      await fetch(`${SUPABASE_URL}/functions/v1/mindbody-refresh-token`, {
        method: 'POST',
        headers: supabaseFunctionHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ sessionId: parsed.sessionId }),
      }).catch(() => undefined);

      const serverSession = await fetchServerSession(parsed.sessionId);
      if (serverSession) {
        persistSession(serverSession);
        setMbSession(serverSession);
        return serverSession;
      }
      if (!isSessionExpired(parsed.expiresAt)) {
        setMbSession(parsed);
        return parsed;
      }
      localStorage.removeItem(MB_STORAGE_KEY);
      setMbSession(null);
      return null;
    } catch {
      return null;
    }
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
        mindbodySignUpUrl,
        openMindbodySignUp,
        logout,
        refreshMbSession,
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
