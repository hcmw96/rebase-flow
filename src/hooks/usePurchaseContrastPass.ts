import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { BookingMutationError } from '@/lib/bookingMutationError';
import { supabaseFunctionHeaders } from '@/lib/supabaseFunctions';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

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

      const response = await fetch(`${SUPABASE_URL}/functions/v1/mindbody-purchase-pass`, {
        method: 'POST',
        headers: supabaseFunctionHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          sessionId: session.sessionId,
          productId,
        }),
      });

      if (!response.ok) {
        let body: Record<string, unknown> = {};
        try {
          body = await response.json();
        } catch {
          /* ignore */
        }
        const message =
          (typeof body.error === 'string' && body.error) ||
          `Purchase failed (${response.status})`;
        throw new BookingMutationError(message, {
          paymentRequired: Boolean(body.paymentRequired),
          requiresLogin: Boolean(body.requiresLogin),
          noStoredCard: Boolean(body.noStoredCard),
        });
      }

      return response.json() as Promise<{
        success: boolean;
        productName: string;
        amountGbp: number;
        validityDays: number;
      }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-membership'] });
      queryClient.invalidateQueries({ queryKey: ['mindbody-services'] });
    },
  });
}
