import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveSiteClientId } from "../_shared/mindbodyClientResolve.ts";
import { getStaffToken } from "../_shared/mindbodyStaff.ts";
import {
  isMindbodyTokenExpired,
  refreshMindbodySessionIfNeeded,
} from "../_shared/mindbodyRefreshSession.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type MbSession = {
  id: string;
  mindbody_client_id: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string;
};

async function loadBookableSession(
  supabaseAdmin: ReturnType<typeof createClient>,
  sessionId: string,
): Promise<MbSession | Response> {
  let { data: session, error: sessionError } = await supabaseAdmin
    .from("mb_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return new Response(
      JSON.stringify({
        error: "Session not found. Please log in again.",
        requiresLogin: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 },
    );
  }

  if (isMindbodyTokenExpired(session.token_expires_at)) {
    const refreshed = await refreshMindbodySessionIfNeeded(supabaseAdmin, session);
    if (!refreshed) {
      return new Response(
        JSON.stringify({
          error: "Session expired. Please log in again.",
          requiresLogin: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 },
      );
    }
    session = refreshed;
  }

  return session as MbSession;
}

async function resolveBookingClientId(
  publicClientId: string,
  apiKey: string,
  siteId: string,
  bearerToken: string,
): Promise<string> {
  let clientId = await resolveSiteClientId(publicClientId, apiKey, siteId, bearerToken);
  if (clientId === publicClientId) {
    try {
      const staffToken = await getStaffToken();
      clientId = await resolveSiteClientId(publicClientId, apiKey, siteId, staffToken);
    } catch (e) {
      console.warn("Staff client resolve failed:", e);
    }
  }
  console.log("Booking ClientId:", publicClientId, "->", clientId);
  return clientId;
}

function extractMindbodyErrorMessage(rawText: string): string {
  try {
    const errorData = JSON.parse(rawText) as { Error?: { Message?: string } };
    return errorData.Error?.Message || rawText;
  } catch {
    return rawText;
  }
}

function isSiteOrAuthError(status: number, message: string): boolean {
  const lower = message.toLowerCase();
  return (
    status === 401 ||
    lower.includes("site id does not match") ||
    lower.includes("invalid user token") ||
    lower.includes("unauthorized")
  );
}

async function postToMindbody(
  url: string,
  apiKey: string,
  siteId: string,
  bearerToken: string,
  body: Record<string, unknown>,
): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": apiKey,
      "SiteId": siteId,
      Authorization: `Bearer ${bearerToken}`,
    },
    body: JSON.stringify(body),
  });
}

