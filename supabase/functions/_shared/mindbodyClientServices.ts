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

function remainingUsable(s: MindbodyClientServiceRow): boolean {
  if (typeof s.Remaining === "number") return s.Remaining > 0;
  return true;
}

function firstUsableId(services: MindbodyClientServiceRow[]): number | null {
  const hit = services.find((s) => s.Id != null && remainingUsable(s));
  return hit?.Id != null ? Number(hit.Id) : null;
}

/** Communal contrast / members' suite — NOT Premium/Infrared private suites. */
function isCommunalContrastService(serviceName: string, bookingType: "class" | "appointment"): boolean {
  if (/premium\s*suite|infrared\s*suite|private\s*suite/i.test(serviceName)) {
    return false;
  }
  if (/communal\s*contrast|contrast\s*immersion|members?\s*suite|member'?s\s*suite/i.test(serviceName)) {
    return true;
  }
  // Drop-in communal class product only — never treat every class as contrast.
  if (bookingType === "class" && /communal|contrast\s*immersion/i.test(serviceName)) {
    return true;
  }
  return false;
}

function isCryoService(serviceName: string): boolean {
  return /cryo/i.test(serviceName);
}

function isPrivateSuiteService(serviceName: string): boolean {
  // Mindbody consumer names use both "Infrared Suite" and "Infrared Sauna/Ice bath".
  return /premium\s*suite|infrared\s*suite|infrared\s*sauna|private\s*suite/i.test(serviceName);
}

function isHbotService(serviceName: string): boolean {
  return /hyperbaric|hbot/i.test(serviceName);
}

function isMassageLikeService(serviceName: string): boolean {
  return /massage|deep\s*tissue|body\s*alignment|facial|reflexology|lymphatic|stretch/i.test(
    serviceName,
  );
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

  const juneId = pickJuneContrastPassServiceId(services);
  if (juneId != null) return juneId;

  const credit = services.find((s) => {
    const name = s.Name || "";
    if (!/contrast|communal|class|visit|session|pass|unlimited|drop|cryo/i.test(name)) {
      return false;
    }
    return remainingUsable(s);
  });

  if (!credit) return null;
  return credit.Id != null ? Number(credit.Id) : null;
}

/**
 * Pick a pass/credit appropriate for the service being booked.
 *
 * CRITICAL: Never apply communal/class/membership credits to paid massage, private
 * suites, etc. Loose word matching previously booked treatments for £0.
 */
export function pickBookableClientServiceIdForBooking(
  services: MindbodyClientServiceRow[],
  context: { bookingType: "class" | "appointment"; serviceName?: string },
): number | null {
  if (!services.length) return null;

  const serviceName = (context.serviceName || "").trim();
  if (!serviceName) {
    // Without a service name we cannot safely match — never guess a membership credit.
    return context.bookingType === "class" ? pickBookableClientServiceId(services) : null;
  }

  if (isCryoService(serviceName)) {
    return firstUsableId(services.filter((s) => /cryo/i.test(s.Name || "")));
  }

  if (isCommunalContrastService(serviceName, context.bookingType)) {
    const juneId = pickJuneContrastPassServiceId(services);
    if (juneId != null) return juneId;
    return firstUsableId(
      services.filter((s) =>
        /communal|contrast|members?\s*suite|member'?s\s*suite|off\s*peak/i.test(s.Name || "")
      ),
    );
  }

  if (isPrivateSuiteService(serviceName)) {
    // Membership "Private Suite" allowances only — never communal contrast / class packs.
    return firstUsableId(
      services.filter((s) => {
        const n = s.Name || "";
        if (/communal|contrast|class\s*pass|members?\s*suite|member'?s\s*suite/i.test(n)) {
          return false;
        }
        return /private\s*suite|premium\s*suite|infrared\s*suite|infrared\s*sauna/i.test(n);
      }),
    );
  }

  if (isHbotService(serviceName)) {
    return firstUsableId(services.filter((s) => /hyperbaric|hbot/i.test(s.Name || "")));
  }

  if (isMassageLikeService(serviceName)) {
    // Require the credit itself to look like a massage/treatment pack — not "session",
    // "class", "unlimited", or membership rows that merely share a short token.
    return firstUsableId(
      services.filter((s) => {
        const n = s.Name || "";
        if (/communal|contrast|class\s*pass|\bclass\b|membership|unlimited\s*cryo|private\s*suite/i.test(n)) {
          return false;
        }
        return /massage|deep\s*tissue|sports\s*massage|facial|reflexology|lymphatic|stretch|alignment|deo/i
          .test(n);
      }),
    );
  }

  if (context.bookingType === "class") {
    // Yoga / Pilates / etc. — only a credit that clearly names this class family.
    const tokens = serviceName
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 4 && !/class|mins|minutes|session|guided|flow/.test(w));
    if (!tokens.length) return null;
    return firstUsableId(
      services.filter((s) => {
        const n = (s.Name || "").toLowerCase();
        if (/communal|contrast|cryo|hyperbaric|massage|private\s*suite/i.test(n)) return false;
        return tokens.some((t) => n.includes(t));
      }),
    );
  }

  // Other appointments: no free credit unless explicitly matched above.
  return null;
}

export function findJuneContrastPassRow(
  services: MindbodyClientServiceRow[],
): MindbodyClientServiceRow | null {
  return services.find((s) => isJuneContrastPassName(s.Name)) ?? null;
}
