import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  parseMindbodyLocalDateTime,
  studioDateKeyFromInstant,
  studioTodayKey,
} from "../_shared/londonTime.ts";
import { getStaffToken } from "../_shared/mindbodyStaff.ts";
import { resolveBookableSessionMinutes } from "../_shared/sessionDuration.ts";
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

/** How often a booking can start within a free window (studio books in 15-min steps). */
const SLOT_START_INTERVAL_MINUTES = 15;

type AvailabilityWindow = {
  Id?: string | number;
  StartDateTime?: string;
  EndDateTime?: string;
  BookableEndDateTime?: string;
  Staff?: { Id?: number; FirstName?: string; LastName?: string };
  Location?: { Id?: number; Name?: string };
  SessionType?: { Id?: number; Name?: string; DefaultTimeLength?: number };
};

function resolveWindowEnd(availability: AvailabilityWindow, sessionLength: number): Date | null {
  const defaultTimeLength = availability.SessionType?.DefaultTimeLength;
  if (availability.EndDateTime) {
    return parseMindbodyLocalDateTime(availability.EndDateTime);
  }
  if (availability.BookableEndDateTime) {
    const bookableEnd = parseMindbodyLocalDateTime(availability.BookableEndDateTime);
    const bufferMinutes = Math.max(0, (defaultTimeLength || sessionLength) - sessionLength);
    return new Date(bookableEnd.getTime() + bufferMinutes * 60 * 1000);
  }
  return null;
}

/**
 * Slice a Mindbody availability window into discrete bookable starts.
 * Prefer customer-facing name duration over DefaultTimeLength (prep buffer).
 */
function generateTimeSlots(availability: AvailabilityWindow): Record<string, unknown>[] {
  const slots: Record<string, unknown>[] = [];
  const sessionTypeName = availability.SessionType?.Name;
  const defaultTimeLength = availability.SessionType?.DefaultTimeLength;
  const sessionLength = resolveBookableSessionMinutes(sessionTypeName, defaultTimeLength);
  if (!availability.StartDateTime) return slots;

  const startTime = parseMindbodyLocalDateTime(availability.StartDateTime);
  const windowEnd = resolveWindowEnd(availability, sessionLength);
  if (!windowEnd) return slots;

  const stepMs = SLOT_START_INTERVAL_MINUTES * 60 * 1000;
  const sessionMs = sessionLength * 60 * 1000;

  let slotStart = new Date(startTime);
  while (slotStart < windowEnd) {
    const slotEnd = new Date(slotStart.getTime() + sessionMs);
    if (slotEnd <= windowEnd) {
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
        sessionLengthMinutes: sessionLength,
      });
    }
    slotStart = new Date(slotStart.getTime() + stepMs);
  }
  return slots;
}

/** Mark London calendar days that have at least one bookable start (no heavy slot payload). */
function collectAvailableDayKeys(availability: AvailabilityWindow, nowMs: number): string[] {
  const sessionTypeName = availability.SessionType?.Name;
  const defaultTimeLength = availability.SessionType?.DefaultTimeLength;
  const sessionLength = resolveBookableSessionMinutes(sessionTypeName, defaultTimeLength);
  if (!availability.StartDateTime) return [];

  const startTime = parseMindbodyLocalDateTime(availability.StartDateTime);
  const windowEnd = resolveWindowEnd(availability, sessionLength);
  if (!windowEnd) return [];

  const stepMs = SLOT_START_INTERVAL_MINUTES * 60 * 1000;
  const sessionMs = sessionLength * 60 * 1000;
  const keys = new Set<string>();

  let slotStart = new Date(startTime);
  while (slotStart.getTime() + sessionMs <= windowEnd.getTime()) {
    if (slotStart.getTime() > nowMs) {
      keys.add(studioDateKeyFromInstant(slotStart));
    }
    slotStart = new Date(slotStart.getTime() + stepMs);
  }
  return Array.from(keys);
}

type AvailabilityPayload = {
  availableItems: unknown[];
  availableDays: string[];
  availableStaff: unknown[];
};

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
    const viewParam = (url.searchParams.get("view") || "slots").toLowerCase();
    const view: "days" | "slots" = viewParam === "days" ? "days" : "slots";

    if (!sessionTypeId) {
      throw new Error("sessionTypeId is required");
    }

    const { start: mindbodyStart, end: mindbodyEnd } = resolveDateRange(startDate, endDate);

    const cacheKey = buildCacheKey("availability:v3", {
      sessionTypeId,
      staffId,
      start: mindbodyStart,
      end: mindbodyEnd,
      view,
    });
    const cached = await getCachedJson<AvailabilityPayload>(cacheKey);
    if (cached && Array.isArray(cached.availableItems) && Array.isArray(cached.availableDays)) {
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const staffToken = await getStaffToken();

    const allAvailabilities: AvailabilityWindow[] = [];
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
        view,
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
      view,
      availabilitiesCount: allAvailabilities.length,
    }));

    const now = Date.now();
    let availableItems: Record<string, unknown>[] = [];
    let availableDays: string[] = [];

    if (view === "days") {
      const dayKeys = new Set<string>();
      for (const window of allAvailabilities) {
        for (const key of collectAvailableDayKeys(window, now)) {
          dayKeys.add(key);
        }
      }
      availableDays = Array.from(dayKeys).sort();
    } else {
      const rawSlots = allAvailabilities
        .flatMap(generateTimeSlots)
        .filter((slot) => {
          const start = slot.startDateTime;
          if (typeof start !== "string") return false;
          return parseMindbodyLocalDateTime(start).getTime() > now;
        });

      const dedupMap = new Map<string, Record<string, unknown>>();
      for (const slot of rawSlots) {
        const key = `${slot.staffId ?? ""}|${slot.locationId ?? ""}|${slot.sessionTypeId ?? ""}|${slot.startDateTime}`;
        if (!dedupMap.has(key)) dedupMap.set(key, slot);
      }
      availableItems = Array.from(dedupMap.values()).sort((a, b) => {
        const aStart = parseMindbodyLocalDateTime(String(a.startDateTime)).getTime();
        const bStart = parseMindbodyLocalDateTime(String(b.startDateTime)).getTime();
        return aStart - bStart;
      });
      availableDays = Array.from(
        new Set(
          availableItems.map((slot) =>
            studioDateKeyFromInstant(parseMindbodyLocalDateTime(String(slot.startDateTime))),
          ),
        ),
      ).sort();

      console.log("Availability dedup:", {
        sessionTypeId,
        rawCount: rawSlots.length,
        dedupedCount: availableItems.length,
        removed: rawSlots.length - availableItems.length,
      });
    }

    // Staff list only needed for slot detail views; skip on calendar-days to keep responses tiny.
    let availableStaff: unknown[] = [];
    if (view === "slots") {
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

      if (staffResponse.ok) {
        const staffData = await staffResponse.json();
        availableStaff = (staffData.StaffMembers || []).map((s: {
          Id: number;
          FirstName: string;
          LastName: string;
          ImageUrl?: string;
          Bio?: string;
        }) => ({
          id: s.Id,
          name: `${s.FirstName} ${s.LastName}`,
          imageUrl: s.ImageUrl,
          bio: s.Bio,
        }));
      }
    }

    const payload: AvailabilityPayload = {
      availableItems,
      availableDays,
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
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
