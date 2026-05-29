export interface MindbodyService {
  id: string;
  name: string;
  description: string;
  defaultTimeLength: number;
  programId: number;
  programName: string;
  category: string;
  numDeducted: number;
  onlineDescription: string;
  price: number | null;
  isPack?: boolean;
  packSessionCount?: number | null;
  linkedSessionTypeId?: number | null;
}

export interface AvailableItem {
  id: string;
  staffId: number;
  staffName: string | null;
  locationId: number;
  locationName: string;
  sessionTypeId: number;
  sessionTypeName: string;
  startDateTime: string;
  endDateTime: string;
}

export interface Staff {
  id: number;
  name: string;
  imageUrl: string | null;
  bio: string | null;
}

export interface BookingParams {
  sessionId: string;
  bookingType: 'class' | 'appointment';
  classId?: string;
  sessionTypeId?: string;
  staffId?: string;
  locationId?: number;
  startDateTime?: string;
  endDateTime?: string;
  serviceName?: string;
}

export function createApiClient(baseUrl: string) {
  return {
    async getServices(): Promise<MindbodyService[]> {
      const response = await fetch(`${baseUrl}/functions/v1/mindbody-services`);
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      const data = await response.json();
      return data.services || [];
    },

    async getAvailability(params: {
      sessionTypeId: string;
      staffId?: string;
      startDate?: string;
      endDate?: string;
    }): Promise<{ availableItems: AvailableItem[]; availableStaff: Staff[] }> {
      const searchParams = new URLSearchParams();
      searchParams.set('sessionTypeId', params.sessionTypeId);
      if (params.staffId) searchParams.set('staffId', params.staffId);
      if (params.startDate) searchParams.set('startDate', params.startDate);
      if (params.endDate) searchParams.set('endDate', params.endDate);

      const response = await fetch(
        `${baseUrl}/functions/v1/mindbody-availability?${searchParams.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }
      return response.json();
    },

    async bookService(params: BookingParams): Promise<{ success: boolean; booking?: any; error?: string }> {
      const response = await fetch(`${baseUrl}/functions/v1/mindbody-book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to book');
      }

      return response.json();
    },

    async cancelBooking(params: {
      sessionId: string;
      bookingType: 'class' | 'appointment';
      bookingId?: string;
      classId?: string;
      appointmentId?: string;
    }): Promise<{ success: boolean }> {
      const response = await fetch(`${baseUrl}/functions/v1/mindbody-cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel');
      }

      return response.json();
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
