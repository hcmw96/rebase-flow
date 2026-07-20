import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveSiteClientId, type ClientProfile } from "../_shared/mindbodyClientResolve.ts";
import { fetchMindbodyClientProfile, fetchOidcUserInfo } from "../_shared/mindbodyClientProfile.ts";
import { getStaffToken } from "../_shared/mindbodyStaff.ts";
import {
  parseMindbodyLocalDateTime,
  studioDateKeyAddDays,
  studioTodayKey,
  toUtcIsoFromMindbody,
} from "../_shared/londonTime.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type BookingRow = {
  id: string;
  type: "appointment" | "class";
  bookingType: "appointment" | "class";
  serviceName: string;
  staffName: string | null;
  locationName: string | null;
  startTime: string;
  endTime: string | null;
  status: string;
  classId?: string;
};

function mindbodyHeaders(apiKey: string, siteId: string, bearerToken: string) {
  return {
    "Content-Type": "application/json",
    "Api-Key": apiKey,
    SiteId: siteId,
    Authorization: `Bearer ${bearerToken}`,
  };
}

async function sessionProfile(
  session: {
    mindbody_client_id: string;
    access_token?: string | null;
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  },
  apiKey: string,
  siteId: string,
): Promise<ClientProfile> {
  let email = session.email ?? undefined;
  let firstName = session.first_name ?? undefined;
  let lastName = session.last_name ?? undefined;
  const accessToken = session.access_token;

  if ((!email || !firstName) && accessToken) {
    const oidc = await fetchOidcUserInfo(accessToken);
    if (oidc) {
      email = email ?? oidc.email;
      firstName = firstName ?? oidc.given_name;
      lastName = lastName ?? oidc.family_name;
    }
    const fetched = await fetchMindbodyClientProfile(
      session.mindbody_client_id,
      accessToken,
      apiKey,
      siteId,
    );
    if (fetched) {
      email = email ?? fetched.email;
      firstName = firstName ?? fetched.firstName;
      lastName = lastName ?? fetched.lastName;
    }
  }

  return { email, firstName, lastName };
}

