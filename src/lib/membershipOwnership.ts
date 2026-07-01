import type { MembershipPlanId } from '@/config/membershipPlans';
import type { Membership, MembershipData } from '@/hooks/useMindbodyMembership';
import { resolveTier } from '@/lib/membershipTiers';

function isActiveMembership(row: Membership): boolean {
  return row.active !== false;
}

/** True if the client already holds this tier (or any active Rebase membership). */
export function hasActiveRebaseMembership(data: MembershipData | undefined): boolean {
  if (!data) return false;
  const activeMemberships = (data.memberships ?? []).filter(isActiveMembership);
  if (activeMemberships.some((m) => resolveTier(m.name))) return true;
  return (data.contracts?.length ?? 0) > 0;
}

export function ownsMembershipPlan(
  data: MembershipData | undefined,
  planId: MembershipPlanId,
): boolean {
  if (!data) return false;
  const planName = planId.toLowerCase();
  return (data.memberships ?? []).some((m) => {
    if (!isActiveMembership(m)) return false;
    const tier = resolveTier(m.name);
    if (tier?.name.toLowerCase() === planName) return true;
    return (m.name || '').toLowerCase().includes(planName);
  });
}
