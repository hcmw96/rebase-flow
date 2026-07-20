import type { ClientService } from '@/hooks/useMindbodyMembership';

export function isCommunalContrastService(serviceName: string | undefined | null): boolean {
  if (!serviceName) return false;
  return /communal\s*contrast|members?\s*suite/i.test(serviceName);
}

/** True when the signed-in client has an unused pass/credit for communal contrast. */
export function hasCommunalContrastCredit(clientServices: ClientService[] | undefined): boolean {
  if (!clientServices?.length) return false;
  return clientServices.some((s) => {
    if (/communal\s*contrast|contrast\s*pass|off\s*peak|members?\s*suite/i.test(s.name)) {
      return s.remaining === undefined || s.remaining > 0;
    }
    return false;
  });
}
