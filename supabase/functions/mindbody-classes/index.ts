import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parseMindbodyLocalDateTime, studioTodayKey, toUtcIsoFromMindbody } from "../_shared/londonTime.ts";
import { getStaffToken } from "../_shared/mindbodyStaff.ts";
import {
  buildCacheKey,
  CACHE_TTL,
  getCachedJson,
  setCachedJson,
} from "../_shared/mindbodyResponseCache.ts";

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
    "Ladie's Hour: Gut, Glow & Flow": "Ladies' Hour: Gut, Glow & Flow",
  };
  if (aliases[trimmed]) return aliases[trimmed];
  const lower = trimmed.toLowerCase();
  const fromLower = Object.entries(aliases).find(([k]) => k.toLowerCase() === lower)?.[1];
  if (fromLower) return fromLower;
  if (/^members?\s*(only|suite)/i.test(trimmed)) return "Communal Contrast";
  if (/urban\s*oasis/i.test(trimmed)) return "Yoga Flow + Heat & Ice";
  return trimmed;
}

/** Keep in sync with COMMUNAL_CONTRAST_DESCRIPTION in src/config/serviceConfig.ts */
const COMMUNAL_CONTRAST_DESCRIPTION =
  "The Communal Contrast gives you access to several ice baths, traditional Finnish sauna, and bucket showers for independent use. Designed to foster relaxation and recovery, this shared area provides a self-guided experience for guests to enhance their well-being. Please note this is not a class, spaces are limited to availability and we limit drop-ins to one session per person per day to ensure availability for all guests. These sessions are up to 50 minutes.";

const PAGE_SIZE = 100;
const HARD_CAP = 2000;

async function fetchMindbodyClassPages(
  apiKey: string,
  siteId: string,
  staffToken: string,
  baseParams: URLSearchParams,
): Promise<any[]> {
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
      },
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

  return allClasses;
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
    const startDate = url.searchParams.get("startDate") || studioTodayKey();
    const endDate = url.searchParams.get("endDate");
    const classDescriptionId = url.searchParams.get("classDescriptionId");
    const programId = url.searchParams.get("programId");

    const cacheKey = buildCacheKey("classes:v1", {
      startDate,
      endDate,
      classDescriptionId,
      programId,
    });
    const cached = await getCachedJson<{ classes: unknown[] }>(cacheKey);
    if (cached?.classes) {
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const staffToken = await getStaffToken();

    const descriptionIds = classDescriptionId
      ? classDescriptionId.split(",").map((id) => id.trim()).filter(Boolean)
      : [];

    // Mindbody returns empty results when multiple ClassDescriptionIds are comma-separated;
    // fetch each ID separately and merge.
    let allClasses: any[] = [];

    if (descriptionIds.length > 1) {
      const seen = new Set<number>();
      for (const id of descriptionIds) {
        const baseParams = new URLSearchParams();
        baseParams.set("StartDateTime", startDate);
        if (endDate) baseParams.set("EndDateTime", endDate);
        baseParams.set("ClassDescriptionIds", id);
        if (programId) baseParams.set("ProgramIds", programId);
        baseParams.set("HideCanceledClasses", "true");

        const pages = await fetchMindbodyClassPages(apiKey, siteId, staffToken, baseParams);
        for (const cls of pages) {
          if (!seen.has(cls.Id)) {
            seen.add(cls.Id);
            allClasses.push(cls);
          }
        }
      }
    } else {
      const baseParams = new URLSearchParams();
      baseParams.set("StartDateTime", startDate);
      if (endDate) baseParams.set("EndDateTime", endDate);
      if (descriptionIds.length === 1) {
        baseParams.set("ClassDescriptionIds", descriptionIds[0]);
      }
      if (programId) baseParams.set("ProgramIds", programId);
      baseParams.set("HideCanceledClasses", "true");

      allClasses = await fetchMindbodyClassPages(apiKey, siteId, staffToken, baseParams);
    }

    const now = Date.now();

    // Transform classes data (exclude sessions that have already started)
    const classes = allClasses
      .filter((c: any) => parseMindbodyLocalDateTime(c.StartDateTime).getTime() > now)
      .map((c: any) => ({
      id: c.Id.toString(),
      classDescriptionId: c.ClassDescription?.Id,
      name: resolveDisplayName(c.ClassDescription?.Name || "Class"),
      description: (() => {
        const displayName = resolveDisplayName(c.ClassDescription?.Name || "Class");
        if (displayName === "Communal Contrast") return COMMUNAL_CONTRAST_DESCRIPTION;
        return c.ClassDescription?.Description || "";
      })(),
      startDateTime: toUtcIsoFromMindbody(c.StartDateTime),
      endDateTime: toUtcIsoFromMindbody(c.EndDateTime),
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

    const payload = { classes };
    await setCachedJson(cacheKey, payload, CACHE_TTL.classes);

    return new Response(
      JSON.stringify(payload),
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
