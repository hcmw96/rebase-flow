import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface MindbodySession {
  sessionId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  expiresAt: string;
}

interface MindbodyContextType {
  session: MindbodySession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (redirectUri: string) => Promise<void>;
  handleCallback: (code: string, redirectUri: string) => Promise<void>;
  logout: () => void;
}

const MindbodyContext = createContext<MindbodyContextType | undefined>(undefined);

const STORAGE_KEY = 'mb_session';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function MindbodyProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<MindbodySession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load session from localStorage on mount
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as MindbodySession;
        // Check if session is still valid
        if (new Date(parsed.expiresAt) > new Date()) {
          setSession(parsed);
        } else {
          // Try to refresh the token
          refreshSession(parsed.sessionId);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const refreshSession = async (sessionId: string) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/mindbody-refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        const data = await response.json();
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const updated = { ...JSON.parse(stored), expiresAt: data.expiresAt };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          setSession(updated);
        }
      } else {
        // Session expired, clear it
        localStorage.removeItem(STORAGE_KEY);
        setSession(null);
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
      localStorage.removeItem(STORAGE_KEY);
      setSession(null);
    }
  };

  const login = async (redirectUri: string) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/mindbody-oauth-init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirectUri }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize OAuth');
      }

      const { authUrl, state } = await response.json();
      
      // Store state for verification
      sessionStorage.setItem('mb_oauth_state', state);
      sessionStorage.setItem('mb_redirect_after_login', window.location.pathname);
      
      // Redirect to Mindbody login
      window.location.href = authUrl;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const handleCallback = async (code: string, redirectUri: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/mindbody-oauth-callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to complete authentication');
      }

      const sessionData = await response.json();
      const newSession: MindbodySession = {
        sessionId: sessionData.sessionId,
        email: sessionData.email,
        firstName: sessionData.firstName,
        lastName: sessionData.lastName,
        expiresAt: sessionData.expiresAt,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
      setSession(newSession);
      
      // Clear OAuth state
      sessionStorage.removeItem('mb_oauth_state');
    } catch (error) {
      console.error('Callback error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  };

  return (
    <MindbodyContext.Provider
      value={{
        session,
        isLoading,
        isAuthenticated: !!session,
        login,
        handleCallback,
        logout,
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
