import { normalizeBookingDateTime } from "./bookingIdempotency.ts";
import { parseMindbodyLocalDateTime, studioDateKeyFromInstant } from "./londonTime.ts";
import { resolveBookableSessionMinutes } from "./sessionDuration.ts";

function mbHeaders(apiKey: string, siteId: string, bearerToken: string) {
  return {
    "Content-Type": "application/json",
    "Api-Key": apiKey,
    SiteId: siteId,
    Authorization: `Bearer ${bearerToken}`,
  };
}

function visitDayRange(startDateTime: string): { startDate: string; endDate: string } {
  const parsed = parseMindbodyLocalDateTime(startDateTime);
  const day = Number.isNaN(parsed.getTime())
    ? normalizeBookingDateTime(startDateTime).split("T")[0]
    : studioDateKeyFromInstant(parsed);
  return { startDate: day, endDate: day };
}

/** Strip duration suffixes so "Premium Suite (60 mins)" matches "Premium Suite". */
function normalizeServiceLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b\d+\s*(?:mins?|minutes?|min|hrs?|hours?)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function purchaseMatchesService(
  purchaseText: string,
  serviceName: string | null | undefined,
): boolean {
  if (!serviceName?.trim()) return true;
  const needle = normalizeServiceLabel(serviceName);
  const haystack = normalizeServiceLabel(purchaseText);
  if (!needle || !haystack) return true;
  if (haystack.includes(needle) || needle.includes(haystack)) return true;

  const needleTokens = needle.split(" ").filter((t) => t.length > 2);
  if (!needleTokens.length) return true;
  // Require most meaningful tokens (suite bookings: premium + suite).
  const hits = needleTokens.filter((t) => haystack.includes(t)).length;
  return hits >= Math.ceil(needleTokens.length * 0.6);
}

/** True if the client already has a non-cancelled class visit for this class instance. */
export async function clientAlreadyBookedClass(
  apiKey: string,
  siteId: string,
  bearerToken: string,
  publicClientId: string,
  classId: string,
  startDateTime: string,
): Promise<boolean> {
  const { startDate, endDate } = visitDayRange(startDateTime);
  const res = await fetch(
    `https://api.mindbodyonline.com/public/v6/client/clientvisits?ClientId=${encodeURIComponent(publicClientId)}&StartDate=${startDate}&EndDate=${endDate}`,
    { method: "GET", headers: mbHeaders(apiKey, siteId, bearerToken) },
  );
  if (!res.ok) return false;

  const data = await res.json();
  const visits = (data.Visits || []) as Array<{
    ClassId?: number | string;
    StartDateTime?: string;
    LateCancelled?: boolean;
  }>;

  const targetStart = normalizeBookingDateTime(startDateTime);
  return visits.some((visit) => {
    if (visit.LateCancelled) return false;
    if (String(visit.ClassId) !== String(classId)) return false;
    if (!visit.StartDateTime) return true;
    return normalizeBookingDateTime(visit.StartDateTime) === targetStart;
  });
}

type AppointmentRow = {
  StartDateTime?: string;
  Status?: string;
  SessionType?: { Id?: number | string };
  Staff?: { Id?: number | string };
};

type ClientPurchaseRow = {
  SaleDateTime?: string;
  PurchasedDateTime?: string;
  Description?: string;
  Name?: string;
  SaleId?: number | string;
  TotalAmount?: number;
  Amount?: number;
};

async function fetchClientAppointmentsForDay(
  apiKey: string,
  siteId: string,
  bearerToken: string,
  publicClientId: string,
  startDateTime: string,
): Promise<AppointmentRow[]> {
  const { startDate, endDate } = visitDayRange(startDateTime);
  const res = await fetch(
    `https://api.mindbodyonline.com/public/v6/client/clientappointments?ClientId=${encodeURIComponent(publicClientId)}&StartDate=${startDate}&EndDate=${endDate}`,
    { method: "GET", headers: mbHeaders(apiKey, siteId, bearerToken) },
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.Appointments || []) as AppointmentRow[];
}

async function fetchClientPurchasesInRange(
  apiKey: string,
  siteId: string,
  bearerToken: string,
  publicClientId: string,
  startDateTime: string,
  endDateTime: string,
): Promise<ClientPurchaseRow[]> {
  const params = new URLSearchParams({
    "request.clientId": publicClientId,
    "request.startDate": startDateTime,
    "request.endDate": endDateTime,
    "request.limit": "50",
  });
  const res = await fetch(
    `https://api.mindbodyonline.com/public/v6/client/clientpurchases?${params.toString()}`,
    { method: "GET", headers: mbHeaders(apiKey, siteId, bearerToken) },
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.Purchases || []) as ClientPurchaseRow[];
}

function appointmentMatchesSlot(
  apt: AppointmentRow,
  sessionTypeId: string,
  staffId: string,
  startDateTime: string,
  opts?: { requireStaff?: boolean },
): boolean {
  const status = (apt.Status || "").toLowerCase();
  if (status === "cancelled" || status === "latecancelled") return false;
  if (String(apt.SessionType?.Id) !== String(sessionTypeId)) return false;
  if (opts?.requireStaff !== false && String(apt.Staff?.Id) !== String(staffId)) {
    return false;
  }
  if (!apt.StartDateTime) return true;
  return normalizeBookingDateTime(apt.StartDateTime) ===
    normalizeBookingDateTime(startDateTime);
}

