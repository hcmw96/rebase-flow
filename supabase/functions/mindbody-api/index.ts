import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MINDBODY_API_BASE = 'https://api.mindbodyonline.com/public/v6';
const MINDBODY_API_KEY = Deno.env.get('MINDBODY_API_KEY');
const MINDBODY_SITE_ID = Deno.env.get('MINDBODY_SITE_ID');
const MINDBODY_CLIENT_ID = Deno.env.get('MINDBODY_CLIENT_ID');
const MINDBODY_CLIENT_SECRET = Deno.env.get('MINDBODY_CLIENT_SECRET');

// Comprehensive debug logging  
console.log('=== ENVIRONMENT VARIABLE DEBUG ===');
console.log('Force refresh at:', new Date().toISOString());
console.log('Deployment version: v3.1 - Secret updated');
console.log('All available env vars:', Object.keys(Deno.env.toObject()).sort());
console.log('Raw values:', {
  MINDBODY_API_KEY: MINDBODY_API_KEY,
  MINDBODY_SITE_ID: MINDBODY_SITE_ID,
  MINDBODY_CLIENT_ID: MINDBODY_CLIENT_ID,
  MINDBODY_CLIENT_SECRET: MINDBODY_CLIENT_SECRET
});
console.log('Type check:', {
  apiKeyType: typeof MINDBODY_API_KEY,
  siteIdType: typeof MINDBODY_SITE_ID,
  apiKeyLength: MINDBODY_API_KEY?.length,
  siteIdLength: MINDBODY_SITE_ID?.length
});
console.log('=== END DEBUG ===');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // More robust check for environment variables (check for empty strings too)
    if (!MINDBODY_API_KEY || MINDBODY_API_KEY.trim() === '' || !MINDBODY_SITE_ID || MINDBODY_SITE_ID.trim() === '') {
      console.error('Missing environment variables:', {
        MINDBODY_API_KEY: MINDBODY_API_KEY || 'undefined',
        MINDBODY_SITE_ID: MINDBODY_SITE_ID || 'undefined'
      });
      throw new Error('Mindbody API key and Site ID not configured');
    }

    const { action, data = {} } = await req.json();
    console.log('Mindbody API request:', { action, data });

    let result;

    switch (action) {
    case 'authenticateStaff':
      result = await authenticateStaff();
      break;
    case 'lookupClient':
      result = await lookupClient(data.emailOrPhone);
      break;
    case 'validateClient':
      result = await validateClient(data.emailOrPhone, data.clientId);
      break;
      case 'getClient':
        result = await getClientInfo(data.clientId, data.token);
        break;
      case 'createClient':
        result = await createClient(data.clientData);
        break;
      case 'getServices':
        result = await getServices(data.token);
        break;
      case 'getClasses':
        result = await getClasses(data.startDate, data.endDate, data.token);
        break;
      case 'bookAppointment':
        result = await bookAppointment(data.serviceId, data.staffId, data.startDateTime, data.clientId, data.token);
        break;
      case 'bookClass':
        result = await bookClass(data.classId, data.clientId, data.token);
        break;
      case 'getClientAppointments':
        result = await getClientAppointments(data.clientId, data.startDate, data.endDate, data.token);
        break;
      case 'cancelAppointment':
        result = await cancelAppointment(data.appointmentId, data.notes, data.token);
        break;
      case 'exchangeOAuthCode':
        result = await exchangeOAuthCode(data.code, data.redirectUri, data.state);
        break;
      case 'refreshOAuthToken':
        result = await refreshOAuthToken(data.refreshToken);
        break;
      case 'getOAuthConfig':
        result = await getOAuthConfig();
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in mindbody-api function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to make Mindbody API requests
async function makeMindbodyRequest(endpoint: string, options: any = {}) {
  const url = `${MINDBODY_API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'API-Key': MINDBODY_API_KEY,
    'SiteId': MINDBODY_SITE_ID,
    ...options.headers,
  };

  console.log('Making request to:', url, { headers: Object.keys(headers), apiKeyLength: MINDBODY_API_KEY?.length, siteId: MINDBODY_SITE_ID });

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Mindbody API error:', response.status, errorText);
    throw new Error(`Mindbody API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// Staff authentication - get a persistent staff token for API operations
let staffToken: string | null = null;
let staffTokenExpiry: number = 0;

async function authenticateStaff() {
  try {
    // Check if we have a valid cached token
    if (staffToken && Date.now() < staffTokenExpiry) {
      return {
        success: true,
        token: staffToken,
        cached: true
      };
    }

    console.log('Authenticating staff user...');
    
    // Use staff credentials from environment
    const staffUsername = Deno.env.get('MINDBODY_STAFF_USERNAME');
    const staffPassword = Deno.env.get('MINDBODY_STAFF_PASSWORD');
    
    if (!staffUsername || !staffPassword) {
      return {
        success: false,
        error: 'Staff credentials not configured'
      };
    }

    const response = await makeMindbodyRequest('/usertoken/issue', {
      method: 'POST',
      body: JSON.stringify({
        Username: staffUsername,
        Password: staffPassword,
      }),
    });

    if (response.AccessToken) {
      // Cache the token for 23 hours (Mindbody tokens typically last 24h)
      staffToken = response.AccessToken;
      staffTokenExpiry = Date.now() + (23 * 60 * 60 * 1000);
      
      return {
        success: true,
        token: response.AccessToken,
        data: response
      };
    }

    return {
      success: false,
      error: 'Staff authentication failed'
    };
  } catch (error) {
    console.error('Error in authenticateStaff:', error);
    return {
      success: false,
      error: 'Staff authentication failed'
    };
  }
}

async function lookupClient(emailOrPhone: string) {
  try {
    // Ensure we have a valid staff token
    const staffAuth = await authenticateStaff();
    if (!staffAuth.success) {
      return staffAuth;
    }

    console.log('Looking up client by email/phone:', emailOrPhone);
    
    // Search for client by email or phone using staff token
    const searchParams = new URLSearchParams({
      SearchText: emailOrPhone
    });
    
    const response = await makeMindbodyRequest(`/client/clients?${searchParams}`, {
      method: 'GET',
      headers: {
        'Authorization': staffAuth.token
      }
    });

    if (response.Clients && response.Clients.length > 0) {
      // Return the first matching client with staff token for booking operations
      const client = response.Clients[0];
      return {
        success: true,
        data: {
          client: client,
          staffToken: staffAuth.token
        },
        found: true
      };
    }

    return {
      success: true,
      data: null,
      found: false,
      message: 'Client not found - would you like to create a new account?'
    };
  } catch (error) {
    console.error('Error in lookupClient:', error);
    return {
      success: false,
      error: 'Failed to lookup client'
    };
  }
}

// Legacy client validation function - redirect to lookupClient
async function validateClient(emailOrPhone: string, clientId?: string) {
  return await lookupClient(emailOrPhone);
}

// Client management functions
async function getClientInfo(clientId: string, token: string) {
  try {
    const data = await makeMindbodyRequest('/client/clients', {
      method: 'POST', // Changed from GET to POST
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        ClientIds: [clientId], // Send as array in POST body instead of query param
      }),
    });

    return {
      success: true,
      data: data.Clients?.[0] || null,
    };
  } catch (error) {
    console.error('Error fetching client info:', error);
    return {
      success: false,
      error: 'Failed to fetch client information',
    };
  }
}

