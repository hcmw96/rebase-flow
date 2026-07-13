import { createServiceClient } from "./supabaseAdmin.ts";

export const CACHE_TTL = {
  services: 30 * 60, // 30 minutes
  classes: 15 * 60, // 15 minutes
  availability: 5 * 60, // 5 minutes
} as const;

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

export async function getCachedJson<T>(cacheKey: string): Promise<T | null> {
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
    if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
      return null;
    }

    return data.payload as T;
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
