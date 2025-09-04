import { supabase } from '@/integrations/supabase/client';

// Types for Mindbody API responses
export interface MindbodyClient {
  Id: number;
  UniqueId: string;
  FirstName: string;
  LastName: string;
  Email: string;
  MobilePhone: string;
  CreationDate: string;
  Active: boolean;
}

export interface MindbodyService {
  Id: number;
  Name: string;
  Description: string;
  Duration: number;
  Price: number;
  OnlinePrice: number;
  TaxIncluded: boolean;
  CategoryId: number;
  CategoryName: string;
}

export interface MindbodyClass {
  Id: number;
  ClassDescription: {
    Id: number;
    Name: string;
    Description: string;
    Duration: number;
  };
  StartDateTime: string;
  EndDateTime: string;
  Staff: {
    Id: number;
    FirstName: string;
    LastName: string;
  };
  Location: {
    Id: number;
    Name: string;
  };
  MaxCapacity: number;
  BookedCount: number;
  TotalBooked: number;
  WebSignup: boolean;
  Action: string;
}

export interface MindbodyAppointment {
  Id: number;
  StartDateTime: string;
  EndDateTime: string;
  Service: MindbodyService;
  Staff: {
    Id: number;
    FirstName: string;
    LastName: string;
  };
  Location: {
    Id: number;
    Name: string;
  };
  Client: MindbodyClient;
  Status: string;
}

// Helper function to call the Mindbody edge function
async function callMindbodyAPI(action: string, data: any = {}) {
  try {
    const { data: result, error } = await supabase.functions.invoke('mindbody-api', {
      body: { action, data }
    });

    if (error) {
      console.error('Edge function error:', error);
      return {
        success: false,
        error: error.message || 'An error occurred while calling the Mindbody API'
      };
    }

    return result;
  } catch (error) {
    console.error('Network error:', error);
    return {
      success: false,
      error: 'Network error occurred'
    };
  }
}

// OAuth authentication functions
export const getOAuthAuthorizationUrl = (redirectUri: string) => {
  // Generate state parameter for security
  const state = generateRandomState();
  localStorage.setItem('oauth_state', state);
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: 'f660fd3e-a0d6-4f66-878c-871c9860e565', // Your OAuth client ID
    redirect_uri: redirectUri,
    scope: 'read write',
    state: state
  });
  
  return `https://api.mindbodyonline.com/public/v6/usertoken/oauth2/authorize?${params.toString()}`;
};

export const exchangeOAuthCode = async (code: string, redirectUri: string, state: string) => {
  // Verify state parameter
  const storedState = localStorage.getItem('oauth_state');
  if (state !== storedState) {
    throw new Error('Invalid state parameter');
  }
  localStorage.removeItem('oauth_state');
  
  return await callMindbodyAPI('exchangeOAuthCode', { code, redirectUri, state });
};

export const refreshOAuthToken = async (refreshToken: string) => {
  return await callMindbodyAPI('refreshOAuthToken', { refreshToken });
};

// Generate a random state parameter for OAuth security
const generateRandomState = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Simplified authentication functions (legacy support)
export const authenticateStaff = async () => {
  return await callMindbodyAPI('authenticateStaff');
};

export const lookupClient = async (emailOrPhone: string) => {
  return await callMindbodyAPI('lookupClient', { emailOrPhone });
};

export const validateClient = async (emailOrPhone: string, clientId?: string) => {
  return await callMindbodyAPI('validateClient', { emailOrPhone, clientId });
};

// Client management functions
export const getClientInfo = async (clientId: string, token?: string) => {
  return await callMindbodyAPI('getClient', { clientId, token });
};

export const createClient = async (clientData: {
  FirstName: string;
  LastName: string;
  Email: string;
  MobilePhone?: string;
}) => {
  return await callMindbodyAPI('createClient', { clientData });
};

// Service and class functions
export const getServices = async (token?: string) => {
  return await callMindbodyAPI('getServices', { token });
};

export const getClasses = async (startDate: string, endDate: string, token?: string) => {
  return await callMindbodyAPI('getClasses', { startDate, endDate, token });
};

// Booking functions
export const bookAppointment = async (
  serviceId: number, 
  staffId: number, 
  startDateTime: string, 
  clientId: string,
  token?: string
) => {
  return await callMindbodyAPI('bookAppointment', { 
    serviceId, 
    staffId, 
    startDateTime, 
    clientId, 
    token 
  });
};

export const bookClass = async (classId: number, clientId: string, token?: string) => {
  return await callMindbodyAPI('bookClass', { classId, clientId, token });
};

// Get client appointments
export const getClientAppointments = async (
  clientId: string, 
  startDate?: string, 
  endDate?: string,
  token?: string
) => {
  return await callMindbodyAPI('getClientAppointments', { 
    clientId, 
    startDate, 
    endDate, 
    token 
  });
};

// Cancel appointment
export const cancelAppointment = async (appointmentId: number, notes?: string, token?: string) => {
  return await callMindbodyAPI('cancelAppointment', { appointmentId, notes, token });
};

// Payment processing (this would typically integrate with Mindbody's payment system)
export const processPayment = async (appointmentId: number, paymentInfo: {
  amount: number;
  paymentMethod: string;
  clientId: string;
}) => {
  try {
    // This would integrate with Mindbody's payment processing
    // For now, this is a placeholder that would need to be implemented
    // based on your specific Mindbody setup and payment processor
    
    console.log('Processing payment for appointment:', appointmentId, paymentInfo);
    
    return {
      success: true,
      data: {
        transactionId: 'TXN_' + Date.now(),
        status: 'completed',
      },
    };
  } catch (error) {
    console.error('Error processing payment:', error);
    return {
      success: false,
      error: 'Payment processing failed',
    };
  }
};