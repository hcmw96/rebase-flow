import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface Contract {
  id: number;
  name: string;
  startDate: string;
  endDate: string | null;
  autopayEnabled: boolean;
  agreementDate: string;
}

export interface ClientService {
  id: number;
  name: string;
  remaining: number;
  expirationDate: string | null;
  paymentDate: string;
}

export interface Membership {
  id: number | null;
  membershipId: number | null;
  name: string;
  programId: number | null;
  active: boolean;
  autoRenewing: boolean;
  activeDate: string | null;
  expirationDate: string | null;
  remaining: number | null;
  paymentDate: string | null;
}

export interface MembershipData {
  contracts: Contract[];
  clientServices: ClientService[];
  memberships: Membership[];
  membershipIcon?: number | null;
}

export function useClientMembership() {
  const { mbSession, isAuthenticated, logout } = useAuth();

  return useQuery<MembershipData>({
    queryKey: ['client-membership', mbSession?.sessionId],
    queryFn: async () => {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/mindbody-client-membership?sessionId=${mbSession!.sessionId}`
      );
      if (!res.ok) {
        const err = await res.json();
        if (err.error === 'Session not found. Please log in again.') {
          logout();
          return { contracts: [], clientServices: [], memberships: [], membershipIcon: null };
        }
        throw new Error(err.error || 'Failed to fetch membership');
      }
      const data = await res.json();
      return {
        contracts: data.contracts ?? [],
        clientServices: data.clientServices ?? [],
        memberships: data.memberships ?? [],
        membershipIcon: data.membershipIcon ?? null,
      };
    },
    enabled: isAuthenticated && !!mbSession?.sessionId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useHasActiveMembership(): boolean {
  const { data } = useClientMembership();
  return Boolean(
    (data?.memberships?.length ?? 0) > 0 ||
    (data?.contracts?.length ?? 0) > 0
  );
}
