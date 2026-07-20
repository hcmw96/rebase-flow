import { useQuery } from '@tanstack/react-query';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

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

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/mindbody-classes?${searchParams.toString()}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch classes');
  }
  const data = await response.json();
  return data.classes || [];
}

async function fetchAvailability(params: {
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
  const maxAttempts = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url);
      // Transient edge/Mindbody failures — retry rather than show an empty calendar.
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
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
      }
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
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    enabled: params.enabled !== false && !!params.sessionTypeId,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
  });
}
