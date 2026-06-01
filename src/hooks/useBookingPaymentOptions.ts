import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  buildCommunalContrastPaymentOptions,
  isCommunalContrastService,
  type BookingPaymentOption,
} from '@/lib/bookingPaymentOptions';
import { fetchServices } from '@/hooks/useMindbodyServices';

export function useBookingPaymentOptions(serviceName: string | undefined | null): {
  options: BookingPaymentOption[];
  isLoading: boolean;
  applies: boolean;
} {
  const applies = isCommunalContrastService(serviceName);

  const { data: services, isLoading } = useQuery({
    queryKey: ['mindbody-services'],
    queryFn: fetchServices,
    staleTime: 30 * 60 * 1000,
    enabled: applies,
  });

  const options = useMemo(() => {
    if (!applies) return [];
    return buildCommunalContrastPaymentOptions(services);
  }, [applies, services]);

  return { options, isLoading, applies };
}
