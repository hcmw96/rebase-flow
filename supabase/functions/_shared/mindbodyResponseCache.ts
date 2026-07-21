import { createServiceClient } from "./supabaseAdmin.ts";

export const CACHE_TTL = {
  services: 30 * 60, // 30 minutes
  classes: 15 * 60, // 15 minutes
  availability: 5 * 60, // 5 minutes
  /** Fresh window for calendar day keys — longer than slots (dates change slowly). */
  availabilityDays: 15 * 60, // 15 minutes
} as const;

/** Serve stale days-view past TTL so calendars stay instant while we refresh. */
export const AVAILABILITY_DAYS_MAX_STALE_SECONDS = 2 * 60 * 60; // 2 hours

/** Stable cache key from endpoint + sorted params. */
export function buildCacheKey(
  endpoint: string,
  params: Record<string, string | null | undefined> = {},
): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v != null && String(v).length > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${String(v)}`);
  return parts.length ? `${endpoint}:${parts.join("&")}` : endpoint;
}

export type CacheLookup<T> = {
  payload: T;
  fresh: boolean;
  /** Milliseconds since expires_at (positive = expired). */
  staleByMs: number;
};

export async function getCachedJson<T>(cacheKey: string): Promise<T | null> {
  const entry = await lookupCachedJson<T>(cacheKey, 0);
  return entry?.fresh ? entry.payload : null;
}

/** Fresh hit, or stale within maxStaleSeconds (for SWR). */
export async function lookupCachedJson<T>(
  cacheKey: string,
  maxStaleSeconds: number,
): Promise<CacheLookup<T> | null> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("mindbody_api_cache")
      .select("payload, expires_at")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    if (error || !data) {
      if (error) console.warn("mindbody_api_cache read:", error.message);
      return null;
    }

    const expiresAtMs = new Date(data.expires_at).getTime();
    if (!Number.isFinite(expiresAtMs)) return null;

    const now = Date.now();
    const staleByMs = now - expiresAtMs;
    if (staleByMs <= 0) {
      return { payload: data.payload as T, fresh: true, staleByMs: 0 };
    }
    if (staleByMs <= maxStaleSeconds * 1000) {
      return { payload: data.payload as T, fresh: false, staleByMs };
    }
    return null;
  } catch (e) {
    console.warn("mindbody_api_cache read failed:", e);
    return null;
  }
}

export async function setCachedJson(
  cacheKey: string,
  payload: unknown,
  ttlSeconds: number,
): Promise<void> {
  try {
    const supabase = createServiceClient();
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    const { error } = await supabase.from("mindbody_api_cache").upsert(
      {
        cache_key: cacheKey,
        payload,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "cache_key" },
    );
    if (error) console.warn("mindbody_api_cache write:", error.message);
  } catch (e) {
    console.warn("mindbody_api_cache write failed:", e);
  }
}
