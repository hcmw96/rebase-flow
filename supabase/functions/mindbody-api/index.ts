import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MINDBODY_API_BASE = 'https://api.mindbodyonline.com/public/v6';
const MINDBODY_AUTH_BASE = 'https://signin.mindbodyonline.com';
const MINDBODY_API_KEY = Deno.env.get('MINDBODY_API_KEY');
const MINDBODY_OAUTH_CLIENT_ID = Deno.env.get('MINDBODY_OAUTH_CLIENT_ID');
const MINDBODY_OAUTH_CLIENT_SECRET = Deno.env.get('MINDBODY_OAUTH_CLIENT_SECRET');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!MINDBODY_API_KEY) {
      throw new Error('Mindbody API key not configured');
    }

    const { action, data = {} } = await req.json();
    console.log('Mindbody API request:', { action, data });

    let result;

    switch (action) {
      case 'getOAuthUrl':
        result = await getOAuthAuthorizationUrl(data.redirectUri, data.state);
        break;
      case 'exchangeOAuthCode':
        result = await exchangeOAuthCode(data.code, data.redirectUri);
        break;
      case 'refreshOAuthToken':
        result = await refreshOAuthToken(data.refreshToken);
        break;
      case 'authenticate':
        result = await authenticateUser(data.username, data.password);
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

// OAuth Functions
async function getOAuthAuthorizationUrl(redirectUri: string, state?: string) {
  console.log('Generating OAuth authorization URL');
  
  if (!MINDBODY_OAUTH_CLIENT_ID) {
    return {
      success: false,
      error: 'OAuth client ID not configured'
    };
  }

  const params = new URLSearchParams({
    response_mode: 'query',
    response_type: 'code',
    client_id: MINDBODY_OAUTH_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'openid profile email Mindbody.Api.Public.v6',
    nonce: crypto.randomUUID(),
  });

  if (state) {
    params.append('state', state);
  }

  const authUrl = `${MINDBODY_AUTH_BASE}/connect/authorize?${params.toString()}`;
  
  return {
    success: true, 
    data: { authUrl }
  };
}

async function exchangeOAuthCode(code: string, redirectUri: string) {
  console.log('Exchanging OAuth code for tokens');
  
  if (!MINDBODY_OAUTH_CLIENT_ID || !MINDBODY_OAUTH_CLIENT_SECRET) {
    return {
      success: false,
      error: 'OAuth credentials not configured'
    };
  }

  try {
    const tokenData = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: MINDBODY_OAUTH_CLIENT_ID,
      client_secret: MINDBODY_OAUTH_CLIENT_SECRET,
      code: code,
      redirect_uri: redirectUri,
      scope: 'offline_access PG.ConsumerActivity.Api.Read'
    });

    const response = await fetch(`${MINDBODY_AUTH_BASE}/connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenData.toString(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Token exchange failed:', result);
      return {
        success: false, 
        error: result.error || 'Failed to exchange authorization code'
      };
    }

    return {
      success: true,
      data: {
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        id_token: result.id_token,
        expires_in: result.expires_in,
        token_type: result.token_type
      }
    };
  } catch (error) {
    console.error('Error exchanging OAuth code:', error);
    return {
      success: false,
      error: 'Failed to exchange authorization code'
    };
  }
}

async function refreshOAuthToken(refreshToken: string) {
  console.log('Refreshing OAuth token');
  
  if (!MINDBODY_OAUTH_CLIENT_ID || !MINDBODY_OAUTH_CLIENT_SECRET) {
    return {
      success: false,
      error: 'OAuth credentials not configured'
    };
  }

  try {
    const tokenData = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: MINDBODY_OAUTH_CLIENT_ID,
      client_secret: MINDBODY_OAUTH_CLIENT_SECRET,
      refresh_token: refreshToken,
      scope: 'offline_access PG.ConsumerActivity.Api.Read'
    });

    const response = await fetch(`${MINDBODY_AUTH_BASE}/connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenData.toString(),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Token refresh failed:', result);
      return {
        success: false,
        error: result.error || 'Failed to refresh token'
      };
    }

    return {
      success: true,
      data: {
        access_token: result.access_token,
        refresh_token: result.refresh_token || refreshToken,
        id_token: result.id_token,
        expires_in: result.expires_in,
        token_type: result.token_type
      }
    };
  } catch (error) {
    console.error('Error refreshing OAuth token:', error);
    return {
      success: false,
      error: 'Failed to refresh token'
    };
  }
}

// Helper function to make Mindbody API requests
async function makeMindbodyRequest(endpoint: string, options: any = {}) {
  const url = `${MINDBODY_API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'API-Key': MINDBODY_API_KEY!,
    ...options.headers,
  };

  console.log('Making request to:', url, { headers: Object.keys(headers) });

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

// Authentication functions
async function authenticateUser(username: string, password: string) {
  try {
    const data = await makeMindbodyRequest('/usertoken/issue', {
      method: 'POST',
      body: JSON.stringify({
        Username: username,
        Password: password,
      }),
    });

    return {
      success: true,
      data,
      token: data.AccessToken,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Invalid credentials',
    };
  }
}

// Client management functions
async function getClientInfo(clientId: string, token: string) {
  try {
    const data = await makeMindbodyRequest(`/client/clients?ClientIds=${clientId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
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
async function getServices(token: string) {
  try {
    const data = await makeMindbodyRequest('/site/services', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
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

async function getClasses(startDate: string, endDate: string, token: string) {
  try {
    const params = new URLSearchParams({
      StartDateTime: startDate,
      EndDateTime: endDate,
      HideCanceledClasses: 'true',
    });

    const data = await makeMindbodyRequest(`/class/classes?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
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
    const params = new URLSearchParams({
      ClientIds: clientId,
    });
    
    if (startDate) params.append('StartDate', startDate);
    if (endDate) params.append('EndDate', endDate);

    const data = await makeMindbodyRequest(`/appointment/appointments?${params}`, {
      method: 'GET',
      headers: token ? {
        'Authorization': `Bearer ${token}`,
      } : {},
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