import type { BookingServiceData } from '@/components/booking/BookingDrawer';

const STORAGE_KEY = 'rebase_pending_booking';

export interface PendingBooking {
  version: 1;
  pathname: string;
  hash: string;
  service: BookingServiceData;
  selectedClassId?: string;
}

export function stashPendingBooking(
  service: BookingServiceData,
  options?: { selectedClassId?: string; pathname?: string; hash?: string },
): void {
  const payload: PendingBooking = {
    version: 1,
    pathname: options?.pathname ?? window.location.pathname,
    hash: options?.hash ?? window.location.hash,
    service,
    selectedClassId: options?.selectedClassId,
  };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

export function peekPendingBooking(): PendingBooking | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingBooking;
    if (parsed?.version !== 1 || !parsed.service?.title) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingBooking(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function takePendingBooking(): PendingBooking | null {
  const pending = peekPendingBooking();
  if (pending) clearPendingBooking();
  return pending;
}