/** True if the client already has an appointment at this slot. */
export async function clientAlreadyBookedAppointment(
  apiKey: string,
  siteId: string,
  bearerToken: string,
  publicClientId: string,
  sessionTypeId: string,
  staffId: string,
  startDateTime: string,
): Promise<boolean> {
  const appointments = await fetchClientAppointmentsForDay(
    apiKey,
    siteId,
    bearerToken,
    publicClientId,
    startDateTime,
  );
  if (
    appointments.some((apt) =>
      appointmentMatchesSlot(apt, sessionTypeId, staffId, startDateTime)
    )
  ) {
    return true;
  }
  // Suites often remap resource staff ids after booking.
  return appointments.some((apt) =>
    appointmentMatchesSlot(apt, sessionTypeId, staffId, startDateTime, {
      requireStaff: false,
    })
  );
}

/**
 * After Mindbody returns an ambiguous checkout error, the appointment (and/or
 * sale) may already exist. Poll briefly before telling the guest to stop.
 */
export async function waitUntilClientBookedAppointment(
  apiKey: string,
  siteId: string,
  bearerToken: string,
  publicClientId: string,
  sessionTypeId: string,
  staffId: string,
  startDateTime: string,
  opts?: { attempts?: number; delayMs?: number },
): Promise<boolean> {
  const attempts = opts?.attempts ?? 4;
  const delayMs = opts?.delayMs ?? 1200;

  for (let i = 0; i < attempts; i++) {
    if (i > 0) {
      await new Promise((r) => setTimeout(r, delayMs * i));
    }
    const appointments = await fetchClientAppointmentsForDay(
      apiKey,
      siteId,
      bearerToken,
      publicClientId,
      startDateTime,
    );
    // Prefer exact staff match; suites sometimes remap resource staff ids.
    if (
      appointments.some((apt) =>
        appointmentMatchesSlot(apt, sessionTypeId, staffId, startDateTime)
      )
    ) {
      return true;
    }
    if (
      appointments.some((apt) =>
        appointmentMatchesSlot(apt, sessionTypeId, staffId, startDateTime, {
          requireStaff: false,
        })
      )
    ) {
      console.warn(
        "Matched booked appointment by session+time without staff id",
        sessionTypeId,
        startDateTime,
      );
      return true;
    }
  }
  return false;
}

/** True if the client already has a non-cancelled class visit — with short poll. */
export async function waitUntilClientBookedClass(
  apiKey: string,
  siteId: string,
  bearerToken: string,
  publicClientId: string,
  classId: string,
  startDateTime: string,
  opts?: { attempts?: number; delayMs?: number },
): Promise<boolean> {
  const attempts = opts?.attempts ?? 4;
  const delayMs = opts?.delayMs ?? 1200;
  for (let i = 0; i < attempts; i++) {
    if (i > 0) {
      await new Promise((r) => setTimeout(r, delayMs * i));
    }
    if (
      await clientAlreadyBookedClass(
        apiKey,
        siteId,
        bearerToken,
        publicClientId,
        classId,
        startDateTime,
      )
    ) {
      return true;
    }
  }
  return false;
}

export async function waitUntilClientHasRecentSale(
  apiKey: string,
  siteId: string,
  bearerToken: string,
  publicClientId: string,
  opts?: {
    serviceName?: string;
    expectedAmount?: number;
    attempts?: number;
    delayMs?: number;
    windowStart?: Date;
  },
): Promise<boolean> {
  const attempts = opts?.attempts ?? 3;
  const delayMs = opts?.delayMs ?? 1200;
  const startWindow = opts?.windowStart ?? new Date(Date.now() - 30 * 60_000);
  const serviceName = opts?.serviceName?.trim() || null;
  const expectedAmount = opts?.expectedAmount;
  // Member rates can be ~10–20% under list; keep a wide window so sale recovery works.
  const tolerance = expectedAmount != null ? Math.max(5, expectedAmount * 0.3) : null;

  for (let i = 0; i < attempts; i++) {
    if (i > 0) {
      await new Promise((r) => setTimeout(r, delayMs * i));
    }
    const purchases = await fetchClientPurchasesInRange(
      apiKey,
      siteId,
      bearerToken,
      publicClientId,
      startWindow.toISOString(),
      new Date().toISOString(),
    );
    if (!purchases.length) continue;

    const matched = purchases.some((purchase) => {
      const text = `${purchase.Description || ""} ${purchase.Name || ""}`;
      const nameMatch = purchaseMatchesService(text, serviceName);
      const amount = purchase.TotalAmount ?? purchase.Amount;
      const amountMatch = expectedAmount != null && tolerance != null && typeof amount === "number"
        ? Math.abs(amount - expectedAmount) <= tolerance
        : true;
      return nameMatch && amountMatch;
    });
    if (matched) {
      return true;
    }
    // Amount-only fallback in the checkout window — suite sale names often omit duration.
    if (expectedAmount != null && tolerance != null) {
      const amountOnly = purchases.some((purchase) => {
        const amount = purchase.TotalAmount ?? purchase.Amount;
        return typeof amount === "number" && Math.abs(amount - expectedAmount) <= tolerance;
      });
      if (amountOnly) {
        console.warn(
          "Matched recent sale by amount without exact service name",
          serviceName,
          expectedAmount,
        );
        return true;
      }
    }
  }
  return false;
}

