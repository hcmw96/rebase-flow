import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getStaffToken(): Promise<string> {
  const apiKey = Deno.env.get("MINDBODY_API_KEY");
  const siteId = Deno.env.get("MINDBODY_SITE_ID");
  const username = Deno.env.get("MINDBODY_STAFF_USERNAME");
  const password = Deno.env.get("MINDBODY_STAFF_PASSWORD");

  if (!apiKey || !siteId || !username || !password) {
    throw new Error("Missing Mindbody staff credentials");
  }

  const response = await fetch("https://api.mindbodyonline.com/public/v6/usertoken/issue", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": apiKey,
      "SiteId": siteId,
    },
    body: JSON.stringify({
      Username: username,
      Password: password,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to get staff token");
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
      availableItemsCount: data.AvailableItems?.length || 0,
      rawResponse: data,
    }));

    // Transform the availability data
    const availableItems = (data.AvailableItems || []).map((item: any) => ({
      id: item.Id,
      staffId: item.Staff?.Id,
      staffName: item.Staff ? `${item.Staff.FirstName} ${item.Staff.LastName}` : null,
      locationId: item.Location?.Id,
      locationName: item.Location?.Name,
      sessionTypeId: item.SessionType?.Id,
      sessionTypeName: item.SessionType?.Name,
      startDateTime: item.StartDateTime,
      endDateTime: item.EndDateTime,
    }));

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
