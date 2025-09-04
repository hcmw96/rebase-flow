import { useState, useEffect, createContext, useContext } from 'react';
import { 
  lookupClient, 
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
  loginWithEmail: (emailOrPhone: string) => Promise<boolean>;
  logout: () => void;
  refreshData: () => Promise<void>;
  setAuthData: (token: string | null, userData: any) => void;
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

  // Check for existing session on mount and load public data
  useEffect(() => {
    const storedClient = localStorage.getItem('mindbody_client');
    
    if (storedClient) {
      try {
        setClient(JSON.parse(storedClient));
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Error parsing stored client data:', err);
        logout();
      }
    }
    
    // Always try to load public data (services and classes)
    refreshData();
  }, []);

  const loginWithEmail = async (emailOrPhone: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const lookupResult = await lookupClient(emailOrPhone);
      
      if (lookupResult.success && lookupResult.found && lookupResult.data) {
        // Client found - log them in
        const { client, staffToken } = lookupResult.data;
        
        setClient(client);
        setIsAuthenticated(true);
        localStorage.setItem('mindbody_client', JSON.stringify(client));
        localStorage.setItem('mindbody_staff_token', staffToken);
        
        // Load initial data
        await refreshData();
        
        return true;
      } else if (lookupResult.success && !lookupResult.found) {
        // Client not found - show error message suggesting account creation
        setError(lookupResult.message || 'Account not found. Please check your email/phone or create a new account.');
        return false;
      } else {
        setError(lookupResult.error || 'Failed to lookup account');
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
    localStorage.removeItem('mindbody_staff_token');
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
        const { client, staffToken } = result.data;
        
        setClient(client);
        setIsAuthenticated(true);
        localStorage.setItem('mindbody_client', JSON.stringify(client));
        localStorage.setItem('mindbody_staff_token', staffToken);
        
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
    setLoading(true);
    
    try {
      const staffToken = localStorage.getItem('mindbody_staff_token');
      
      // Load services (uses staff token automatically)
      const servicesResult = await getServices(staffToken || undefined);
      if (servicesResult.success) {
        setServices(servicesResult.data);
      }

      // Load classes for the next 30 days (uses staff token automatically)
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + 30);
      
      const classesResult = await getClasses(
        today.toISOString(),
        endDate.toISOString(),
        staffToken || undefined
      );
      if (classesResult.success) {
        setClasses(classesResult.data);
      }

      // Load client appointments (only if authenticated)
      if (isAuthenticated && client) {
        const appointmentsResult = await getClientAppointments(
          client.UniqueId || client.Id.toString(),
          today.toISOString(),
          undefined,
          staffToken || undefined
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

  const setAuthData = (token: string | null, userData: any) => {
    // Store token if provided (for staff operations)
    if (token) {
      localStorage.setItem('mindbody_token', token);
    }
    
    if (userData && userData.Client) {
      setClient(userData.Client);
      setIsAuthenticated(true);
      localStorage.setItem('mindbody_client', JSON.stringify(userData.Client));
    } else if (userData) {
      // Handle case where userData is the client directly
      setClient(userData);
      setIsAuthenticated(true);
      localStorage.setItem('mindbody_client', JSON.stringify(userData));
    }
    
    // Refresh data with the new authentication
    refreshData();
  };

  return {
    isAuthenticated,
    client,
    services,
    classes,
    appointments,
    loading,
    error,
    loginWithEmail,
    logout,
    refreshData,
    setAuthData,
    createNewClient,
  };
};