/**
 * Pre-charge guard: confirm the slot still appears in Mindbody bookable items.
 * Returns null if Mindbody is unreachable (do not block booking on API blips).
 */
export async function appointmentSlotStillBookable(
  apiKey: string,
  siteId: string,
  bearerToken: string,
  sessionTypeId: string,
  staffId: string,
  startDateTime: string,
  locationId: number,
): Promise<boolean | null> {
  const day = visitDayRange(startDateTime).startDate;
  const params = new URLSearchParams({
    SessionTypeIds: sessionTypeId,
    StartDate: day,
    EndDate: day,
    IgnoreDefaultSessionLength: "true",
  });
  // Don't hard-filter StaffIds — suite resources remap staff after booking windows load.
  if (locationId > 0) params.set("LocationIds", String(locationId));
  try {
    const res = await fetch(
      `https://api.mindbodyonline.com/public/v6/appointment/bookableitems?${params}`,
      { method: "GET", headers: mbHeaders(apiKey, siteId, bearerToken) },
    );
    if (!res.ok) {
      console.warn("bookableitems preflight failed:", res.status);
      return null;
    }
    const data = await res.json();
    const windows = (data.Availabilities || []) as Array<{
      StartDateTime?: string;
      EndDateTime?: string;
      BookableEndDateTime?: string;
      Staff?: { Id?: number | string };
      SessionType?: { Id?: number | string; Name?: string; DefaultTimeLength?: number };
    }>;
    const target = normalizeBookingDateTime(startDateTime);
    const targetMs = Date.parse(target);
    if (!Number.isFinite(targetMs)) return null;

    for (const w of windows) {
      if (String(w.SessionType?.Id) !== String(sessionTypeId)) continue;
      if (!w.StartDateTime) continue;
      const sessionLength = resolveBookableSessionMinutes(
        w.SessionType?.Name,
        w.SessionType?.DefaultTimeLength,
      );
      const winStart = Date.parse(normalizeBookingDateTime(w.StartDateTime));
      if (!Number.isFinite(winStart)) continue;

      // Prefer EndDateTime (same as availability slot generation); fall back to
      // BookableEndDateTime expanded by prep buffer.
      let winEndMs: number | null = null;
      if (w.EndDateTime) {
        winEndMs = Date.parse(normalizeBookingDateTime(w.EndDateTime));
      } else if (w.BookableEndDateTime) {
        const bookableEnd = Date.parse(normalizeBookingDateTime(w.BookableEndDateTime));
        const defaultLen = w.SessionType?.DefaultTimeLength || sessionLength;
        const bufferMinutes = Math.max(0, defaultLen - sessionLength);
        winEndMs = bookableEnd + bufferMinutes * 60_000;
      }
      if (winEndMs == null || !Number.isFinite(winEndMs)) continue;

      const staffMatches = String(w.Staff?.Id) === String(staffId);
      const fits =
        targetMs >= winStart && targetMs + sessionLength * 60_000 <= winEndMs + 1000;
      if (!fits) continue;
      if (staffMatches) return true;
    }

    // Soft staff: same session + time window (suite resource remap).
    for (const w of windows) {
      if (String(w.SessionType?.Id) !== String(sessionTypeId)) continue;
      if (!w.StartDateTime) continue;
      const sessionLength = resolveBookableSessionMinutes(
        w.SessionType?.Name,
        w.SessionType?.DefaultTimeLength,
      );
      const winStart = Date.parse(normalizeBookingDateTime(w.StartDateTime));
      if (!Number.isFinite(winStart)) continue;
      let winEndMs: number | null = null;
      if (w.EndDateTime) {
        winEndMs = Date.parse(normalizeBookingDateTime(w.EndDateTime));
      } else if (w.BookableEndDateTime) {
        const bookableEnd = Date.parse(normalizeBookingDateTime(w.BookableEndDateTime));
        const defaultLen = w.SessionType?.DefaultTimeLength || sessionLength;
        const bufferMinutes = Math.max(0, defaultLen - sessionLength);
        winEndMs = bookableEnd + bufferMinutes * 60_000;
      }
      if (winEndMs == null || !Number.isFinite(winEndMs)) continue;
      if (targetMs >= winStart && targetMs + sessionLength * 60_000 <= winEndMs + 1000) {
        console.warn(
          "bookableitems preflight matched session+time without staff id",
          sessionTypeId,
          startDateTime,
        );
        return true;
      }
    }
    return false;
  } catch (e) {
    console.warn("bookableitems preflight error:", e);
    return null;
  }
}