async function createClient(clientData: any) {
  try {
    // Ensure we have a valid staff token
    const staffAuth = await authenticateStaff();
    if (!staffAuth.success) {
      return staffAuth;
    }

    const data = await makeMindbodyRequest('/client/addclient', {
      method: 'POST',
      headers: {
        'Authorization': staffAuth.token
      },
      body: JSON.stringify({
        ...clientData,
        SendAccountEmails: true,
        SendAccountTexts: false,
        SendPromotionalEmails: true,
        SendPromotionalTexts: false,
      }),
    });

    return {
      success: true,
      data: {
        client: data.Client,
        staffToken: staffAuth.token
      }
    };
  } catch (error) {
    console.error('Error creating client:', error);
    return {
      success: false,
      error: 'Failed to create client account',
    };
  }
}

// Service and class functions
async function getServices(token?: string) {
  try {
    // Use staff token if no token provided
    let authToken = token;
    if (!authToken) {
      const staffAuth = await authenticateStaff();
      if (staffAuth.success) {
        authToken = staffAuth.token;
      }
    }
    
    const headers: any = {};
    if (authToken) {
      headers['Authorization'] = authToken;
    }

    const data = await makeMindbodyRequest('/sale/services', {
      method: 'GET',
      headers,
    });

    return {
      success: true,
      data: data.Services || [],
    };
  } catch (error) {
    console.error('Error fetching services:', error);
    return {
      success: false,
      error: 'Failed to fetch services',
    };
  }
}

async function getClasses(startDate: string, endDate: string, token?: string) {
  try {
    // Use staff token if no token provided
    let authToken = token;
    if (!authToken) {
      const staffAuth = await authenticateStaff();
      if (staffAuth.success) {
        authToken = staffAuth.token;
      }
    }
    
    const headers: any = {};
    if (authToken) {
      headers['Authorization'] = authToken;
    }

    // Use query parameters for GET request
    const searchParams = new URLSearchParams({
      StartDateTime: startDate,
      EndDateTime: endDate,
      HideCanceledClasses: 'true',
    });

    const data = await makeMindbodyRequest(`/class/classes?${searchParams.toString()}`, {
      method: 'GET',
      headers,
    });

    return {
      success: true,
      data: data.Classes || [],
    };
  } catch (error) {
    console.error('Error fetching classes:', error);
    return {
      success: false,
      error: 'Failed to fetch classes',
    };
  }
}

// Booking functions
async function bookAppointment(serviceId: number, staffId: number, startDateTime: string, clientId: string, token: string) {
  try {
    const data = await makeMindbodyRequest('/appointment/addappointment', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        ServiceId: serviceId,
        StaffId: staffId,
        StartDateTime: startDateTime,
        ClientId: clientId,
        Notes: 'Booked via Rebase Recovery website',
        SendEmail: true,
      }),
    });

    return {
      success: true,
      data: data.Appointment,
    };
  } catch (error) {
    console.error('Error booking appointment:', error);
    return {
      success: false,
      error: 'Failed to book appointment',
    };
  }
}

