import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  isMindbodyTokenExpired,
  refreshMindbodySessionIfNeeded,
} from "../_shared/mindbodyRefreshSession.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    // Get user session with access token
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

    // Diagnostic: decode token site claim
    try {
      const parts = (session.access_token as string).split(".");
      if (parts.length === 3) {
        const padded = parts[1] + "=".repeat((4 - (parts[1].length % 4)) % 4);
        const claims = JSON.parse(atob(padded.replace(/-/g, "+").replace(/_/g, "/")));
        console.log("Token claims (site):", JSON.stringify({
          site_ids: claims.site_ids,
          siteid: claims.siteid,
          site_id: claims.site_id,
          subscriberId: claims.subscriberId,
          aud: claims.aud,
        }), "Env siteId:", siteId);
      }
    } catch (e) {
      console.log("Could not decode access_token claims:", e);
    }

    let bookingResult;
    let mindbodyId;

    if (bookingType === "class") {
      // Book a class
      if (!classId) {
        throw new Error("classId is required for class booking");
      }

      const response = await fetch(
        "https://api.mindbodyonline.com/public/v6/class/addclienttoclass",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Api-Key": apiKey,
            "SiteId": siteId,
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            ClassId: parseInt(classId),
            ClientId: session.mindbody_client_id,
            RequirePayment: true,
            Waitlist: false,
            SendEmail: true,
          }),
        }
      );

      if (!response.ok) {
        const rawText = await response.text();
        console.error("Class booking error raw:", response.status, rawText);
        let errorData: any = {};
        try { errorData = JSON.parse(rawText); } catch { /* non-JSON */ }
        const mbMessage = errorData.Error?.Message || rawText || "Failed to book class";
        if (response.status === 401) {
          return new Response(
            JSON.stringify({ error: mbMessage, requiresLogin: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 },
          );
        }
        throw new Error(mbMessage);
      }

      bookingResult = await response.json();
      mindbodyId = classId;
    } else {
      // Book an appointment
      if (!sessionTypeId || !staffId || !startDateTime) {
        throw new Error("sessionTypeId, staffId, and startDateTime are required");
      }

      const response = await fetch(
        "https://api.mindbodyonline.com/public/v6/appointment/addappointment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Api-Key": apiKey,
            "SiteId": siteId,
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            ClientId: session.mindbody_client_id,
            LocationId: locationId || 1,
            StaffId: parseInt(staffId),
            SessionTypeId: parseInt(sessionTypeId),
            StartDateTime: startDateTime,
            ApplyPayment: true,
            SendConfirmationEmail: true,
          }),
        }
      );

      if (!response.ok) {
        const rawText = await response.text();
        console.error("Appointment booking error raw:", response.status, rawText);
        let errorData: any = {};
        try { errorData = JSON.parse(rawText); } catch { /* non-JSON */ }
        const mbMessage = errorData.Error?.Message || rawText || "Failed to book appointment";
        if (response.status === 401) {
          return new Response(
            JSON.stringify({ error: mbMessage, requiresLogin: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 },
          );
        }
        throw new Error(mbMessage);
      }

      bookingResult = await response.json();
      mindbodyId = bookingResult.Appointment?.Id?.toString();
    }

    // Build metadata with fallbacks to client-provided values so the row is never sparse.
    const resolvedStaffName = bookingResult.Appointment?.Staff?.FirstName
      ? `${bookingResult.Appointment.Staff.FirstName} ${bookingResult.Appointment.Staff.LastName || ""}`.trim()
      : (staffName || null);
    const resolvedLocationName =
      bookingResult.Appointment?.Location?.Name || locationName || null;

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
        start_time: startDateTime || bookingResult.Class?.StartDateTime,
        end_time: endDateTime || bookingResult.Class?.EndDateTime,
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
