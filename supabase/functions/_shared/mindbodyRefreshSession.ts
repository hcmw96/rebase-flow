import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export const MINDBODY_OAUTH_SCOPE = "openid email profile offline_access Mindbody.Api.Public.v6";

export const TOKEN_EXPIRY_BUFFER_MS = 2 * 60 * 1000;

export function isMindbodyTokenExpired(tokenExpiresAt: string): boolean {
  const expiresAtMs = new Date(tokenExpiresAt).getTime();
  return Number.isNaN(expiresAtMs) || expiresAtMs - TOKEN_EXPIRY_BUFFER_MS <= Date.now();
}

type MbSessionRow = {
  id: string;
  mindbody_client_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string;
};

/** Refresh Mindbody tokens when expired but a refresh_token exists. Returns updated row or null. */
export async function refreshMindbodySessionIfNeeded(
  supabase: SupabaseClient,
  session: MbSessionRow,
  options?: { force?: boolean },
): Promise<MbSessionRow | null> {
  if (!options?.force && !isMindbodyTokenExpired(session.token_expires_at)) {
    return session;
  }

  if (!session.refresh_token) {
    return null;
  }

  const clientId = Deno.env.get("MINDBODY_OAUTH_CLIENT_ID");
  const clientSecret = Deno.env.get("MINDBODY_OAUTH_CLIENT_SECRET");
  const siteId = Deno.env.get("MINDBODY_SITE_ID");

  if (!clientId || !clientSecret || !siteId) {
    console.error("Missing Mindbody OAuth configuration for token refresh");
    return null;
  }

  const tokenResponse = await fetch("https://signin.mindbodyonline.com/connect/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: session.refresh_token,
      client_id: clientId,
      client_secret: clientSecret,
      scope: MINDBODY_OAUTH_SCOPE,
      subscriberId: siteId,
    }).toString(),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error("Mindbody token refresh failed:", errorText);
    await supabase.from("mb_sessions").delete().eq("id", session.id);
    return null;
  }

  const tokens = await tokenResponse.json();
  const expiresInSec = Number(tokens.expires_in) > 0 ? Number(tokens.expires_in) : 3600;
  const expiresAt = new Date(Date.now() + expiresInSec * 1000).toISOString();

  const { data: updated, error } = await supabase
    .from("mb_sessions")
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || session.refresh_token,
      token_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.id)
    .select("*")
    .single();

  if (error || !updated) {
    console.error("Failed to persist refreshed Mindbody session:", error?.message);
    return null;
  }

  return updated as MbSessionRow;
}
