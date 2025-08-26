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

  // Check for existing session on mount and load public data
  useEffect(() => {
    const storedToken = localStorage.getItem('mindbody_token');
    const storedClient = localStorage.getItem('mindbody_client');
    
    if (storedToken && storedClient) {
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
    setLoading(true);
    
    try {
      const token = localStorage.getItem('mindbody_token');
      
      // Load services (public data, no auth required)
      const servicesResult = await getServices(token || undefined);
      if (servicesResult.success) {
        setServices(servicesResult.data);
      }

      // Load classes for the next 30 days (public data, no auth required)
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + 30);
      
      const classesResult = await getClasses(
        today.toISOString(),
        endDate.toISOString(),
        token || undefined
      );
      if (classesResult.success) {
        setClasses(classesResult.data);
      }

      // Load client appointments (only if authenticated)
      if (isAuthenticated && client) {
        const appointmentsResult = await getClientAppointments(
          client.UniqueId || client.Id.toString(),
          today.toISOString()
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
    logout,
    refreshData,
    createNewClient,
  };
};