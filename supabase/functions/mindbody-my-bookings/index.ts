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

    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId) {
      throw new Error("sessionId is required");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user session
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
        }
      );
    }

    // Fetch from Mindbody API - client visits
    const today = new Date().toISOString().split("T")[0];
    const futureDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Get upcoming appointments
    const appointmentsResponse = await fetch(
      `https://api.mindbodyonline.com/public/v6/client/clientappointments?ClientId=${session.mindbody_client_id}&StartDate=${today}&EndDate=${futureDate}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": apiKey,
          "SiteId": siteId,
          "Authorization": `Bearer ${session.access_token}`,
        },
      }
    );

    let appointments = [];
    if (appointmentsResponse.ok) {
      const appointmentsData = await appointmentsResponse.json();
      appointments = (appointmentsData.Appointments || []).map((apt: any) => ({
        id: apt.Id?.toString(),
        type: "appointment",
        serviceName: apt.SessionType?.Name || "Appointment",
        staffName: apt.Staff ? `${apt.Staff.FirstName} ${apt.Staff.LastName}` : null,
        locationName: apt.Location?.Name,
        startTime: apt.StartDateTime,
        endTime: apt.EndDateTime,
        status: apt.Status,
      }));
    }

    // Get upcoming class visits
    const classVisitsResponse = await fetch(
      `https://api.mindbodyonline.com/public/v6/client/clientvisits?ClientId=${session.mindbody_client_id}&StartDate=${today}&EndDate=${futureDate}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": apiKey,
          "SiteId": siteId,
          "Authorization": `Bearer ${session.access_token}`,
        },
      }
    );

    let classVisits = [];
    if (classVisitsResponse.ok) {
      const visitsData = await classVisitsResponse.json();
      classVisits = (visitsData.Visits || [])
        .filter((v: any) => v.ClassId) // Only class visits
        .map((visit: any) => ({
          id: visit.Id?.toString(),
          type: "class",
          serviceName: visit.Name || "Class",
          staffName: visit.Staff ? `${visit.Staff.FirstName} ${visit.Staff.LastName}` : null,
          locationName: visit.Location?.Name,
          startTime: visit.StartDateTime,
          endTime: visit.EndDateTime,
          status: visit.LateCancelled ? "cancelled" : "confirmed",
          classId: visit.ClassId,
        }));
    }

    // Combine and sort by start time
    const allBookings = [...appointments, ...classVisits].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    // Also get local bookings for any that might not be in Mindbody yet
    const { data: localBookings } = await supabase
      .from("bookings")
      .select("*")
      .eq("session_id", sessionId)
      .gte("start_time", today)
      .order("start_time", { ascending: true });

    return new Response(
      JSON.stringify({
        bookings: allBookings,
        localBookings: localBookings || [],
        user: {
          email: session.email,
          firstName: session.first_name,
          lastName: session.last_name,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("My bookings error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
