import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parseMindbodyLocalDateTime, studioTodayKey } from "../_shared/londonTime.ts";
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

const PAGE_SIZE = 200;
const MAX_AVAILABILITY_WINDOWS = 2000;

/** Mindbody expects DateTime strings; use site-local day boundaries (London). */
function dateOnly(value: string): string {
  return value.slice(0, 10);
}

/** Legacy clients sent endDate = startDate + 1 day for a single-day picker — treat as one day. */
function isExclusiveNextDay(start: string, end: string): boolean {
  const s = dateOnly(start);
  const e = dateOnly(end);
  if (s === e) return false;
  const next = new Date(`${s}T12:00:00`);
  next.setDate(next.getDate() + 1);
  const expected = next.toISOString().slice(0, 10);
  return e === expected;
}

function toMindbodyStart(dateStr: string): string {
  const day = dateOnly(dateStr);
  return day.includes("T") ? dateStr : `${day}T00:00:00`;
}

function toMindbodyEnd(dateStr: string): string {
  const day = dateOnly(dateStr);
  return day.includes("T") ? dateStr : `${day}T23:59:59`;
}

function resolveDateRange(startDate: string, endDate?: string | null): { start: string; end: string } {
  const start = toMindbodyStart(startDate);
  if (!endDate) {
    return { start, end: toMindbodyEnd(startDate) };
  }
  if (isExclusiveNextDay(startDate, endDate)) {
    return { start, end: toMindbodyEnd(startDate) };
  }
  return { start, end: toMindbodyEnd(endDate) };
}

function generateTimeSlots(availability: any): any[] {
  const slots: any[] = [];
  const sessionLength = availability.SessionType?.DefaultTimeLength || 60;
  const startTime = parseMindbodyLocalDateTime(availability.StartDateTime);
  const bookableEndTime = parseMindbodyLocalDateTime(
    availability.BookableEndDateTime || availability.EndDateTime,
  );

  let slotStart = new Date(startTime);
  while (slotStart < bookableEndTime) {
    const slotEnd = new Date(slotStart.getTime() + sessionLength * 60 * 1000);
    if (slotEnd <= bookableEndTime) {
      slots.push({
        id: `${availability.Id}-${slotStart.toISOString()}`,
        staffId: availability.Staff?.Id,
        staffName: availability.Staff
          ? `${availability.Staff.FirstName} ${availability.Staff.LastName}`.trim()
          : null,
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
    const startDate =
      url.searchParams.get("startDate") || studioTodayKey();
    const endDate = url.searchParams.get("endDate");

    if (!sessionTypeId) {
      throw new Error("sessionTypeId is required");
    }

    const { start: mindbodyStart, end: mindbodyEnd } = resolveDateRange(startDate, endDate);

    const cacheKey = buildCacheKey("availability:v1", {
      sessionTypeId,
      staffId,
      start: mindbodyStart,
      end: mindbodyEnd,
    });
    const cached = await getCachedJson<{
      availableItems: unknown[];
      availableStaff: unknown[];
    }>(cacheKey);
    if (cached?.availableItems) {
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const staffToken = await getStaffToken();

    const allAvailabilities: any[] = [];
    let offset = 0;

    while (offset < MAX_AVAILABILITY_WINDOWS) {
      const params = new URLSearchParams();
      params.set("SessionTypeIds", sessionTypeId);
      params.set("StartDate", mindbodyStart);
      params.set("EndDate", mindbodyEnd);
      params.set("IgnoreDefaultSessionLength", "true");
      params.set("Limit", String(PAGE_SIZE));
      params.set("Offset", String(offset));
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
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Availability fetch error:", errorText);
        throw new Error("Failed to fetch availability");
      }

      const data = await response.json();
      const batch = data.Availabilities || [];
      allAvailabilities.push(...batch);

      const total = data.PaginationResponse?.TotalResults;
      console.log("Mindbody bookableitems page:", {
        sessionTypeId,
        offset,
        batchSize: batch.length,
        total,
      });

      if (batch.length === 0) break;
      if (typeof total === "number" && allAvailabilities.length >= total) break;
      if (batch.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }

    console.log("Mindbody bookableitems summary:", JSON.stringify({
      sessionTypeId,
      staffId,
      mindbodyStart,
      mindbodyEnd,
      availabilitiesCount: allAvailabilities.length,
    }));

    const now = Date.now();
    const rawSlots = allAvailabilities
      .flatMap(generateTimeSlots)
      .filter((slot) => parseMindbodyLocalDateTime(slot.startDateTime).getTime() > now);

    const dedupMap = new Map<string, any>();
    for (const slot of rawSlots) {
      const key = `${slot.staffId ?? ""}|${slot.locationId ?? ""}|${slot.sessionTypeId ?? ""}|${slot.startDateTime}`;
      if (!dedupMap.has(key)) dedupMap.set(key, slot);
    }
    const availableItems = Array.from(dedupMap.values()).sort(
      (a, b) =>
        parseMindbodyLocalDateTime(a.startDateTime).getTime() -
        parseMindbodyLocalDateTime(b.startDateTime).getTime(),
    );

    console.log("Availability dedup:", {
      sessionTypeId,
      rawCount: rawSlots.length,
      dedupedCount: availableItems.length,
      removed: rawSlots.length - availableItems.length,
    });

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
      },
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

    const payload = {
      availableItems,
      availableStaff,
    };
    await setCachedJson(cacheKey, payload, CACHE_TTL.availability);

    return new Response(
      JSON.stringify(payload),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Availability fetch error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
