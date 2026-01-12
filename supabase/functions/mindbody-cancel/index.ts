import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      bookingId,
      classId,
      appointmentId,
    } = await req.json();

    if (!sessionId) {
      throw new Error("User session is required");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user session
    const { data: session, error: sessionError } = await supabase
      .from("mb_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error("Session not found. Please log in again.");
    }

    if (bookingType === "class") {
      if (!classId) {
        throw new Error("classId is required to cancel a class");
      }

      const response = await fetch(
        "https://api.mindbodyonline.com/public/v6/class/removeclientfromclass",
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
            SendEmail: true,
            LateCancel: false,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Class cancel error:", errorData);
        throw new Error(errorData.Error?.Message || "Failed to cancel class booking");
      }
    } else {
      if (!appointmentId) {
        throw new Error("appointmentId is required to cancel an appointment");
      }

      // For appointments, we need to update the status
      const response = await fetch(
        "https://api.mindbodyonline.com/public/v6/appointment/updateappointment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Api-Key": apiKey,
            "SiteId": siteId,
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            AppointmentId: parseInt(appointmentId),
            Execute: "Cancel",
            SendEmail: true,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Appointment cancel error:", errorData);
        throw new Error(errorData.Error?.Message || "Failed to cancel appointment");
      }
    }

    // Update local booking status if we have a bookingId
    if (bookingId) {
      await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Booking cancelled successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Cancel error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
