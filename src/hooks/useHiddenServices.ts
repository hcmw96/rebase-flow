import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface HiddenService {
  id: string;
  service_id: string;
  service_name: string | null;
  hidden_at: string;
}

export function useHiddenServices() {
  return useQuery({
    queryKey: ['hidden-services'],
    queryFn: async (): Promise<HiddenService[]> => {
      const { data, error } = await supabase
        .from('hidden_services')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useHideServices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (services: { id: string; name: string }[]) => {
      const { error } = await supabase
        .from('hidden_services')
        .insert(
          services.map((s) => ({
            service_id: s.id,
            service_name: s.name,
          }))
        );
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hidden-services'] });
    },
  });
}

export function useUnhideService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (serviceId: string) => {
      const { error } = await supabase
        .from('hidden_services')
        .delete()
        .eq('service_id', serviceId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hidden-services'] });
    },
  });
}
