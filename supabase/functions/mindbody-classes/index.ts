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
    const startDate = url.searchParams.get("startDate") || new Date().toISOString().split("T")[0];
    const endDate = url.searchParams.get("endDate");
    const classDescriptionId = url.searchParams.get("classDescriptionId");
    const programId = url.searchParams.get("programId");

    const staffToken = await getStaffToken();

    // Build query params
    const params = new URLSearchParams();
    params.set("StartDateTime", startDate);
    if (endDate) params.set("EndDateTime", endDate);
    if (classDescriptionId) params.set("ClassDescriptionIds", classDescriptionId);
    if (programId) params.set("ProgramIds", programId);
    params.set("HideCanceledClasses", "true");

    const classesResponse = await fetch(
      `https://api.mindbodyonline.com/public/v6/class/classes?${params.toString()}`,
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

    if (!classesResponse.ok) {
      const errorText = await classesResponse.text();
      console.error("Classes fetch error:", errorText);
      throw new Error("Failed to fetch classes");
    }

    const classesData = await classesResponse.json();

    // Transform classes data
    const classes = (classesData.Classes || []).map((c: any) => ({
      id: c.Id.toString(),
      classDescriptionId: c.ClassDescription?.Id,
      name: c.ClassDescription?.Name || "Class",
      description: c.ClassDescription?.Description || "",
      startDateTime: c.StartDateTime,
      endDateTime: c.EndDateTime,
      staffId: c.Staff?.Id,
      staffName: c.Staff ? `${c.Staff.FirstName} ${c.Staff.LastName}` : null,
      locationId: c.Location?.Id,
      locationName: c.Location?.Name,
      totalBooked: c.TotalBooked,
      maxCapacity: c.MaxCapacity,
      webCapacity: c.WebCapacity,
      availableSpots: Math.max(0, (c.MaxCapacity || 0) - (c.TotalBooked || 0)),
      isCanceled: c.IsCanceled,
      isWaitlistAvailable: c.IsWaitlistAvailable,
      programId: c.ClassDescription?.Program?.Id,
      programName: c.ClassDescription?.Program?.Name,
    }));

    return new Response(
      JSON.stringify({ classes }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Classes fetch error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
