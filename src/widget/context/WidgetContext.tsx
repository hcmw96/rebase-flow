import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface WidgetConfig {
  theme: 'dark' | 'light';
  apiUrl: string;
  showBooking: boolean;
  category: string | null;
}

export interface ServiceVariant {
  id: string;
  name: string;
  duration: number | null;
  price: number | null;
  description?: string;
  contactOnly?: boolean;
  isPack?: boolean;
  packSessionCount?: number | null;
}

export interface GroupedService {
  baseName: string;
  description: string;
  category: string;
  image: string;
  variants: ServiceVariant[];
}

export interface WidgetSession {
  sessionId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface WidgetContextValue {
  config: WidgetConfig;
  session: WidgetSession | null;
  isAuthenticated: boolean;
  setSession: (session: WidgetSession | null) => void;
  login: () => void;
  logout: () => void;
}

const WidgetContext = createContext<WidgetContextValue | null>(null);

export function useWidget() {
  const context = useContext(WidgetContext);
  if (!context) {
    throw new Error('useWidget must be used within a WidgetProvider');
  }
  return context;
}

interface WidgetProviderProps {
  config: WidgetConfig;
  children: ReactNode;
}

const STORAGE_KEY = 'rebase-widget-session';

export function WidgetProvider({ config, children }: WidgetProviderProps) {
  const [session, setSessionState] = useState<WidgetSession | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setSession = useCallback((newSession: WidgetSession | null) => {
    setSessionState(newSession);
    if (newSession) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const login = useCallback(() => {
    // Open OAuth popup for Mindbody login
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const redirectUri = encodeURIComponent(window.location.origin + '/widget-oauth-callback');
    const authUrl = `${config.apiUrl}/functions/v1/mindbody-oauth-init?redirect_uri=${redirectUri}`;
    
    const popup = window.open(
      authUrl,
      'rebase-login',
      `width=${width},height=${height},left=${left},top=${top},popup=yes`
    );

    // Listen for OAuth callback via postMessage
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'rebase-oauth-callback') {
        if (event.data.session) {
          setSession(event.data.session);
        }
        popup?.close();
        window.removeEventListener('message', handleMessage);
      }
    };
    
    window.addEventListener('message', handleMessage);
  }, [config.apiUrl, setSession]);

  const logout = useCallback(() => {
    setSession(null);
  }, [setSession]);

  const value: WidgetContextValue = {
    config,
    session,
    isAuthenticated: !!session,
    setSession,
    login,
    logout,
  };

  return (
    <WidgetContext.Provider value={value}>
      {children}
    </WidgetContext.Provider>
  );
}
