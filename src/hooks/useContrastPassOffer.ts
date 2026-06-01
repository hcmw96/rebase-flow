import { useMemo } from 'react';
import { CONTRAST_PASS_OFFER, isContrastPassSaleActive } from '@/config/contrastPassOffer';
import { mindbodyBuySaleServiceUrl, mindbodyCatalogUrl, REBASE_MINDBODY_SITE_ID } from '@/lib/mindbodyAuth';
import { findContrastPassProduct } from '@/lib/mindbodyProducts';
import { fetchServices } from '@/hooks/useMindbodyServices';
import { useQuery } from '@tanstack/react-query';

function resolveSiteId(): string {
  return import.meta.env.VITE_MINDBODY_SITE_ID?.trim() || REBASE_MINDBODY_SITE_ID;
}

export { findContrastPassProduct };

export function useContrastPassOffer() {
  const siteId = resolveSiteId();
  const saleActive = isContrastPassSaleActive();

  const { data: services, isLoading } = useQuery({
    queryKey: ['mindbody-services'],
    queryFn: fetchServices,
    staleTime: 30 * 60 * 1000,
  });

  const product = useMemo(() => findContrastPassProduct(services), [services]);

  const buyUrl = useMemo(() => {
    if (product?.id) return mindbodyBuySaleServiceUrl(siteId, product.id);
    return mindbodyCatalogUrl(siteId);
  }, [product?.id, siteId]);

  const displayPrice =
    product?.price != null && product.price > 0 ? product.price : CONTRAST_PASS_OFFER.priceGbp;

  return {
    saleActive,
    product,
    buyUrl,
    displayPrice,
    isLoading,
    catalogUrl: mindbodyCatalogUrl(siteId),
  };
}
