import type { MembershipPlanId } from '@/config/membershipPlans';

const STORAGE_PREFIX = 'rebase_membership_checkout:';
/** How long we block re-opening checkout for the same tier (prevents duplicate charges). */
const LOCK_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** Minimum wait before the explicit "open again" retry link appears. */
export const MEMBERSHIP_CHECKOUT_RETRY_COOLDOWN_MS = 60_000;

type CheckoutLock = {
  planId: MembershipPlanId;
  sessionId: string;
  openedAt: string;
};

function planKey(sessionId: string, planId: MembershipPlanId): string {
  return `${STORAGE_PREFIX}plan:${sessionId}:${planId}`;
}

function globalKey(sessionId: string): string {
  return `${STORAGE_PREFIX}global:${sessionId}`;
}

function readLock(key: string): CheckoutLock | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const lock = JSON.parse(raw) as CheckoutLock;
    if (Date.now() - new Date(lock.openedAt).getTime() > LOCK_TTL_MS) {
      sessionStorage.removeItem(key);
      return null;
    }
    return lock;
  } catch {
    return null;
  }
}

export function getMembershipCheckoutLock(
  sessionId: string | undefined,
  planId: MembershipPlanId,
): CheckoutLock | null {
  if (!sessionId) return null;
  return readLock(planKey(sessionId, planId));
}

export function getActiveMembershipCheckoutLock(
  sessionId: string | undefined,
): CheckoutLock | null {
  if (!sessionId) return null;
  return readLock(globalKey(sessionId));
}

/** @returns true only the first time — blocks duplicate Mindbody checkout tabs. */
export function tryClaimMembershipCheckout(
  sessionId: string,
  planId: MembershipPlanId,
): boolean {
  const global = readLock(globalKey(sessionId));
  if (global && global.planId !== planId) {
    return false;
  }

  const existing = readLock(planKey(sessionId, planId));
  if (existing) {
    return false;
  }

  const lock: CheckoutLock = {
    planId,
    sessionId,
    openedAt: new Date().toISOString(),
  };

  sessionStorage.setItem(planKey(sessionId, planId), JSON.stringify(lock));
  sessionStorage.setItem(globalKey(sessionId), JSON.stringify(lock));
  return true;
}

export function clearMembershipCheckoutLock(
  sessionId: string,
  planId: MembershipPlanId,
): void {
  sessionStorage.removeItem(planKey(sessionId, planId));
  const global = readLock(globalKey(sessionId));
  if (global?.planId === planId) {
    sessionStorage.removeItem(globalKey(sessionId));
  }
}

export function clearMembershipCheckoutLocks(sessionId: string): void {
  for (const planId of ['ultimate', 'resident', 'base'] as MembershipPlanId[]) {
    sessionStorage.removeItem(planKey(sessionId, planId));
  }
  sessionStorage.removeItem(globalKey(sessionId));
}

export function msUntilCheckoutRetryAllowed(lock: CheckoutLock | null): number {
  if (!lock) return 0;
  const elapsed = Date.now() - new Date(lock.openedAt).getTime();
  return Math.max(0, MEMBERSHIP_CHECKOUT_RETRY_COOLDOWN_MS - elapsed);
}