async function bookClass(classId: number, clientId: string, token: string) {
  try {
    const data = await makeMindbodyRequest('/class/addclienttoclass', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        ClassId: classId,
        ClientId: clientId,
        SendEmail: true,
        Waitlist: false,
      }),
    });

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Error booking class:', error);
    return {
      success: false,
      error: 'Failed to book class',
    };
  }
}

// Get client appointments
async function getClientAppointments(clientId: string, startDate?: string, endDate?: string, token?: string) {
  try {
    const requestBody: any = {
      ClientIds: [clientId], // Send as array in POST body
    };
    
    if (startDate) requestBody.StartDate = startDate;
    if (endDate) requestBody.EndDate = endDate;

    const data = await makeMindbodyRequest('/appointment/appointments', {
      method: 'POST', // Changed from GET to POST
      headers: token ? {
        'Authorization': `Bearer ${token}`,
      } : {},
      body: JSON.stringify(requestBody),
    });

    return {
      success: true,
      data: data.Appointments || [],
    };
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return {
      success: false,
      error: 'Failed to fetch appointments',
    };
  }
}

// Cancel appointment
async function cancelAppointment(appointmentId: number, notes: string = '', token: string) {
  try {
    const data = await makeMindbodyRequest('/appointment/updateappointment', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        AppointmentId: appointmentId,
        Action: 'Cancel',
        Notes: notes || 'Cancelled via Rebase Recovery website',
      }),
    });

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return {
      success: false,
      error: 'Failed to cancel appointment',
    };
  }
}

async function getOAuthConfig() {
  try {
    console.log('Getting OAuth configuration');
    console.log('MINDBODY_CLIENT_ID type:', typeof MINDBODY_CLIENT_ID);
    console.log('MINDBODY_CLIENT_ID length:', MINDBODY_CLIENT_ID?.length);
    console.log('MINDBODY_CLIENT_ID value (first 10 chars):', MINDBODY_CLIENT_ID?.substring(0, 10));
    
    if (!MINDBODY_CLIENT_ID || MINDBODY_CLIENT_ID.trim() === '') {
      console.log('OAuth client ID is missing or empty');
      return {
        success: false,
        error: 'OAuth client ID not configured'
      };
    }

    console.log('OAuth client ID found, returning config');
    return {
      success: true,
      data: {
        clientId: MINDBODY_CLIENT_ID.trim()
      }
    };
  } catch (error) {
    console.error('Error getting OAuth config:', error);
    return {
      success: false,
      error: 'Failed to get OAuth configuration'
    };
  }
}

// OAuth authentication functions
async function exchangeOAuthCode(code: string, redirectUri: string, state: string) {
  try {
    console.log('Exchanging OAuth code for access token:', { code: code.substring(0, 10) + '...', redirectUri, state });
    
    if (!MINDBODY_CLIENT_ID || !MINDBODY_CLIENT_SECRET) {
      return {
        success: false,
        error: 'OAuth client credentials not configured'
      };
    }

    const tokenUrl = `${MINDBODY_API_BASE}/usertoken/oauth2/token`;
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'API-Key': MINDBODY_API_KEY,
        'SiteId': MINDBODY_SITE_ID,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: MINDBODY_CLIENT_ID,
        client_secret: MINDBODY_CLIENT_SECRET,
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('OAuth token exchange failed:', data);
      return {
        success: false,
        error: data.error_description || 'Failed to exchange authorization code'
      };
    }

    return {
      success: true,
      data: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        token_type: data.token_type,
        scope: data.scope
      }
    };
  } catch (error) {
    console.error('Error exchanging OAuth code:', error);
    return {
      success: false,
      error: 'OAuth code exchange failed'
    };
  }
}

async function refreshOAuthToken(refreshToken: string) {
  try {
    console.log('Refreshing OAuth token');
    
    if (!MINDBODY_CLIENT_ID || !MINDBODY_CLIENT_SECRET) {
      return {
        success: false,
        error: 'OAuth client credentials not configured'
      };
    }

    const tokenUrl = `${MINDBODY_API_BASE}/usertoken/oauth2/token`;
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'API-Key': MINDBODY_API_KEY,
        'SiteId': MINDBODY_SITE_ID,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: MINDBODY_CLIENT_ID,
        client_secret: MINDBODY_CLIENT_SECRET,
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('OAuth token refresh failed:', data);
      return {
        success: false,
        error: data.error_description || 'Failed to refresh access token'
      };
    }

    return {
      success: true,
      data: {
        access_token: data.access_token,
        refresh_token: data.refresh_token || refreshToken, // Some providers don't send new refresh token
        expires_in: data.expires_in,
        token_type: data.token_type,
        scope: data.scope
      }
    };
  } catch (error) {
    console.error('Error refreshing OAuth token:', error);
    return {
      success: false,
      error: 'OAuth token refresh failed'
    };
  }
}