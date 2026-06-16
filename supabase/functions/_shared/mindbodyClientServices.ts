import { isJuneContrastPassName, pickJuneContrastPassServiceId } from "./contrastPass.ts";

/** Active Mindbody client service (session pack / pass credit). */
export type MindbodyClientServiceRow = {
  Id?: number;
  Name?: string;
  Remaining?: number;
  ExpirationDate?: string;
  Count?: number;
  Current?: boolean;
};

function mindbodyHeaders(apiKey: string, siteId: string, bearerToken: string) {
  return {
    "Content-Type": "application/json",
    "Api-Key": apiKey,
    "SiteId": siteId,
    Authorization: `Bearer ${bearerToken}`,
  };
}

/** Active passes/credits on the client's account (staff or consumer token). */
export async function fetchActiveClientServices(
  apiKey: string,
  siteId: string,
  bearerToken: string,
  clientId: string,
): Promise<MindbodyClientServiceRow[]> {
  const res = await fetch(
    `https://api.mindbodyonline.com/public/v6/client/clientservices?ClientId=${encodeURIComponent(clientId)}`,
    { method: "GET", headers: mindbodyHeaders(apiKey, siteId, bearerToken) },
  );
  if (!res.ok) {
    console.warn("clientservices lookup failed:", res.status, await res.text().catch(() => ""));
    return [];
  }
  const data = await res.json();
  const now = Date.now();
  return ((data.ClientServices || []) as MindbodyClientServiceRow[]).filter((s) => {
    if (s.ExpirationDate && new Date(s.ExpirationDate).getTime() < now) return false;
    if (typeof s.Remaining === "number" && s.Remaining <= 0) return false;
    return s.Id != null;
  });
}

/**
 * Pick a pass/credit to pay for a class booking.
 * Only returns a service id if the client actually has a usable credit/pass.
 * Never falls through to a retail pricing option (e.g. 10-pack) that would
 * incorrectly charge the full pack price for a single drop-in.
 */
export function pickBookableClientServiceId(
  services: MindbodyClientServiceRow[],
): number | null {
  if (!services.length) return null;

  // Prefer the June unlimited pass first.
  const juneId = pickJuneContrastPassServiceId(services);
  if (juneId != null) return juneId;

  // Only pick a service that looks like a genuine per-session credit or pass,
  // not a retail multi-session pack that hasn't been consumed yet.
  // A client service with Remaining > 0 is a pre-purchased credit — safe to use.
  // Exclude rows where Count > 1 AND Remaining equals Count (i.e. fully unused pack)
  // because applying the whole pack would charge nothing but mark the pack as used.
  const credit = services.find((s) => {
    const name = s.Name || "";
    if (!/contrast|communal|class|visit|session|pass|unlimited|drop/i.test(name)) return false;
    // If we have explicit remaining info, trust it — any remaining > 0 is usable.
    if (typeof s.Remaining === "number") return s.Remaining > 0;
    return true;
  });

  if (!credit) return null;
  return credit.Id != null ? Number(credit.Id) : null;
}

export function findJuneContrastPassRow(
  services: MindbodyClientServiceRow[],
): MindbodyClientServiceRow | null {
  return services.find((s) => isJuneContrastPassName(s.Name)) ?? null;
}
