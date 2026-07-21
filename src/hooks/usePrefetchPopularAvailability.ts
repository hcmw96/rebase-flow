import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useMindbodyServices,
  fetchAvailability,
  type MindbodyService,
} from '@/hooks/useMindbodyServices';
import {
  bookingHorizonDateRange,
  bookingNearHorizonDateRange,
} from '@/lib/bookingHorizon';
import { canonicalizeServiceName } from '@/config/serviceConfig';

/** Warm the calendars guests hit most — cold Premium Suite was the angry-client path. */
const PREFETCH_GROUPS = new Set([
  'Premium Suite',
  'Infrared Suite',
  'Cryotherapy',
  'Hyperbaric Oxygen',
]);

const MAX_PREFETCH_IDS = 8;

function pickPrefetchSessionIds(services: MindbodyService[]): string[] {
  const byGroup = new Map<string, MindbodyService[]>();
  for (const svc of services) {
    if (svc.isPack) continue;
    const group = canonicalizeServiceName(svc.name);
    const low = svc.name.toLowerCase();
    const resolved =
      PREFETCH_GROUPS.has(group)
        ? group
        : /infrared\s*suite/.test(low)
          ? 'Infrared Suite'
          : /premium\s*suite/.test(low)
            ? 'Premium Suite'
            : null;
    if (!resolved) continue;
    const list = byGroup.get(resolved) ?? [];
    list.push(svc);
    byGroup.set(resolved, list);
  }

  const ids: string[] = [];
  for (const group of PREFETCH_GROUPS) {
    const list = byGroup.get(group);
    if (!list?.length) continue;
    // Prefer standard 60-min consumer offerings over corporate / midday variants.
    const ranked = [...list].sort((a, b) => {
      const aCorp = /corporate|midday|reset/i.test(a.name) ? 1 : 0;
      const bCorp = /corporate|midday|reset/i.test(b.name) ? 1 : 0;
      if (aCorp !== bCorp) return aCorp - bCorp;
      return (a.defaultTimeLength || 999) - (b.defaultTimeLength || 999);
    });
    for (const svc of ranked.slice(0, 2)) {
      if (ids.length >= MAX_PREFETCH_IDS) return ids;
      ids.push(String(svc.id));
    }
  }
  return ids;
}

/**
 * Prefetch near (then full) calendar day-keys for popular suites while the guest
 * browses — so opening Premium Suite hits warm React Query + edge cache.
 */
export function usePrefetchPopularAvailability() {
  const queryClient = useQueryClient();
  const { data: services } = useMindbodyServices();
  const started = useRef(false);

  useEffect(() => {
    if (!services?.length || started.current) return;
    started.current = true;

    const ids = pickPrefetchSessionIds(services);
    if (!ids.length) return;

    const near = bookingNearHorizonDateRange();
    const full = bookingHorizonDateRange();

    const run = async () => {
      await Promise.all(
        ids.map((sessionTypeId) => {
          const params = {
            sessionTypeId,
            startDate: near.startDate,
            endDate: near.endDate,
            view: 'days' as const,
          };
          return queryClient.prefetchQuery({
            queryKey: ['mindbody-availability', params],
            queryFn: () => fetchAvailability(params),
            staleTime: 10 * 60 * 1000,
          });
        }),
      );

      await Promise.all(
        ids.map((sessionTypeId) => {
          const params = {
            sessionTypeId,
            startDate: full.startDate,
            endDate: full.endDate,
            view: 'days' as const,
          };
          return queryClient.prefetchQuery({
            queryKey: ['mindbody-availability', params],
            queryFn: () => fetchAvailability(params),
            staleTime: 10 * 60 * 1000,
          });
        }),
      );
    };

    const t = window.setTimeout(() => {
      void run();
    }, 600);
    return () => window.clearTimeout(t);
  }, [services, queryClient]);
}

