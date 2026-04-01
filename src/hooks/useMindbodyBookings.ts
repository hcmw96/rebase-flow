import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

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
  locationId?: number;
  startDateTime?: string;
  endDateTime?: string;
  serviceName?: string;
}

interface CancelParams {
  bookingType: 'class' | 'appointment';
  bookingId?: string;
  classId?: string;
  appointmentId?: string;
}

export function useMyBookings() {
  const { mbSession, isAuthenticated } = useAuth();

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
        throw new Error(error.error || 'Failed to fetch bookings');
      }
      
      return response.json();
    },
    enabled: isAuthenticated && !!mbSession?.sessionId,
    staleTime: 30 * 1000,
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
        const error = await response.json();
        throw new Error(error.error || 'Failed to book');
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
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
  });
}
