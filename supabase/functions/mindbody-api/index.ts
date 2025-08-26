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
    case 'authenticate':
      result = await authenticateUser(data.username, data.password);
      break;
    case 'validateClient':
      result = await validateClient(data.email || data.emailOrPhone, data.clientId);
      break;
      case 'getOAuthUrl':
        result = await getOAuthUrl(data.redirectUri);
        break;
      case 'exchangeOAuthCode':
        result = await exchangeOAuthCode(data.code, data.redirectUri);
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

// Authentication functions - V6 API uses API key + optional staff tokens
async function authenticateUser(username: string, password: string) {
  console.log('Generating staff token for user:', username);
  
  try {
    const response = await makeMindbodyRequest('/usertoken/issue', {
      method: 'POST',
      body: JSON.stringify({
        Username: username,
        Password: password
      })
    });

    console.log('Staff token response:', response);
    
    if (response && response.AccessToken) {
      return {
        success: true,
        token: response.AccessToken,
        data: response
      };
    } else {
      console.error('No access token in response:', response);
      return {
        success: false,
        error: 'No access token received'
      };
    }
  } catch (error) {
    console.error('Staff token error details:', error);
    return {
      success: false,
      error: error.message || 'Staff authentication failed'
    };
  }
}

// Client login - V6 API doesn't support direct client authentication
// Instead, we validate client exists and return client data
async function validateClient(emailOrPhone: string, clientId?: string) {
  console.log('Validating client:', emailOrPhone, clientId);
  
  try {
    let client = null;
    
    if (clientId) {
      // Try to get client by ID
      const response = await makeMindbodyRequest(`/client/clients/${clientId}`);
      if (response && response.Client) {
        client = response.Client;
      }
    } else {
      // Build search URL with query parameters
      const searchParams = new URLSearchParams({
        SearchText: emailOrPhone,
        CrossRegionalLookup: 'true'
      });
      
      // Search for client by email/phone using query parameters
      const response = await makeMindbodyRequest(`/client/clients?${searchParams.toString()}`, {
        method: 'GET'
      });
      
      console.log('Client search response:', response);
      
      if (response && response.Clients && response.Clients.length > 0) {
        // Check if input is email or phone and find match accordingly
        const isEmail = emailOrPhone.includes('@');
        if (isEmail) {
          client = response.Clients.find(c => c.Email?.toLowerCase() === emailOrPhone.toLowerCase());
        } else {
          // For phone, check various phone fields
          client = response.Clients.find(c => 
            c.MobilePhone === emailOrPhone || 
            c.HomePhone === emailOrPhone ||
            c.WorkPhone === emailOrPhone
          );
        }
        
        // If no exact match found, use first client
        if (!client && response.Clients.length > 0) {
          client = response.Clients[0];
        }
      }
    }
    
    if (client) {
      return {
        success: true,
        client: client,
        data: { client }
      };
    } else {
      return {
        success: false,
        error: 'Client not found'
      };
    }
  } catch (error) {
    console.error('Client validation error:', error);
    return {
      success: false,
      error: error.message || 'Client validation failed'
    };
  }
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
    const data = await makeMindbodyRequest('/client/addclient', {
      method: 'POST',
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
      data: data.Client,
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
    const headers: any = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const data = await makeMindbodyRequest('/site/services', {
      method: 'POST', // Changed from GET to POST
      headers,
      body: JSON.stringify({}), // Empty body for services request
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
    const headers: any = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const data = await makeMindbodyRequest('/class/classes', {
      method: 'POST', // Changed from GET to POST
      headers,
      body: JSON.stringify({
        StartDateTime: startDate,
        EndDateTime: endDate,
        HideCanceledClasses: true,
      }),
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

// OAuth functions
async function getOAuthUrl(redirectUri: string) {
  try {
    if (!MINDBODY_CLIENT_ID) {
      throw new Error('Mindbody Client ID not configured');
    }

    console.log('Building OAuth URL with:', {
      clientId: MINDBODY_CLIENT_ID,
      redirectUri: redirectUri
    });

    // Use the correct Mindbody OAuth 2.0 authorization URL
    const baseAuthUrl = 'https://api.mindbodyonline.com/public/v6/usertoken/issue';
    const scope = 'read'; // Basic read scope for client data
    
    // Mindbody OAuth 2.0 authorization URL
    const authUrl = `${baseAuthUrl}?response_type=code&client_id=${encodeURIComponent(MINDBODY_CLIENT_ID)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${Date.now()}`;

    console.log('Generated OAuth URL:', authUrl);

    return {
      success: true,
      url: authUrl,
      data: {
        authUrl: authUrl,
      },
    };
  } catch (error) {
    console.error('Error generating OAuth URL:', error);
    return {
      success: false,
      error: 'Failed to generate OAuth URL',
    };
  }
}

async function exchangeOAuthCode(code: string, redirectUri: string) {
  try {
    if (!MINDBODY_CLIENT_ID || !MINDBODY_CLIENT_SECRET) {
      throw new Error('Mindbody OAuth credentials not configured');
    }

    const response = await fetch('https://api.mindbodyonline.com/public/v6/usertoken/issue', {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OAuth token exchange error:', response.status, errorText);
      throw new Error(`OAuth token exchange failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data,
      token: data.access_token,
    };
  } catch (error) {
    console.error('Error exchanging OAuth code:', error);
    return {
      success: false,
      error: 'Failed to exchange OAuth code',
    };
  }
}