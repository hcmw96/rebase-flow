import axios from 'axios';

// Mindbody API configuration
const MINDBODY_API_BASE = 'https://api.mindbodyonline.com/public/v6';

// Create axios instance with default config
const mindbodyAPI = axios.create({
  baseURL: MINDBODY_API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'API-Key': 'YOUR_MINDBODY_API_KEY', // This should be stored securely
  },
});

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

// Authentication functions
export const authenticateUser = async (username: string, password: string) => {
  try {
    const response = await mindbodyAPI.post('/usertoken/issue', {
      Username: username,
      Password: password,
    });
    
    // Store the access token for subsequent requests
    const accessToken = response.data.AccessToken;
    mindbodyAPI.defaults.headers['Authorization'] = `Bearer ${accessToken}`;
    
    return {
      success: true,
      data: response.data,
      token: accessToken,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Invalid credentials',
    };
  }
};

// Client management functions
export const getClientInfo = async (clientId: string) => {
  try {
    const response = await mindbodyAPI.get(`/client/clients`, {
      params: {
        ClientIds: clientId,
      },
    });
    
    return {
      success: true,
      data: response.data.Clients[0] as MindbodyClient,
    };
  } catch (error) {
    console.error('Error fetching client info:', error);
    return {
      success: false,
      error: 'Failed to fetch client information',
    };
  }
};

export const createClient = async (clientData: {
  FirstName: string;
  LastName: string;
  Email: string;
  MobilePhone?: string;
}) => {
  try {
    const response = await mindbodyAPI.post('/client/addclient', {
      ...clientData,
      SendAccountEmails: true,
      SendAccountTexts: false,
      SendPromotionalEmails: true,
      SendPromotionalTexts: false,
    });
    
    return {
      success: true,
      data: response.data.Client as MindbodyClient,
    };
  } catch (error) {
    console.error('Error creating client:', error);
    return {
      success: false,
      error: 'Failed to create client account',
    };
  }
};

// Service and class functions
export const getServices = async () => {
  try {
    const response = await mindbodyAPI.get('/site/services');
    
    return {
      success: true,
      data: response.data.Services as MindbodyService[],
    };
  } catch (error) {
    console.error('Error fetching services:', error);
    return {
      success: false,
      error: 'Failed to fetch services',
    };
  }
};

export const getClasses = async (startDate: string, endDate: string) => {
  try {
    const response = await mindbodyAPI.get('/class/classes', {
      params: {
        StartDateTime: startDate,
        EndDateTime: endDate,
        HideCanceledClasses: true,
      },
    });
    
    return {
      success: true,
      data: response.data.Classes as MindbodyClass[],
    };
  } catch (error) {
    console.error('Error fetching classes:', error);
    return {
      success: false,
      error: 'Failed to fetch classes',
    };
  }
};

// Booking functions
export const bookAppointment = async (serviceId: number, staffId: number, startDateTime: string, clientId: string) => {
  try {
    const response = await mindbodyAPI.post('/appointment/addappointment', {
      ServiceId: serviceId,
      StaffId: staffId,
      StartDateTime: startDateTime,
      ClientId: clientId,
      Notes: 'Booked via Rebase Recovery website',
      SendEmail: true,
    });
    
    return {
      success: true,
      data: response.data.Appointment as MindbodyAppointment,
    };
  } catch (error) {
    console.error('Error booking appointment:', error);
    return {
      success: false,
      error: 'Failed to book appointment',
    };
  }
};

export const bookClass = async (classId: number, clientId: string) => {
  try {
    const response = await mindbodyAPI.post('/class/addclienttoclass', {
      ClassId: classId,
      ClientId: clientId,
      SendEmail: true,
      Waitlist: false,
    });
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Error booking class:', error);
    return {
      success: false,
      error: 'Failed to book class',
    };
  }
};

// Get client appointments
export const getClientAppointments = async (clientId: string, startDate?: string, endDate?: string) => {
  try {
    const response = await mindbodyAPI.get('/appointment/appointments', {
      params: {
        ClientIds: clientId,
        StartDate: startDate,
        EndDate: endDate,
      },
    });
    
    return {
      success: true,
      data: response.data.Appointments as MindbodyAppointment[],
    };
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return {
      success: false,
      error: 'Failed to fetch appointments',
    };
  }
};

// Cancel appointment
export const cancelAppointment = async (appointmentId: number, notes?: string) => {
  try {
    const response = await mindbodyAPI.post('/appointment/updateappointment', {
      AppointmentId: appointmentId,
      Action: 'Cancel',
      Notes: notes || 'Cancelled via Rebase Recovery website',
    });
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return {
      success: false,
      error: 'Failed to cancel appointment',
    };
  }
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

export default mindbodyAPI;