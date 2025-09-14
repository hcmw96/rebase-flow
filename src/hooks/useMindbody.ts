import { useState, useEffect, createContext, useContext } from 'react';
import { 
  authenticateUser, 
  getClientInfo, 
  createClient, 
  getServices, 
  getClasses, 
  getClientAppointments,
  MindbodyClient,
  MindbodyService,
  MindbodyClass,
  MindbodyAppointment
} from '@/lib/mindbody-api';

interface MindbodyContextType {
  isAuthenticated: boolean;
  client: MindbodyClient | null;
  services: MindbodyService[];
  classes: MindbodyClass[];
  appointments: MindbodyAppointment[];
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  loginWithOAuth: (code: string, redirectUri: string) => Promise<boolean>;
  logout: () => void;
  refreshData: () => Promise<void>;
  createNewClient: (clientData: {
    FirstName: string;
    LastName: string;
    Email: string;
    MobilePhone?: string;
  }) => Promise<boolean>;
}

export const MindbodyContext = createContext<MindbodyContextType | null>(null);

export const useMindbody = () => {
  const context = useContext(MindbodyContext);
  if (!context) {
    throw new Error('useMindbody must be used within a MindbodyProvider');
  }
  return context;
};

export const useMindbodyAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [client, setClient] = useState<MindbodyClient | null>(null);
  const [services, setServices] = useState<MindbodyService[]>([]);
  const [classes, setClasses] = useState<MindbodyClass[]>([]);
  const [appointments, setAppointments] = useState<MindbodyAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('mindbody_access_token');
    const storedRefreshToken = localStorage.getItem('mindbody_refresh_token');
    const storedClient = localStorage.getItem('mindbody_client');
    const tokenExpiry = localStorage.getItem('mindbody_token_expiry');
    
    if (storedToken && storedClient) {
      try {
        const client = JSON.parse(storedClient);
        const expiry = tokenExpiry ? parseInt(tokenExpiry) : 0;
        
        // Check if token is expired
        if (expiry > Date.now()) {
          setClient(client);
          setIsAuthenticated(true);
          refreshData();
        } else if (storedRefreshToken) {
          // Try to refresh the token
          refreshTokens(storedRefreshToken);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Error parsing stored client data:', err);
        logout();
      }
    }
  }, []);

  const refreshTokens = async (refreshToken: string) => {
    try {
      const { refreshMindbodyOAuthToken } = await import('@/lib/mindbody-api');
      const result = await refreshMindbodyOAuthToken(refreshToken);
      
      if (result.success && result.data) {
        const { access_token, refresh_token, expires_in } = result.data;
        const expiry = Date.now() + (expires_in * 1000);
        
        localStorage.setItem('mindbody_access_token', access_token);
        localStorage.setItem('mindbody_refresh_token', refresh_token);
        localStorage.setItem('mindbody_token_expiry', expiry.toString());
        
        setIsAuthenticated(true);
        refreshData();
      } else {
        logout();
      }
    } catch (err) {
      console.error('Token refresh failed:', err);
      logout();
    }
  };

  const loginWithOAuth = async (code: string, redirectUri: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const { exchangeMindbodyOAuthCode } = await import('@/lib/mindbody-api');
      const tokenResult = await exchangeMindbodyOAuthCode(code, redirectUri);
      
      if (tokenResult.success && tokenResult.data) {
        const { access_token, refresh_token, expires_in } = tokenResult.data;
        const expiry = Date.now() + (expires_in * 1000);
        
        // Store OAuth tokens
        localStorage.setItem('mindbody_access_token', access_token);
        localStorage.setItem('mindbody_refresh_token', refresh_token);
        localStorage.setItem('mindbody_token_expiry', expiry.toString());
        
        // Get client info using the access token
        // Note: This might need to be updated based on how client info is retrieved with OAuth
        // For now, we'll set a basic authenticated state and let refreshData handle the rest
        setIsAuthenticated(true);
        
        // Load initial data
        await refreshData();
        
        return true;
      } else {
        setError(tokenResult.error || 'Failed to exchange authorization code');
        return false;
      }
    } catch (err) {
      setError('An unexpected error occurred during OAuth login');
      console.error('OAuth login error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const authResult = await authenticateUser(username, password);
      
      if (authResult.success && authResult.token) {
        // Store token
        localStorage.setItem('mindbody_token', authResult.token);
        
        // Get client info - assuming the username is an email or client ID
        const clientResult = await getClientInfo(username);
        
        if (clientResult.success && clientResult.data) {
          setClient(clientResult.data);
          setIsAuthenticated(true);
          localStorage.setItem('mindbody_client', JSON.stringify(clientResult.data));
          
          // Load initial data
          await refreshData();
          
          return true;
        } else {
          setError('Failed to fetch client information');
          return false;
        }
      } else {
        setError(authResult.error || 'Authentication failed');
        return false;
      }
    } catch (err) {
      setError('An unexpected error occurred during login');
      console.error('Login error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('mindbody_token');
    localStorage.removeItem('mindbody_access_token');
    localStorage.removeItem('mindbody_refresh_token');
    localStorage.removeItem('mindbody_token_expiry');
    localStorage.removeItem('mindbody_client');
    setIsAuthenticated(false);
    setClient(null);
    setServices([]);
    setClasses([]);
    setAppointments([]);
    setError(null);
  };

  const createNewClient = async (clientData: {
    FirstName: string;
    LastName: string;
    Email: string;
    MobilePhone?: string;
  }): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await createClient(clientData);
      
      if (result.success && result.data) {
        setClient(result.data);
        setIsAuthenticated(true);
        localStorage.setItem('mindbody_client', JSON.stringify(result.data));
        
        // Load initial data
        await refreshData();
        
        return true;
      } else {
        setError(result.error || 'Failed to create account');
        return false;
      }
    } catch (err) {
      setError('An unexpected error occurred during account creation');
      console.error('Account creation error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    
    try {
      // Get the current access token
      const accessToken = localStorage.getItem('mindbody_access_token') || localStorage.getItem('mindbody_token');
      
      if (!accessToken) {
        logout();
        return;
      }

      // Load services
      const servicesResult = await getServices(accessToken);
      if (servicesResult.success) {
        setServices(servicesResult.data);
      }

      // Load classes for the next 30 days
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + 30);
      
      const classesResult = await getClasses(
        today.toISOString(),
        endDate.toISOString(),
        accessToken
      );
      if (classesResult.success) {
        setClasses(classesResult.data);
      }

      // Load client appointments if we have client info
      if (client) {
        const appointmentsResult = await getClientAppointments(
          client.UniqueId || client.Id.toString(),
          today.toISOString(),
          undefined,
          accessToken
        );
        if (appointmentsResult.success) {
          setAppointments(appointmentsResult.data);
        }
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  return {
    isAuthenticated,
    client,
    services,
    classes,
    appointments,
    loading,
    error,
    login,
    loginWithOAuth,
    logout,
    refreshData,
    createNewClient,
  };
};