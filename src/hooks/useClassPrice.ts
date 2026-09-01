import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface ClassPrice {
  /** null when Mindbody exposes no bookable pricing option — never charge in that state. */
  priceGbp: number | null;
  optionName?: string;
  serviceId?: number;
  pass: { name: string; remaining: number | null } | null;
  unavailable?: boolean;
}

/**
 * The price for a specific class instance, resolved server-side by the same
 * code that takes the payment. Confirm is gated on this resolving — the
 * customer is never asked to commit to an undisclosed amount.
 */
export function useClassPrice(params: {
  classId: string | null | undefined;
  locationId?: number | null;
  serviceName?: string | null;
  enabled?: boolean;
}) {
  const { mbSession } = useAuth();
  const { classId, locationId, serviceName, enabled = true } = params;

  return useQuery<ClassPrice>({
    queryKey: ['class-price', classId, locationId ?? null, serviceName ?? null, mbSession?.sessionId ?? null],
    queryFn: async () => {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/mindbody-class-price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: mbSession?.sessionId ?? null,
          classId,
          locationId: locationId ?? null,
          serviceName: serviceName ?? null,
        }),
      });
      if (!res.ok) throw new Error('Failed to fetch class price');
      const data = await res.json();
      return {
        priceGbp: typeof data.priceGbp === 'number' ? data.priceGbp : null,
        optionName: data.optionName,
        serviceId: data.serviceId,
        pass: data.pass ?? null,
        unavailable: Boolean(data.unavailable),
      };
    },
    enabled: enabled && !!classId,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
