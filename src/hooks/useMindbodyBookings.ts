import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function parseFunctionError(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.error === 'string' && body.error) return body.error;
    if (typeof body?.message === 'string' && body.message) return body.message;
  } catch {
    /* non-JSON body */
  }
  return response.status === 401
    ? 'Booking request was rejected. Please sign in and try again.'
    : `${fallback} (${response.status})`;
}

export interface Booking {
  id: string;
  type: 'appointment' | 'class';
  serviceName: string;
  staffName: string | null;
  locationName: string | null;
  startTime: string;
  endTime: string;
  status: string;
  classId?: string;
}

interface BookingParams {
  bookingType: 'class' | 'appointment';
  classId?: string;
  sessionTypeId?: string;
  staffId?: string;
  staffName?: string | null;
  locationId?: number;
  locationName?: string | null;
  startDateTime?: string;
  endDateTime?: string;
  serviceName?: string;
  idempotencyKey?: string;
}

interface CancelParams {
  bookingType: 'class' | 'appointment';
  bookingId?: string;
  classId?: string;
  appointmentId?: string;
}

export function useMyBookings() {
  const { mbSession, isAuthenticated, logout } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['my-bookings', mbSession?.sessionId],
    queryFn: async () => {
      if (!mbSession?.sessionId) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/mindbody-my-bookings?sessionId=${mbSession.sessionId}`
      );
      
      if (!response.ok) {
        const error = await response.json();
        if (error.error === 'Session not found. Please log in again.') {
          localStorage.removeItem('mb_session');
          queryClient.removeQueries({ queryKey: ['my-bookings'] });
          queryClient.removeQueries({ queryKey: ['client-membership'] });
          logout();
          return { bookings: [], localBookings: [], user: null };
        }
        throw new Error(error.error || 'Failed to fetch bookings');
      }
      
      const data = await response.json();
      if (data.requiresLogin) {
        queryClient.removeQueries({ queryKey: ['my-bookings'] });
        queryClient.removeQueries({ queryKey: ['client-membership'] });
        logout();
        return { bookings: [], localBookings: [], user: null };
      }
      return data;
    },
    enabled: isAuthenticated && !!mbSession?.sessionId,
    staleTime: 30 * 1000,
    retry: false,
  });
}

export function useBookService() {
  const { mbSession } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: BookingParams) => {
      if (!mbSession?.sessionId) {
        throw new Error('Please sign in to book');
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/mindbody-book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: mbSession.sessionId,
          ...params,
        }),
      });

      if (!response.ok) {
        const message = await parseFunctionError(response, 'Failed to book');
        throw new Error(message);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
  });
}

export function useCancelBooking() {
  const { mbSession } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CancelParams) => {
      if (!mbSession?.sessionId) {
        throw new Error('Please sign in to cancel');
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/mindbody-cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: mbSession.sessionId,
          ...params,
        }),
      });

      if (!response.ok) {
        const message = await parseFunctionError(response, 'Failed to cancel');
        throw new Error(message);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
  });
}
