import { createServiceClient } from "./supabaseAdmin.ts";

const STAFF_TOKEN_ROW_ID = "default";
/** Refresh this many ms before Mindbody expiry. */
const REFRESH_SKEW_MS = 5 * 60 * 1000;

type CachedStaffToken = {
  access_token: string;
  expires_at: string;
};

async function readCachedStaffToken(): Promise<CachedStaffToken | null> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("mindbody_staff_token")
      .select("access_token, expires_at")
      .eq("id", STAFF_TOKEN_ROW_ID)
      .maybeSingle();

    if (error || !data?.access_token || !data?.expires_at) {
      if (error) console.warn("mindbody_staff_token read:", error.message);
      return null;
    }
    return data as CachedStaffToken;
  } catch (e) {
    console.warn("mindbody_staff_token read failed:", e);
    return null;
  }
}

async function writeCachedStaffToken(accessToken: string, expiresAt: Date): Promise<void> {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("mindbody_staff_token").upsert(
      {
        id: STAFF_TOKEN_ROW_ID,
        access_token: accessToken,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    if (error) console.warn("mindbody_staff_token write:", error.message);
  } catch (e) {
    console.warn("mindbody_staff_token write failed:", e);
  }
}

async function issueStaffTokenFromMindbody(): Promise<{ token: string; expiresInSec: number }> {
  const apiKey = Deno.env.get("MINDBODY_API_KEY")?.trim();
  const siteId = Deno.env.get("MINDBODY_SITE_ID")?.trim();
  const username = Deno.env.get("MINDBODY_STAFF_USERNAME")?.trim();
  const password = Deno.env.get("MINDBODY_STAFF_PASSWORD")?.trim();
  const sourceName = Deno.env.get("MINDBODY_SOURCE_NAME")?.trim();
  const sourcePassword = Deno.env.get("MINDBODY_SOURCE_PASSWORD")?.trim();

  if (!apiKey || !siteId || !username || !password) {
    throw new Error("Missing Mindbody staff credentials");
  }

  const body: Record<string, string> = { Username: username, Password: password };
  if (sourceName && sourcePassword) {
    body.SourceName = sourceName;
    body.SourcePassword = sourcePassword;
  }

  const res = await fetch("https://api.mindbodyonline.com/public/v6/usertoken/issue", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Api-Key": apiKey, "SiteId": siteId },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Mindbody staff auth failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  const token = data.AccessToken as string;
  const expiresInSec = typeof data.ExpiresIn === "number" && data.ExpiresIn > 0
    ? data.ExpiresIn
    : 3600;

  return { token, expiresInSec };
}

/**
 * Issue or reuse a Mindbody staff API token (server-side only).
 * Persists across edge cold starts via `mindbody_staff_token`; refreshes ~5 min before expiry.
 */
export async function getStaffToken(): Promise<string> {
  const cached = await readCachedStaffToken();
  if (cached) {
    const expiresAtMs = new Date(cached.expires_at).getTime();
    if (Number.isFinite(expiresAtMs) && expiresAtMs - REFRESH_SKEW_MS > Date.now()) {
      return cached.access_token;
    }
  }

  const { token, expiresInSec } = await issueStaffTokenFromMindbody();
  const expiresAt = new Date(Date.now() + expiresInSec * 1000);
  await writeCachedStaffToken(token, expiresAt);
  return token;
}
