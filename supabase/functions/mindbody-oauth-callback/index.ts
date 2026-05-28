import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  id_token?: string;
}

interface IdTokenPayload {
  sub: string;
  email?: string;
  given_name?: string;
  family_name?: string;
}

interface StatePayload {
  csrf?: string;
  native?: boolean;
  origin?: string;
  returnTo?: string;
}

function decodeJwtPayload(token: string): IdTokenPayload {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT format");
  const payload = parts[1];
  const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(decoded);
}

function parseState(stateStr: string): StatePayload {
  try {
    const decoded = atob(stateStr);
    return JSON.parse(decoded);
  } catch {
    return { csrf: stateStr, native: false, origin: "" };
  }
}

/** UTF-8 safe base64 for URL hash payloads (names/emails may include non-Latin1 chars). */
function encodeHashPayload(data: unknown): string {
  const json = JSON.stringify(data);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return encodeURIComponent(btoa(binary));
}

/** 302 back to the app with session or error in the URL hash (reliable after Mindbody form_post). */
function redirectToApp(
  origin: string,
  payload: { session?: Record<string, unknown>; error?: string },
  returnTo?: string,
) {
  const hashKey = payload.error ? "auth-error" : "auth-session";
  const hashData = payload.error ? { error: payload.error } : payload.session;
  const hashValue = encodeHashPayload(hashData);
  const safeReturnTo = returnTo?.startsWith("/") ? returnTo : "/";
  const url = new URL(safeReturnTo, origin);
  url.hash = `${hashKey}=${hashValue}`;
  return new Response(null, {
    status: 302,
    headers: { Location: url.toString() },
  });
}

async function exchangeAndSaveSession(
  code: string,
  redirectUri: string,
  idTokenHint?: string,
) {
  const clientId = Deno.env.get("MINDBODY_OAUTH_CLIENT_ID");
  const clientSecret = Deno.env.get("MINDBODY_OAUTH_CLIENT_SECRET");
  const siteId = Deno.env.get("MINDBODY_SITE_ID");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!clientId || !clientSecret || !siteId || !supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing required configuration");
  }

  const tokenParams: Record<string, string> = {
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
    scope: "openid email profile Mindbody.Api.Public.v6",
    subscriberId: siteId,
  };

  const tokenResponse = await fetch("https://signin.mindbodyonline.com/connect/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(tokenParams).toString(),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error("Token exchange failed:", errorText);
    throw new Error(`Token exchange failed: ${tokenResponse.status}`);
  }

  const tokens: TokenResponse = await tokenResponse.json();
  console.log("Token exchange successful");

  let userInfo: IdTokenPayload = { sub: "" };
  if (tokens.id_token) {
    userInfo = decodeJwtPayload(tokens.id_token);
  } else if (idTokenHint) {
    userInfo = decodeJwtPayload(idTokenHint);
  } else {
    const userInfoResponse = await fetch("https://signin.mindbodyonline.com/connect/userinfo", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });
    if (!userInfoResponse.ok) {
      const infoError = await userInfoResponse.text();
      console.error("Userinfo fetch failed:", infoError);
      throw new Error("Failed to load user profile from Mindbody");
    }
    userInfo = await userInfoResponse.json();
  }

  if (!userInfo.sub) {
    throw new Error("Mindbody user profile missing subject ID");
  }

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: session, error: sessionError } = await supabase
    .from("mb_sessions")
    .upsert(
      {
        mindbody_client_id: userInfo.sub,
        email: userInfo.email,
        first_name: userInfo.given_name,
        last_name: userInfo.family_name,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        token_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "mindbody_client_id" },
    )
    .select()
    .single();

  if (sessionError) {
    console.error("Session upsert error:", sessionError);
    throw new Error("Failed to save session");
  }

  return {
    sessionId: session.id,
    email: session.email,
    firstName: session.first_name,
    lastName: session.last_name,
    expiresAt: session.token_expires_at,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const redirectUri = `${supabaseUrl}/functions/v1/mindbody-oauth-callback`;
  let formPostOrigin: string | undefined;
  let formPostReturnTo: string | undefined;

  try {
    if (req.method === "POST") {
      const contentType = req.headers.get("content-type") || "";

      if (contentType.includes("application/x-www-form-urlencoded")) {
        const formData = await req.formData();
        const formKeys = [...formData.keys()];
        console.log("Mindbody OAuth form_post fields:", formKeys.join(", "));

        const code = formData.get("code")?.toString() || "";
        const idTokenFromForm = formData.get("id_token")?.toString() || "";
        const error = formData.get("error")?.toString() || "";
        const stateStr = (formData.get("state") as string) || "";
        const statePayload = parseState(stateStr);
        formPostOrigin = statePayload.origin;
        formPostReturnTo = statePayload.returnTo;

        if (!formPostOrigin) {
          throw new Error("OAuth state missing app origin — sign in again from the app");
        }

        if (error) {
          console.error("OAuth error from Mindbody:", error, formData.get("error_description"));
          return redirectToApp(formPostOrigin, { error: String(error) }, formPostReturnTo);
        }

        if (!code) {
          console.error("No code in form_post; id_token present:", !!idTokenFromForm);
          throw new Error("No authorization code received from Mindbody");
        }

        const sessionData = await exchangeAndSaveSession(code, redirectUri, idTokenFromForm || undefined);
        return redirectToApp(formPostOrigin, { session: sessionData }, formPostReturnTo);
      }

      const { code } = await req.json();
      if (!code) throw new Error("Missing code");
      const sessionData = await exchangeAndSaveSession(code, redirectUri);
      return new Response(JSON.stringify(sessionData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  } catch (error) {
    console.error("OAuth callback error:", error);
    const message = error instanceof Error ? error.message : String(error);

    if (formPostOrigin) {
      return redirectToApp(formPostOrigin, { error: message }, formPostReturnTo);
    }

    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});
