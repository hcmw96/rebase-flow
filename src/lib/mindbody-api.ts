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

// 🔥 OAUTH FUNCTIONS - VERSION 4.0 - BYPASS EDGE FUNCTION FOR TESTING 🔥
export const getOAuthAuthorizationUrl = async (redirectUri: string) => {
  console.log('🚀 getOAuthAuthorizationUrl called - VERSION 4.0 - BYPASS MODE');
  console.log('🚀 Build Timestamp:', Date.now());
  
  // Generate state parameter for security
  const state = generateRandomState();
  localStorage.setItem('oauth_state', state);
  
  console.log('🔧 TESTING MODE: Bypassing edge function to test OAuth flow');
  console.log('🔧 Redirect URI:', redirectUri);
  
  try {
    // TEMPORARY: Use the actual client ID to test the OAuth flow
    const clientId = 'f660fd3e-a0d6-4f66-878c-871c9860e565'; // Your actual Mindbody OAuth Client ID
    
    console.log('🔧 Using actual client ID for testing');
    
    if (!clientId) {
      throw new Error('Client ID is missing');
    }
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'read',
      state: state
    });
    
    // Use the correct Mindbody OAuth endpoint
    const authUrl = `https://signin.mindbodyonline.com/launch/oauth?${params.toString()}`;
    console.log('🔧 Generated OAuth URL:', authUrl);
    
    return authUrl;
  } catch (error) {
    console.error('💥 OAUTH ERROR:', error);
    throw error;
  }
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