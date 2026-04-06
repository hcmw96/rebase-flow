import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface Contract {
  id: number;
  name: string;
  startDate: string;
  endDate: string | null;
  autopayEnabled: boolean;
  agreementDate: string;
}

interface ClientService {
  id: number;
  name: string;
  remaining: number;
  expirationDate: string | null;
  paymentDate: string;
}

interface MembershipData {
  contracts: Contract[];
  clientServices: ClientService[];
}

export function useClientMembership() {
  const { mbSession, isAuthenticated } = useAuth();

  return useQuery<MembershipData>({
    queryKey: ['client-membership', mbSession?.sessionId],
    queryFn: async () => {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/mindbody-client-membership?sessionId=${mbSession!.sessionId}`
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch membership');
      }
      return res.json();
    },
    enabled: isAuthenticated && !!mbSession?.sessionId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
