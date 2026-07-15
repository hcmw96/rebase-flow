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
  idempotencyKey?: string;
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
      const body = JSON.stringify(params);
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

      const postBook = () =>
        fetch(`${baseUrl}/functions/v1/mindbody-book`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });

      const waitForMatch = async (attempts: number) => {
        for (let i = 0; i < attempts; i++) {
          await sleep(2000);
          try {
            const res = await fetch(
              `${baseUrl}/functions/v1/mindbody-my-bookings?sessionId=${encodeURIComponent(params.sessionId)}`,
            );
            if (!res.ok) continue;
            const data = await res.json();
            const bookings = data.bookings || [];
            const match = bookings.find((b: any) => {
              if (String(b.status || '').toLowerCase() === 'cancelled') return false;
              if (params.bookingType === 'class') {
                return (
                  (params.classId &&
                    (b.classId?.toString() === params.classId || b.id === params.classId)) ||
                  (b.type === 'class' && b.startTime === params.startDateTime)
                );
              }
              return b.type === 'appointment' && b.startTime === params.startDateTime;
            });
            if (match) {
              return {
                success: true,
                booking: match,
                idempotent: true,
              };
            }
          } catch {
            /* continue */
          }
        }
        return null;
      };

      const response = await postBook();

      if (response.status === 409) {
        const retryBody = await response.json().catch(() => ({}));
        if (retryBody?.bookingInProgress) {
          const fromPoll = await waitForMatch(4);
          if (fromPoll) return fromPoll;
          const recovery = await postBook();
          if (recovery.ok) return recovery.json();
          if (recovery.status === 409) {
            const after = await waitForMatch(3);
            if (after) return after;
          } else if (!recovery.ok) {
            const error = await recovery.json().catch(() => ({}));
            throw new Error(error.error || 'Failed to book');
          }
        }
        throw new Error(
          (typeof retryBody?.error === 'string' && retryBody.error) ||
            'Your booking is already being processed. Please wait a moment.',
        );
      }

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
