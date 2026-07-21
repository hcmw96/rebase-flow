import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { BookingMutationError } from '@/lib/bookingMutationError';
import { parseMindbodyDateTime } from '@/lib/sessionTimes';
import { supabaseFunctionHeaders } from '@/lib/supabaseFunctions';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function parseFunctionError(response: Response, fallback: string): Promise<never> {
  try {
    const body = await response.json();
    const message =
      (typeof body?.error === 'string' && body.error) ||
      (typeof body?.message === 'string' && body.message) ||
      `${fallback} (${response.status})`;

    throw new BookingMutationError(message, {
      paymentRequired: Boolean(body?.paymentRequired),
      requiresLogin: Boolean(body?.requiresLogin) || response.status === 401,
      siteScopeIssue: Boolean(body?.siteScopeIssue),
      noPassOnFile: Boolean(body?.noPassOnFile),
      noStoredCard: Boolean(body?.noStoredCard),
      storedCardUnavailable: Boolean(body?.storedCardUnavailable),
      cardDeclined: Boolean(body?.cardDeclined),
      bookingInProgress: Boolean(body?.bookingInProgress),
      bookingOutcomeUncertain: Boolean(body?.bookingOutcomeUncertain),
      slotUnavailable: Boolean(body?.slotUnavailable),
    });
  } catch (e) {
    if (e instanceof BookingMutationError) throw e;
  }
  if (response.status === 401) {
    throw new BookingMutationError('Session expired. Please log in again.', { requiresLogin: true });
  }
  throw new BookingMutationError(`${fallback} (${response.status})`);
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

type BookResult = {
  success: boolean;
  booking?: {
    id?: string;
    mindbodyId?: string;
    serviceName?: string;
    startTime?: string;
    status?: string;
  };
  payment?: { method: 'pass' | 'stored_card'; amountGbp?: number; listPriceGbp?: number };
  idempotent?: boolean;
  confirmationEmailSent?: boolean;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function sameInstant(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  const ta = parseMindbodyDateTime(a).getTime();
  const tb = parseMindbodyDateTime(b).getTime();
  return Number.isFinite(ta) && Number.isFinite(tb) && ta === tb;
}

/** After a 409, poll My Bookings instead of re-hitting mindbody-book. */
async function waitForMatchingBooking(
  sessionId: string,
  params: BookingParams,
  attempts: number,
  delayMs: number,
): Promise<BookResult | null> {
  for (let i = 0; i < attempts; i++) {
    await sleep(delayMs);
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/mindbody-my-bookings?sessionId=${encodeURIComponent(sessionId)}`,
      );
      if (!response.ok) continue;
      const data = await response.json();
      const bookings: Booking[] = data.bookings || [];
      const match = bookings.find((b) => {
        if (String(b.status || '').toLowerCase() === 'cancelled') return false;
        if (params.bookingType === 'class') {
          if (params.classId && (b.classId?.toString() === params.classId || b.id === params.classId)) {
            return true;
          }
          return b.type === 'class' && sameInstant(b.startTime, params.startDateTime);
        }
        return b.type === 'appointment' && sameInstant(b.startTime, params.startDateTime);
      });
      if (match) {
        return {
          success: true,
          booking: {
            id: match.id,
            mindbodyId: match.id,
            serviceName: match.serviceName,
            startTime: match.startTime,
            status: match.status,
          },
          idempotent: true,
        };
      }
    } catch {
      /* keep waiting */
    }
  }
  return null;
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
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

async function postBook(sessionId: string, params: BookingParams): Promise<Response> {
  return fetch(`${SUPABASE_URL}/functions/v1/mindbody-book`, {
    method: 'POST',
    headers: supabaseFunctionHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      sessionId,
      ...params,
    }),
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

      const sessionId = mbSession.sessionId;

      const response = await postBook(sessionId, params);

      if (response.status === 409) {
        const retryBody = await response.json().catch(() => ({}));
        if (retryBody?.bookingOutcomeUncertain) {
          // Mindbody may have booked despite the error — recover quietly.
          const recovered = await waitForMatchingBooking(sessionId, params, 5, 1500);
          if (recovered) return recovered;
          throw new BookingMutationError(
            (typeof retryBody?.error === 'string' && retryBody.error) ||
              "Mindbody couldn't confirm this booking after processing the request. Please do not retry — email reception@rebaserecovery.com.",
            { bookingOutcomeUncertain: true },
          );
        }
        if (retryBody?.slotUnavailable) {
          throw new BookingMutationError(
            (typeof retryBody?.error === 'string' && retryBody.error) ||
              'That time was just taken. Pick another slot and try again.',
            { slotUnavailable: true },
          );
        }
        if (retryBody?.bookingInProgress) {
          // Prefer wait/poll over re-charging Mindbody with repeated book POSTs.
          const fromPoll = await waitForMatchingBooking(sessionId, params, 4, 2000);
          if (fromPoll) return fromPoll;

          // One recovery POST in case the first claim expired without finishing.
          const recovery = await postBook(sessionId, params);
          if (recovery.ok) {
            return recovery.json() as Promise<BookResult>;
          }
          if (recovery.status === 409) {
            const afterRecovery = await waitForMatchingBooking(sessionId, params, 3, 2000);
            if (afterRecovery) return afterRecovery;
          } else if (!recovery.ok) {
            await parseFunctionError(recovery, 'Failed to book');
          }

          throw new BookingMutationError(
            (typeof retryBody?.error === 'string' && retryBody.error) ||
              'Your booking is already being processed. Please wait a moment and check My Bookings.',
            { bookingInProgress: true },
          );
        }
        throw new BookingMutationError(
          (typeof retryBody?.error === 'string' && retryBody.error) ||
            'Your booking is already being processed. Please wait a moment.',
          { bookingInProgress: true },
        );
      }

      if (!response.ok) {
        await parseFunctionError(response, 'Failed to book');
      }

      return response.json() as Promise<BookResult>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
    retry: false,
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
        await parseFunctionError(response, 'Failed to cancel');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
  });
}
