import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getStaffToken(): Promise<string> {
  const apiKey = Deno.env.get("MINDBODY_API_KEY")?.trim();
  const siteId = Deno.env.get("MINDBODY_SITE_ID")?.trim();
  const username = Deno.env.get("MINDBODY_STAFF_USERNAME")?.trim();
  const password = Deno.env.get("MINDBODY_STAFF_PASSWORD")?.trim();
  const sourceName = Deno.env.get("MINDBODY_SOURCE_NAME")?.trim();
  const sourcePassword = Deno.env.get("MINDBODY_SOURCE_PASSWORD")?.trim();

  if (!apiKey || !siteId || !username || !password) {
    throw new Error("Missing Mindbody staff credentials");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Api-Key": apiKey,
    "SiteId": siteId,
  };

  const body: Record<string, string> = {
    Username: username,
    Password: password,
  };

  if (sourceName && sourcePassword) {
    body.SourceName = sourceName;
    body.SourcePassword = sourcePassword;
  }

  const response = await fetch("https://api.mindbodyonline.com/public/v6/usertoken/issue", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Staff token error (status", response.status, "):", errorText);
    throw new Error(`Mindbody auth failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.AccessToken;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("MINDBODY_API_KEY");
    const siteId = Deno.env.get("MINDBODY_SITE_ID");

    if (!apiKey || !siteId) {
      throw new Error("Missing Mindbody API configuration");
    }

    const url = new URL(req.url);
    const sessionTypeId = url.searchParams.get("sessionTypeId");
    const staffId = url.searchParams.get("staffId");
    const startDate = url.searchParams.get("startDate") || new Date().toISOString().split("T")[0];
    const endDate = url.searchParams.get("endDate");

    if (!sessionTypeId) {
      throw new Error("sessionTypeId is required");
    }

    const staffToken = await getStaffToken();

    // Build query params for bookable items
    const params = new URLSearchParams();
    params.set("SessionTypeIds", sessionTypeId);
    params.set("StartDate", startDate);
    if (endDate) params.set("EndDate", endDate);
    if (staffId) params.set("StaffIds", staffId);

    const response = await fetch(
      `https://api.mindbodyonline.com/public/v6/appointment/bookableitems?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": apiKey,
          "SiteId": siteId,
          "Authorization": `Bearer ${staffToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Availability fetch error:", errorText);
      throw new Error("Failed to fetch availability");
    }

    const data = await response.json();
    
    // Enhanced logging for debugging availability issues
    console.log("Mindbody bookableitems response:", JSON.stringify({
      sessionTypeId,
      staffId,
      startDate,
      endDate,
      availabilitiesCount: data.Availabilities?.length || 0,
    }));

    // Generate individual time slots from availability windows
    function generateTimeSlots(availability: any): any[] {
      const slots: any[] = [];
      const sessionLength = availability.SessionType?.DefaultTimeLength || 60;
      const startTime = new Date(availability.StartDateTime);
      const bookableEndTime = new Date(availability.BookableEndDateTime || availability.EndDateTime);
      
      let slotStart = new Date(startTime);
      while (slotStart < bookableEndTime) {
        const slotEnd = new Date(slotStart.getTime() + sessionLength * 60 * 1000);
        // Only add slot if it ends before or at the bookable end time
        if (slotEnd <= new Date(availability.EndDateTime)) {
          slots.push({
            id: `${availability.Id}-${slotStart.toISOString()}`,
            staffId: availability.Staff?.Id,
            staffName: availability.Staff ? 
              `${availability.Staff.FirstName} ${availability.Staff.LastName}`.trim() : null,
            locationId: availability.Location?.Id,
            locationName: availability.Location?.Name,
            sessionTypeId: availability.SessionType?.Id,
            sessionTypeName: availability.SessionType?.Name,
            startDateTime: slotStart.toISOString(),
            endDateTime: slotEnd.toISOString(),
          });
        }
        slotStart = slotEnd;
      }
      return slots;
    }

    // Transform availability windows into individual bookable time slots
    const availableItems = (data.Availabilities || []).flatMap(generateTimeSlots);

    // Also fetch staff list for the session type
    const staffResponse = await fetch(
      `https://api.mindbodyonline.com/public/v6/appointment/schedulableitems?SessionTypeIds=${sessionTypeId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": apiKey,
          "SiteId": siteId,
          "Authorization": `Bearer ${staffToken}`,
        },
      }
    );

    let availableStaff = [];
    if (staffResponse.ok) {
      const staffData = await staffResponse.json();
      availableStaff = (staffData.StaffMembers || []).map((s: any) => ({
        id: s.Id,
        name: `${s.FirstName} ${s.LastName}`,
        imageUrl: s.ImageUrl,
        bio: s.Bio,
      }));
    }

    return new Response(
      JSON.stringify({
        availableItems,
        availableStaff,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Availability fetch error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
