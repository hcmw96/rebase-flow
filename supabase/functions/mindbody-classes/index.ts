import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Mindbody legacy labels → user-facing names (keep in sync with src/config/serviceConfig.ts). */
function resolveDisplayName(name: string): string {
  const trimmed = name.trim();
  const aliases: Record<string, string> = {
    "Member's Suite": "Communal Contrast",
    "Members Suite": "Communal Contrast",
    "Urban Oasis": "Yoga Flow + Heat & Ice",
    "Urban Oasis Class": "Yoga Flow + Heat & Ice",
  };
  if (aliases[trimmed]) return aliases[trimmed];
  const lower = trimmed.toLowerCase();
  const fromLower = Object.entries(aliases).find(([k]) => k.toLowerCase() === lower)?.[1];
  if (fromLower) return fromLower;
  if (/^members?\s*(only|suite)/i.test(trimmed)) return "Communal Contrast";
  if (/urban\s*oasis/i.test(trimmed)) return "Yoga Flow + Heat & Ice";
  return trimmed;
}

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
    const startDate = url.searchParams.get("startDate") || new Date().toISOString().split("T")[0];
    const endDate = url.searchParams.get("endDate");
    const classDescriptionId = url.searchParams.get("classDescriptionId");
    const programId = url.searchParams.get("programId");

    const staffToken = await getStaffToken();

    // Build base query params
    const baseParams = new URLSearchParams();
    baseParams.set("StartDateTime", startDate);
    if (endDate) baseParams.set("EndDateTime", endDate);
    if (classDescriptionId) baseParams.set("ClassDescriptionIds", classDescriptionId);
    if (programId) baseParams.set("ProgramIds", programId);
    baseParams.set("HideCanceledClasses", "true");

    // Mindbody caps each page at 100; paginate so high-volume schedules
    // (e.g. Communal Contrast / legacy Member's Suite) don't bury other classes like Yoga/Pilates.
    const PAGE_SIZE = 100;
    const HARD_CAP = 2000;
    const allClasses: any[] = [];
    let offset = 0;

    while (offset < HARD_CAP) {
      const params = new URLSearchParams(baseParams);
      params.set("Limit", String(PAGE_SIZE));
      params.set("Offset", String(offset));

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
      const page = classesData.Classes || [];
      allClasses.push(...page);

      const total = classesData.PaginationResponse?.TotalResults;
      if (page.length === 0) break;
      if (typeof total === "number" && allClasses.length >= total) break;
      if (page.length < PAGE_SIZE) break;
      offset += page.length;
    }

    const now = Date.now();

    // Transform classes data (exclude sessions that have already started)
    const classes = allClasses
      .filter((c: any) => new Date(c.StartDateTime).getTime() > now)
      .map((c: any) => ({
      id: c.Id.toString(),
      classDescriptionId: c.ClassDescription?.Id,
      name: resolveDisplayName(c.ClassDescription?.Name || "Class"),
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
      programName: resolveDisplayName(c.ClassDescription?.Program?.Name || ""),
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
