import { useQuery } from '@tanstack/react-query';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/** Hard cap so a hung edge/gateway never leaves calendars spinning for minutes. */
const AVAILABILITY_FETCH_TIMEOUT_MS = 25_000;
const CLASSES_FETCH_TIMEOUT_MS = 25_000;

export interface MindbodyService {
  id: string;
  name: string;
  description: string;
  defaultTimeLength: number;
  programId: number;
  programName: string;
  category: string;
  numDeducted: number;
  onlineDescription: string;
  price: number | null;
  /** Retail multi-session product from Mindbody pricing options (not a session type). */
  isPack?: boolean;
  packSessionCount?: number | null;
  linkedSessionTypeId?: number | null;
}

export interface MindbodyClass {
  id: string;
  /** Recurring schedule id for Mindbody consumer deep links (`sclassid`). */
  classScheduleId?: string | null;
  classDescriptionId: number;
  name: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  staffId: number;
  staffName: string | null;
  locationId: number;
  locationName: string;
  totalBooked: number;
  maxCapacity: number;
  webCapacity: number;
  availableSpots: number;
  isCanceled: boolean;
  isWaitlistAvailable: boolean;
  programId: number;
  programName: string;
}

export interface AvailableItem {
  id: string;
  staffId: number;
  staffName: string | null;
  locationId: number;
  locationName: string;
  sessionTypeId: number;
  sessionTypeName: string;
  startDateTime: string;
  endDateTime: string;
}

export interface Staff {
  id: number;
  name: string;
  imageUrl: string | null;
  bio: string | null;
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchServices(): Promise<MindbodyService[]> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/mindbody-services`);
  if (!response.ok) {
    throw new Error('Failed to fetch services');
  }
  const data = await response.json();
  return data.services || [];
}

async function fetchClasses(params: {
  startDate?: string;
  endDate?: string;
  classDescriptionId?: string;
  programId?: string;
}): Promise<MindbodyClass[]> {
  const searchParams = new URLSearchParams();
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);
  if (params.classDescriptionId) searchParams.set('classDescriptionId', params.classDescriptionId);
  if (params.programId) searchParams.set('programId', params.programId);

  const response = await fetchWithTimeout(
    `${SUPABASE_URL}/functions/v1/mindbody-classes?${searchParams.toString()}`,
    CLASSES_FETCH_TIMEOUT_MS,
  );
  if (!response.ok) {
    throw new Error('Failed to fetch classes');
  }
  const data = await response.json();
  return data.classes || [];
}

export async function fetchAvailability(params: {
  sessionTypeId: string;
  staffId?: string;
  startDate?: string;
  endDate?: string;
  /** `days` = light calendar keys only; `slots` = full bookable starts (use for one day). */
  view?: 'days' | 'slots';
}): Promise<{ availableItems: AvailableItem[]; availableDays: string[]; availableStaff: Staff[] }> {
  const searchParams = new URLSearchParams();
  searchParams.set('sessionTypeId', params.sessionTypeId);
  if (params.staffId) searchParams.set('staffId', params.staffId);
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);
  if (params.view) searchParams.set('view', params.view);

  const url = `${SUPABASE_URL}/functions/v1/mindbody-availability?${searchParams.toString()}`;
  // One retry only on 502/503/504 — never 3×3 a multi‑tens‑of‑seconds crawl.
  const maxAttempts = 2;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetchWithTimeout(url, AVAILABILITY_FETCH_TIMEOUT_MS);
      if (response.status === 502 || response.status === 503 || response.status === 504) {
        throw new Error(`Availability temporarily unavailable (${response.status})`);
      }
      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }
      const data = await response.json();
      const availableItems: AvailableItem[] = data.availableItems ?? [];
      let availableDays: string[] = data.availableDays ?? [];
      // Older edge builds omitted availableDays — derive so calendars never go blank.
      if (!availableDays.length && availableItems.length) {
        const keys = new Set<string>();
        for (const item of availableItems) {
          const raw = item.startDateTime?.slice(0, 10);
          if (raw) keys.add(raw);
        }
        availableDays = Array.from(keys).sort();
      }
      return {
        availableItems,
        availableDays,
        availableStaff: data.availableStaff ?? [],
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Failed to fetch availability');
      const retryable =
        lastError.name === 'AbortError' ||
        /temporarily unavailable \(50[234]\)/.test(lastError.message);
      if (!retryable || attempt === maxAttempts) break;
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }

  throw lastError ?? new Error('Failed to fetch availability');
}

export function useMindbodyServices() {
  return useQuery({
    queryKey: ['mindbody-services'],
    queryFn: fetchServices,
    staleTime: 30 * 60 * 1000, // 30 minutes — service list rarely changes
    gcTime: 60 * 60 * 1000, // keep in cache for 1 hour
    refetchOnWindowFocus: false,
  });
}

export function useMindbodyClasses(params: {
  startDate?: string;
  endDate?: string;
  classDescriptionId?: string;
  programId?: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['mindbody-classes', params],
    queryFn: () => fetchClasses(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    enabled: params.enabled !== false,
    retry: 1,
    retryDelay: 800,
  });
}

export function useMindbodyAvailability(params: {
  sessionTypeId: string;
  staffId?: string;
  startDate?: string;
  endDate?: string;
  view?: 'days' | 'slots';
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['mindbody-availability', params],
    queryFn: () => fetchAvailability(params),
    staleTime: 10 * 60 * 1000, // 10 minutes — calendars change slowly; matches edge days TTL
    refetchOnWindowFocus: false,
    enabled: params.enabled !== false && !!params.sessionTypeId,
    retry: 1,
    retryDelay: 800,
  });
}
