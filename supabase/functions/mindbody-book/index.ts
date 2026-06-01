import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveSiteClientId, type ClientProfile } from "../_shared/mindbodyClientResolve.ts";
import { fetchMindbodyClientProfile, fetchOidcUserInfo } from "../_shared/mindbodyClientProfile.ts";
import { getStaffToken } from "../_shared/mindbodyStaff.ts";
import {
  isMindbodyTokenExpired,
  refreshMindbodySessionIfNeeded,
} from "../_shared/mindbodyRefreshSession.ts";
import {
  ensureMindbodyClientEmail,
  sendBookingConfirmationEmails,
} from "../_shared/bookingConfirmationEmail.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type MbSession = {
  id: string;
  mindbody_client_id: string;
  mindbody_site_client_id?: string | null;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
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

async function sessionClientProfile(
  session: MbSession,
  apiKey: string,
  siteId: string,
): Promise<ClientProfile> {
  let email = session.email ?? undefined;
  let firstName = session.first_name ?? undefined;
  let lastName = session.last_name ?? undefined;

  if ((!email || !firstName) && session.access_token) {
    const oidc = await fetchOidcUserInfo(session.access_token);
    if (oidc) {
      email = email ?? oidc.email;
      firstName = firstName ?? oidc.given_name;
      lastName = lastName ?? oidc.family_name;
    }
    const fetched = await fetchMindbodyClientProfile(
      session.mindbody_client_id,
      session.access_token,
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

async function resolveBookingClientId(
  publicClientId: string,
  apiKey: string,
  siteId: string,
  staffToken: string,
  profile: ClientProfile,
): Promise<string | null> {
  const clientId = await resolveSiteClientId(publicClientId, apiKey, siteId, staffToken, profile);
  console.log("Booking ClientId:", publicClientId, "->", clientId ?? "(unresolved)");
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
): Promise<{ ok: true; data: unknown; clientId: string } | { ok: false; response: Response }> {
  const publicClientId = session.mindbody_client_id;

  // OAuth proves *who* the client is; staff token completes the booking at this site.
  // Consumer tokens often fail with "site id does not match" when the user visits multiple
  // studios (Rebase is linked under Places You Go, but the API token scope differs).
  let staffToken: string;
  try {
    staffToken = await getStaffToken();
  } catch (staffErr) {
    console.error("Staff token unavailable:", staffErr);
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "Booking is temporarily unavailable. Please contact reception." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 503 },
      ),
    };
  }

  let clientId = session.mindbody_site_client_id?.trim() || null;
  const profile = await sessionClientProfile(session, apiKey, siteId);

  if (!clientId) {
    clientId = await resolveBookingClientId(publicClientId, apiKey, siteId, staffToken, profile);
    if (clientId) {
      await supabaseAdmin
        .from("mb_sessions")
        .update({ mindbody_site_client_id: clientId, updated_at: new Date().toISOString() })
        .eq("id", session.id);
    }
  }

  if (!clientId) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error:
            "We could not match your Mindbody sign-in to your Rebase client record. Sign out, sign in again, or email reception@rebaserecovery.com — we will complete the booking for you.",
          profileNotFound: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      ),
    };
  }

  await ensureMindbodyClientEmail(apiKey, siteId, staffToken, clientId, profile.email);

  const payload = { ...body, ClientId: clientId };

  // CRITICAL: Book with the client's OAuth token only. Staff/business-mode tokens can
  // add clients to classes without charging (RequirePayment is not enforced the same way).
  let activeSession = session;
  if (isMindbodyTokenExpired(activeSession.token_expires_at) && activeSession.refresh_token) {
    const refreshed = await refreshMindbodySessionIfNeeded(supabaseAdmin, activeSession, { force: true });
    if (refreshed) activeSession = refreshed;
  }

  if (!activeSession.access_token) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error: "Session expired. Please sign in again.",
          requiresLogin: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 },
      ),
    };
  }

  const response = await postToMindbody(url, apiKey, siteId, activeSession.access_token, payload);

  if (!response.ok) {
    const rawText = await response.text();
    const message = extractMindbodyErrorMessage(rawText);
    console.error("Mindbody booking (consumer):", response.status, message);

    const lower = message.toLowerCase();
    const paymentIssue =
      /pricing option|payment|package|sessions remaining|insufficient|does not have a valid|unable to apply|no .*available|not paid/i
        .test(lower);

    const requiresLogin =
      response.status === 401 &&
      !/site id does not match/i.test(lower) &&
      !paymentIssue;

    if (requiresLogin) {
      return {
        ok: false,
        response: new Response(
          JSON.stringify({ error: message, requiresLogin: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 },
        ),
      };
    }

    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error: message,
          paymentRequired: paymentIssue,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      ),
    };
  }

  return { ok: true, data: await response.json(), clientId };
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
    let bookedClientId: string | undefined;

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
          CrossRegionalBooking: true,
        },
      );
      if (!result.ok) return result.response;
      bookingResult = result.data as Record<string, unknown>;
      mindbodyId = classId;
      bookedClientId = result.clientId;
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
      bookedClientId = result.clientId;
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

    try {
      const profile = await sessionClientProfile(session, apiKey, siteId);
      await sendBookingConfirmationEmails(
        {
          to: profile.email,
          firstName: profile.firstName,
          serviceName: serviceName || "Booking",
          startTime: startDateTime || classInfo?.StartDateTime,
          endTime: endDateTime || classInfo?.EndDateTime,
          locationName: resolvedLocationName,
          bookingType: bookingType === "appointment" ? "appointment" : "class",
        },
        {
          apiKey,
          siteId,
          mindbodyClientId: bookedClientId,
          classId: bookingType === "class" ? classId : undefined,
        },
      );
    } catch (emailErr) {
      console.error("Confirmation email error (booking still confirmed):", emailErr);
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
