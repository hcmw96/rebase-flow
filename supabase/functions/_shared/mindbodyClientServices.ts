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

/** Pick a pass/credit to pay for a class booking (prefers June 2-week pass, then contrast-related). */
export function pickBookableClientServiceId(
  services: MindbodyClientServiceRow[],
): number | null {
  if (!services.length) return null;
  const juneId = pickJuneContrastPassServiceId(services);
  if (juneId != null) return juneId;
  const prefer = services.find((s) =>
    /contrast|communal|class|visit|session|pass|unlimited|drop/i.test(s.Name || "")
  );
  const pick = prefer ?? services[0];
  return pick.Id != null ? Number(pick.Id) : null;
}

export function findJuneContrastPassRow(
  services: MindbodyClientServiceRow[],
): MindbodyClientServiceRow | null {
  return services.find((s) => isJuneContrastPassName(s.Name)) ?? null;
}
