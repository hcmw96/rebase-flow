import { normalizeBookingDateTime } from "./bookingIdempotency.ts";

function mbHeaders(apiKey: string, siteId: string, bearerToken: string) {
  return {
    "Content-Type": "application/json",
    "Api-Key": apiKey,
    SiteId: siteId,
    Authorization: `Bearer ${bearerToken}`,
  };
}

function visitDayRange(startDateTime: string): { startDate: string; endDate: string } {
  const normalized = normalizeBookingDateTime(startDateTime);
  const day = normalized.split("T")[0];
  return { startDate: day, endDate: day };
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
  return appointments.some((apt) =>
    appointmentMatchesSlot(apt, sessionTypeId, staffId, startDateTime)
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

/**
 * Pre-charge guard: confirm the slot still appears in Mindbody bookable items.
 * Returns false if Mindbody is unreachable (do not block booking on API blips).
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
  const day = normalizeBookingDateTime(startDateTime).split("T")[0];
  const params = new URLSearchParams({
    SessionTypeIds: sessionTypeId,
    StaffIds: staffId,
    StartDate: day,
    EndDate: day,
    IgnoreDefaultSessionLength: "true",
  });
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
      SessionType?: { Id?: number | string; DefaultTimeLength?: number };
    }>;
    const target = normalizeBookingDateTime(startDateTime);
    const targetMs = Date.parse(target);
    if (!Number.isFinite(targetMs)) return null;

    for (const w of windows) {
      if (String(w.SessionType?.Id) !== String(sessionTypeId)) continue;
      if (String(w.Staff?.Id) !== String(staffId)) continue;
      if (!w.StartDateTime) continue;
      const winStart = Date.parse(normalizeBookingDateTime(w.StartDateTime));
      const endRaw = w.BookableEndDateTime || w.EndDateTime;
      if (!endRaw || !Number.isFinite(winStart)) continue;
      const winEnd = Date.parse(normalizeBookingDateTime(endRaw));
      const lengthMin = w.SessionType?.DefaultTimeLength ?? 60;
      // Slot is bookable if start falls inside the window with enough remaining time.
      if (targetMs >= winStart && targetMs + lengthMin * 60_000 <= winEnd + 1000) {
        return true;
      }
    }
    return false;
  } catch (e) {
    console.warn("bookableitems preflight error:", e);
    return null;
  }
}