function bookingDedupeKey(booking: BookingRow): string {
  return [
    booking.bookingType,
    booking.startTime,
    booking.serviceName.trim().toLowerCase(),
    booking.classId ?? "",
  ].join("|");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("MINDBODY_API_KEY");
    const siteId = Deno.env.get("MINDBODY_SITE_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!apiKey || !siteId || !supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing required configuration");
    }

    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId) {
      throw new Error("sessionId is required");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: session, error: sessionError } = await supabase
      .from("mb_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({
          bookings: [],
          localBookings: [],
          user: null,
          requiresLogin: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    const today = studioTodayKey();
    const futureDate = studioDateKeyAddDays(today, 90);

    // Resolve the numeric site ClientId — bookings are created under this id.
    // The OAuth public id (hex) returns empty / ClientNotFound for cross-studio members.
    const staffToken = await getStaffToken();
    const profile = await sessionProfile(session, apiKey, siteId);
    const publicClientId = session.mindbody_client_id as string;
    const cachedSiteClientId =
      (session.mindbody_site_client_id as string | null)?.trim() || null;
    const resolvedSiteClientId = cachedSiteClientId ??
      (await resolveSiteClientId(publicClientId, apiKey, siteId, staffToken, profile));

    if (resolvedSiteClientId && resolvedSiteClientId !== cachedSiteClientId) {
      await supabase
        .from("mb_sessions")
        .update({
          mindbody_site_client_id: resolvedSiteClientId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.id);
    }

    const clientId = resolvedSiteClientId ?? publicClientId;
    console.log("My bookings ClientId:", publicClientId, "->", clientId);

    // Staff token is required for cross-studio OAuth users — their consumer
    // token fails with "User token site id does not match requested site".
    const headers = mindbodyHeaders(apiKey, siteId, staffToken);

    let appointments: BookingRow[] = [];
    const appointmentsResponse = await fetch(
      `https://api.mindbodyonline.com/public/v6/client/clientappointments?ClientId=${encodeURIComponent(clientId)}&StartDate=${today}&EndDate=${futureDate}`,
      { method: "GET", headers },
    );
    if (appointmentsResponse.ok) {
      const appointmentsData = await appointmentsResponse.json();
      appointments = (appointmentsData.Appointments || [])
        .filter((apt: { Status?: string }) => {
          const status = (apt.Status || "").toLowerCase();
          return status !== "cancelled" && status !== "canceled";
        })
        .map((apt: any) => ({
          id: apt.Id?.toString(),
          type: "appointment" as const,
          bookingType: "appointment" as const,
          serviceName: apt.SessionType?.Name || "Appointment",
          staffName: apt.Staff ? `${apt.Staff.FirstName} ${apt.Staff.LastName}` : null,
          locationName: apt.Location?.Name ?? null,
          startTime: toUtcIsoFromMindbody(apt.StartDateTime),
          endTime: toUtcIsoFromMindbody(apt.EndDateTime),
          status: apt.Status || "confirmed",
        }));
    } else {
      console.warn(
        "clientappointments non-OK:",
        appointmentsResponse.status,
        await appointmentsResponse.text().catch(() => ""),
      );
    }

    let classVisits: BookingRow[] = [];
    const classVisitsResponse = await fetch(
      `https://api.mindbodyonline.com/public/v6/client/clientvisits?ClientId=${encodeURIComponent(clientId)}&StartDate=${today}&EndDate=${futureDate}`,
      { method: "GET", headers },
    );
    if (classVisitsResponse.ok) {
      const visitsData = await classVisitsResponse.json();
      classVisits = (visitsData.Visits || [])
        .filter((v: any) => v.ClassId && !v.LateCancelled)
        .map((visit: any) => ({
          id: visit.Id?.toString(),
          type: "class" as const,
          bookingType: "class" as const,
          serviceName: visit.Name || "Class",
          staffName: visit.Staff
            ? `${visit.Staff.FirstName} ${visit.Staff.LastName}`
            : null,
          locationName: visit.Location?.Name ?? null,
          startTime: toUtcIsoFromMindbody(visit.StartDateTime),
          endTime: toUtcIsoFromMindbody(visit.EndDateTime),
          status: "confirmed",
          classId: visit.ClassId?.toString(),
        }));
    } else {
      console.warn(
        "clientvisits non-OK:",
        classVisitsResponse.status,
        await classVisitsResponse.text().catch(() => ""),
      );
    }

    const mindbodyBookings = [...appointments, ...classVisits];
    const seen = new Set(mindbodyBookings.map(bookingDedupeKey));

    // Local confirmed rows fill gaps when Mindbody is slow / id-mismatched.
    const { data: localRows } = await supabase
      .from("bookings")
      .select("*")
      .eq("session_id", sessionId)
      .eq("status", "confirmed")
      .gte("start_time", today)
      .order("start_time", { ascending: true });

    const localBookings: BookingRow[] = (localRows || []).map((row: any) => ({
      id: String(row.id),
      type: row.booking_type === "class" ? "class" : "appointment",
      bookingType: row.booking_type === "class" ? "class" : "appointment",
      serviceName: row.service_name || "Booking",
      staffName: row.staff_name ?? null,
      locationName: row.location_name ?? null,
      startTime: row.start_time,
      endTime: row.end_time ?? null,
      status: row.status || "confirmed",
      classId: row.mindbody_class_id ?? undefined,
    }));

    const mergedLocal = localBookings.filter((row) => {
      const key = bookingDedupeKey(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const allBookings = [...mindbodyBookings, ...mergedLocal].sort(
      (a, b) =>
        parseMindbodyLocalDateTime(a.startTime).getTime() -
        parseMindbodyLocalDateTime(b.startTime).getTime(),
    );

    console.log("My bookings summary:", {
      clientId,
      appointments: appointments.length,
      classVisits: classVisits.length,
      localMerged: mergedLocal.length,
      total: allBookings.length,
    });

    return new Response(
      JSON.stringify({
        bookings: allBookings,
        localBookings: localBookings,
        user: {
          email: session.email,
          firstName: session.first_name,
          lastName: session.last_name,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("My bookings error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
