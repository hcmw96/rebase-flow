import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { BookingMutationError } from '@/lib/bookingMutationError';
import { supabaseFunctionHeaders } from '@/lib/supabaseFunctions';
import { isJuneContrastPassName } from '@/lib/contrastPassUsage';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForPassOnMembership(sessionId: string, attempts = 4, delayMs = 2000) {
  for (let i = 0; i < attempts; i++) {
    await sleep(delayMs);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/mindbody-client-membership?sessionId=${encodeURIComponent(sessionId)}`,
      );
      if (!res.ok) continue;
      const data = await res.json();
      const services = data.clientServices || [];
      const pass = services.find(
        (s: { name?: string; remaining?: number }) =>
          isJuneContrastPassName(s.name || '') && (s.remaining == null || s.remaining > 0),
      );
      if (pass) {
        return {
          success: true as const,
          productName: pass.name as string,
          amountGbp: 0,
          validityDays: 0,
          idempotent: true as const,
        };
      }
    } catch {
      /* keep waiting */
    }
  }
  return null;
}

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

      const response = await fetch(`${SUPABASE_URL}/functions/v1/mindbody-purchase-pass`, {
        method: 'POST',
        headers: supabaseFunctionHeaders({ 'Content-Type': 'application/json' }),
        body,
      });

      if (response.status === 409) {
        const retryBody = await response.json().catch(() => ({}));
        if (retryBody?.purchaseInProgress) {
          const fromPoll = await waitForPassOnMembership(session.sessionId);
          if (fromPoll) return fromPoll;

          const recovery = await fetch(`${SUPABASE_URL}/functions/v1/mindbody-purchase-pass`, {
            method: 'POST',
            headers: supabaseFunctionHeaders({ 'Content-Type': 'application/json' }),
            body,
          });
          if (recovery.ok) {
            return recovery.json() as Promise<{
              success: boolean;
              productName: string;
              amountGbp: number;
              validityDays: number;
              idempotent?: boolean;
            }>;
          }
          if (recovery.status === 409) {
            const after = await waitForPassOnMembership(session.sessionId, 3, 2000);
            if (after) return after;
          }

          throw new BookingMutationError(
            (typeof retryBody?.error === 'string' && retryBody.error) ||
              'Your purchase is already being processed. Please wait a moment and check your account.',
            { purchaseInProgress: true },
          );
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-membership'] });
      queryClient.invalidateQueries({ queryKey: ['mindbody-services'] });
    },
  });
}
