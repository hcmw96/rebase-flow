import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { BookingMutationError } from '@/lib/bookingMutationError';
import { supabaseFunctionHeaders } from '@/lib/supabaseFunctions';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const PURCHASE_IN_PROGRESS_RETRY_DELAY_MS = 2000;
const PURCHASE_IN_PROGRESS_MAX_RETRIES = 6;

export function usePurchaseContrastPass() {
  const { mbSession, refreshMbSession } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const session = await refreshMbSession();
      if (!session?.sessionId) {
        throw new BookingMutationError('Please sign in with Mindbody to continue.', {
          requiresLogin: true,
        });
      }

      const body = JSON.stringify({
        sessionId: session.sessionId,
        productId,
      });

      for (let attempt = 0; attempt <= PURCHASE_IN_PROGRESS_MAX_RETRIES; attempt++) {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/mindbody-purchase-pass`, {
          method: 'POST',
          headers: supabaseFunctionHeaders({ 'Content-Type': 'application/json' }),
          body,
        });

        if (response.status === 409) {
          const retryBody = await response.json().catch(() => ({}));
          if (retryBody?.purchaseInProgress && attempt < PURCHASE_IN_PROGRESS_MAX_RETRIES) {
            await new Promise((resolve) => setTimeout(resolve, PURCHASE_IN_PROGRESS_RETRY_DELAY_MS));
            continue;
          }
          throw new BookingMutationError(
            (typeof retryBody?.error === 'string' && retryBody.error) ||
              'Your purchase is already being processed. Please wait a moment.',
            { purchaseInProgress: true },
          );
        }

        if (!response.ok) {
          let retryBody: Record<string, unknown> = {};
          try {
            retryBody = await response.json();
          } catch {
            /* ignore */
          }
          const message =
            (typeof retryBody.error === 'string' && retryBody.error) ||
            `Purchase failed (${response.status})`;
          throw new BookingMutationError(message, {
            paymentRequired: Boolean(retryBody.paymentRequired),
            requiresLogin: Boolean(retryBody.requiresLogin),
            noStoredCard: Boolean(retryBody.noStoredCard),
          });
        }

        return response.json() as Promise<{
          success: boolean;
          productName: string;
          amountGbp: number;
          validityDays: number;
          idempotent?: boolean;
        }>;
      }

      throw new BookingMutationError(
        'Your purchase is still being processed. Please wait and check your account.',
        { purchaseInProgress: true },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-membership'] });
      queryClient.invalidateQueries({ queryKey: ['mindbody-services'] });
    },
  });
}
