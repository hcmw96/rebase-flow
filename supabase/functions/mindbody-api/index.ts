import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MINDBODY_API_BASE = 'https://api.mindbodyonline.com/public/v6';
const MINDBODY_API_KEY = Deno.env.get('MINDBODY_API_KEY');
const MINDBODY_SITE_ID = Deno.env.get('MINDBODY_SITE_ID');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!MINDBODY_API_KEY || !MINDBODY_SITE_ID) {
      throw new Error('Mindbody API key and Site ID not configured');
    }

    const { action, data = {} } = await req.json();
    console.log('Mindbody API request:', { action, data });

    let result;

    switch (action) {
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

// Helper function to make Mindbody API requests
async function makeMindbodyRequest(endpoint: string, options: any = {}) {
  const url = `${MINDBODY_API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'API-Key': MINDBODY_API_KEY!,
    'SiteId': MINDBODY_SITE_ID!,
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
async function getServices(token?: string) {
  try {
    const headers: any = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const data = await makeMindbodyRequest('/site/services', {
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
    const params = new URLSearchParams({
      StartDateTime: startDate,
      EndDateTime: endDate,
      HideCanceledClasses: 'true',
    });

    const headers: any = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const data = await makeMindbodyRequest(`/class/classes?${params}`, {
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