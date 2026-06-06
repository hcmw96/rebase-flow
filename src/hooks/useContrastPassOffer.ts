import { useMemo } from 'react';
import { useMemo } from 'react';
import { CONTRAST_PASS_OFFER, isContrastPassSaleActive } from '@/config/contrastPassOffer';
import { findContrastPassProduct } from '@/lib/mindbodyProducts';
import { fetchServices } from '@/hooks/useMindbodyServices';
import { useQuery } from '@tanstack/react-query';

export { findContrastPassProduct };

export function useContrastPassOffer() {
  const saleActive = isContrastPassSaleActive();

  const { data: services, isLoading } = useQuery({
    queryKey: ['mindbody-services'],
    queryFn: fetchServices,
    staleTime: 30 * 60 * 1000,
  });

  const product = useMemo(() => findContrastPassProduct(services), [services]);

  const displayPrice =
    product?.price != null && product.price > 0 ? product.price : CONTRAST_PASS_OFFER.priceGbp;

  return {
    saleActive,
    product,
    displayPrice,
    isLoading,
  };
}
