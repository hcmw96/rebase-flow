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
  const { startDate, endDate } = visitDayRange(startDateTime);
  const res = await fetch(
    `https://api.mindbodyonline.com/public/v6/client/clientappointments?ClientId=${encodeURIComponent(publicClientId)}&StartDate=${startDate}&EndDate=${endDate}`,
    { method: "GET", headers: mbHeaders(apiKey, siteId, bearerToken) },
  );
  if (!res.ok) return false;

  const data = await res.json();
  const appointments = (data.Appointments || []) as Array<{
    StartDateTime?: string;
    Status?: string;
    SessionType?: { Id?: number | string };
    Staff?: { Id?: number | string };
  }>;

  const targetStart = normalizeBookingDateTime(startDateTime);
  return appointments.some((apt) => {
    const status = (apt.Status || "").toLowerCase();
    if (status === "cancelled" || status === "latecancelled") return false;
    if (String(apt.SessionType?.Id) !== String(sessionTypeId)) return false;
    if (String(apt.Staff?.Id) !== String(staffId)) return false;
    if (!apt.StartDateTime) return true;
    return normalizeBookingDateTime(apt.StartDateTime) === targetStart;
  });
}
