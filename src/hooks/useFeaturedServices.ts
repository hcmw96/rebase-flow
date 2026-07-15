import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FeaturedService {
  id: string;
  service_id: string;
  service_name: string | null;
  display_order: number | null;
  label: string | null;
  created_at: string;
}

async function fetchFeaturedServices(): Promise<FeaturedService[]> {
  const { data, error } = await supabase
    .from('featured_services')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching featured services:', error);
    throw error;
  }

  return data || [];
}

async function addFeaturedService(service: { service_id: string; service_name: string; label?: string }) {
  const { data: existing } = await supabase
    .from('featured_services')
    .select('id')
    .eq('service_id', service.service_id)
    .single();

  if (existing) {
    throw new Error('Service is already featured');
  }

  const { data: maxOrder } = await supabase
    .from('featured_services')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .single();

  const newOrder = (maxOrder?.display_order ?? -1) + 1;

  const { data, error } = await supabase
    .from('featured_services')
    .insert({
      service_id: service.service_id,
      service_name: service.service_name,
      label: service.label || 'Popular',
      display_order: newOrder,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding featured service:', error);
    throw error;
  }

  return data;
}

async function removeFeaturedService(serviceId: string) {
  const { error } = await supabase
    .from('featured_services')
    .delete()
    .eq('service_id', serviceId);

  if (error) {
    console.error('Error removing featured service:', error);
    throw error;
  }
}

export function useFeaturedServices() {
  return useQuery({
    queryKey: ['featured-services'],
    queryFn: fetchFeaturedServices,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useAddFeaturedService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addFeaturedService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-services'] });
    },
  });
}

export function useRemoveFeaturedService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeFeaturedService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featured-services'] });
    },
  });
}
