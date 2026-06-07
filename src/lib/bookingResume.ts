import type { BookingServiceData } from '@/components/booking/BookingDrawer';
import type { AvailableItem } from '@/hooks/useMindbodyServices';

const STORAGE_KEY = 'rebase_pending_booking';
const LOCAL_BACKUP_KEY = 'rebase_pending_booking_backup';
const BACKUP_TTL_MS = 30 * 60 * 1000;
export const OAUTH_POPUP_SESSION_KEY = 'rebase_oauth_popup';

/** Saved appointment progress so OAuth / sign-up can return to confirm step. */
export interface PendingAppointmentState {
  currentStep: number;
  selectedVariantId?: string;
  /** yyyy-MM-dd */
  selectedDate?: string;
  selectedSlot?: AvailableItem;
}

export interface PendingBooking {
  version: 1;
  pathname: string;
  hash: string;
  service: BookingServiceData;
  selectedClassId?: string;
  appointment?: PendingAppointmentState;
}

function isValidPending(value: unknown): value is PendingBooking {
  const pending = value as PendingBooking;
  return pending?.version === 1 && Boolean(pending.service?.title);
}

function writeLocalBackup(payload: PendingBooking): void {
  try {
    localStorage.setItem(
      LOCAL_BACKUP_KEY,
      JSON.stringify({ storedAt: Date.now(), payload }),
    );
  } catch {
    /* private mode / quota */
  }
}

function readLocalBackup(): PendingBooking | null {
  try {
    const raw = localStorage.getItem(LOCAL_BACKUP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { storedAt?: number; payload?: PendingBooking };
    if (!parsed.storedAt || Date.now() - parsed.storedAt > BACKUP_TTL_MS) {
      localStorage.removeItem(LOCAL_BACKUP_KEY);
      return null;
    }
    if (isValidPending(parsed.payload)) {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(parsed.payload));
      } catch {
        /* ignore */
      }
      return parsed.payload;
    }
    return null;
  } catch {
    return null;
  }
}

function clearLocalBackup(): void {
  try {
    localStorage.removeItem(LOCAL_BACKUP_KEY);
  } catch {
    /* ignore */
  }
}

export function markOAuthUsedPopup(): void {
  try {
    sessionStorage.setItem(OAUTH_POPUP_SESSION_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function consumeOAuthUsedPopup(): boolean {
  try {
    const flag = sessionStorage.getItem(OAUTH_POPUP_SESSION_KEY) === '1';
    if (flag) sessionStorage.removeItem(OAUTH_POPUP_SESSION_KEY);
    return flag;
  } catch {
    return false;
  }
}

export function stashPendingBooking(
  service: BookingServiceData,
  options?: {
    selectedClassId?: string;
    appointment?: PendingAppointmentState;
    pathname?: string;
    hash?: string;
  },
): void {
  const payload: PendingBooking = {
    version: 1,
    pathname: options?.pathname ?? window.location.pathname,
    hash: options?.hash ?? window.location.hash,
    service,
    selectedClassId: options?.selectedClassId,
    appointment: options?.appointment,
  };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
  writeLocalBackup(payload);
}

export function peekPendingBooking(): PendingBooking | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PendingBooking;
      if (isValidPending(parsed)) return parsed;
    }
  } catch {
    /* fall through to local backup */
  }
  return readLocalBackup();
}

export function clearPendingBooking(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  clearLocalBackup();
}

export function takePendingBooking(): PendingBooking | null {
  const pending = peekPendingBooking();
  if (pending) clearPendingBooking();
  return pending;
}
