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
}

export interface MindbodyClass {
  id: string;
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
}): Promise<{ availableItems: AvailableItem[]; availableStaff: Staff[] }> {
  const searchParams = new URLSearchParams();
  searchParams.set('sessionTypeId', params.sessionTypeId);
  if (params.staffId) searchParams.set('staffId', params.staffId);
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/mindbody-availability?${searchParams.toString()}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch availability');
  }
  return response.json();
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
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: params.enabled !== false,
  });
}

export function useMindbodyAvailability(params: {
  sessionTypeId: string;
  staffId?: string;
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['mindbody-availability', params],
    queryFn: () => fetchAvailability(params),
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: params.enabled !== false && !!params.sessionTypeId,
  });
}