async function mindbodyPostWithRetry(
  supabaseAdmin: ReturnType<typeof createClient>,
  session: MbSession,
  apiKey: string,
  siteId: string,
  url: string,
  body: Record<string, unknown>,
): Promise<{ ok: true; data: unknown } | { ok: false; response: Response }> {
  const publicClientId = session.mindbody_client_id;

  const attemptWithToken = async (bearerToken: string) => {
    const clientId = await resolveBookingClientId(publicClientId, apiKey, siteId, bearerToken);
    const payload = { ...body, ClientId: clientId };
    const response = await postToMindbody(url, apiKey, siteId, bearerToken, payload);
    return { response, payload };
  };

  let activeSession = session;
  let { response } = await attemptWithToken(activeSession.access_token);

  if (response.status === 401 && activeSession.refresh_token) {
    const refreshed = await refreshMindbodySessionIfNeeded(supabaseAdmin, activeSession, { force: true });
    if (refreshed) {
      activeSession = refreshed;
      ({ response } = await attemptWithToken(activeSession.access_token));
    }
  }

  if (!response.ok) {
    const rawText = await response.text();
    const mbMessage = extractMindbodyErrorMessage(rawText);
    console.error("Mindbody booking (user token):", response.status, mbMessage);

    if (isSiteOrAuthError(response.status, mbMessage)) {
      try {
        const staffToken = await getStaffToken();
        const staffResponse = await attemptWithToken(staffToken);
        if (staffResponse.response.ok) {
          console.log("Mindbody booking succeeded via staff token fallback");
          return { ok: true, data: await staffResponse.response.json() };
        }
        const staffText = await staffResponse.response.text();
        const staffMessage = extractMindbodyErrorMessage(staffText);
        console.error("Mindbody booking (staff token):", staffResponse.response.status, staffMessage);
      } catch (staffErr) {
        console.error("Staff token booking fallback failed:", staffErr);
      }
    }

    if (response.status === 401 || /site id does not match/i.test(mbMessage)) {
      return {
        ok: false,
        response: new Response(
          JSON.stringify({ error: mbMessage, requiresLogin: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 },
        ),
      };
    }

    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: mbMessage }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      ),
    };
  }

  return { ok: true, data: await response.json() };
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

    const {
      sessionId,
      bookingType, // 'class' or 'appointment'
      classId,
      sessionTypeId,
      staffId,
      staffName,
      locationId,
      locationName,
      startDateTime,
      endDateTime,
      serviceName,
      idempotencyKey,
    } = await req.json();

    if (!sessionId) {
      throw new Error("User session is required. Please log in first.");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Idempotency short-circuit: if this key already produced a confirmed booking,
    // return it without calling Mindbody again. Prevents double-booking on retry.
    if (idempotencyKey) {
      const { data: existing } = await supabaseAdmin
        .from("bookings")
        .select("*")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();

      if (existing && existing.status === "confirmed") {
        return new Response(
          JSON.stringify({
            success: true,
            idempotent: true,
            booking: {
              id: existing.id,
              mindbodyId: existing.mindbody_appointment_id || existing.mindbody_class_id,
              serviceName: existing.service_name,
              startTime: existing.start_time,
              status: existing.status,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
        );
      }
    }
    const sessionResult = await loadBookableSession(supabaseAdmin, sessionId);
    if (sessionResult instanceof Response) return sessionResult;
    const session = sessionResult;

    let bookingResult: Record<string, unknown>;
    let mindbodyId: string | undefined;

    if (bookingType === "class") {
      if (!classId) {
        throw new Error("classId is required for class booking");
      }

      const result = await mindbodyPostWithRetry(
        supabaseAdmin,
        session,
        apiKey,
        siteId,
        "https://api.mindbodyonline.com/public/v6/class/addclienttoclass",
        {
          ClassId: parseInt(classId),
          RequirePayment: true,
          Waitlist: false,
          SendEmail: true,
        },
      );
      if (!result.ok) return result.response;
      bookingResult = result.data as Record<string, unknown>;
      mindbodyId = classId;
    } else {
      if (!sessionTypeId || !staffId || !startDateTime) {
        throw new Error("sessionTypeId, staffId, and startDateTime are required");
      }

      const result = await mindbodyPostWithRetry(
        supabaseAdmin,
        session,
        apiKey,
        siteId,
        "https://api.mindbodyonline.com/public/v6/appointment/addappointment",
        {
          LocationId: locationId || 1,
          StaffId: parseInt(staffId),
          SessionTypeId: parseInt(sessionTypeId),
          StartDateTime: startDateTime,
          ApplyPayment: true,
          SendConfirmationEmail: true,
        },
      );
      if (!result.ok) return result.response;
      bookingResult = result.data as Record<string, unknown>;
      mindbodyId = (bookingResult.Appointment as { Id?: number })?.Id?.toString();
    }

    // Build metadata with fallbacks to client-provided values so the row is never sparse.
    const appointment = bookingResult.Appointment as {
      Staff?: { FirstName?: string; LastName?: string };
      Location?: { Name?: string };
    } | undefined;
    const classInfo = bookingResult.Class as { StartDateTime?: string; EndDateTime?: string } | undefined;
    const resolvedStaffName = appointment?.Staff?.FirstName
      ? `${appointment.Staff.FirstName} ${appointment.Staff.LastName || ""}`.trim()
      : (staffName || null);
    const resolvedLocationName = appointment?.Location?.Name || locationName || null;

    // Save booking to local database
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert({
        session_id: sessionId,
        mindbody_appointment_id: bookingType === "appointment" ? mindbodyId : null,
        mindbody_class_id: bookingType === "class" ? mindbodyId : null,
        service_name: serviceName || "Booking",
        service_id: sessionTypeId || classId,
        staff_name: resolvedStaffName,
        location_name: resolvedLocationName,
        start_time: startDateTime || classInfo?.StartDateTime,
        end_time: endDateTime || classInfo?.EndDateTime,
        status: "confirmed",
        booking_type: bookingType,
        idempotency_key: idempotencyKey || null,
      })
      .select()
      .single();

    if (bookingError) {
      console.error("Local booking save error:", bookingError);
      // Don't throw - the Mindbody booking succeeded
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking: {
          id: booking?.id,
          mindbodyId,
          serviceName: serviceName || "Booking",
          startTime: startDateTime,
          status: "confirmed",
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Booking error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
