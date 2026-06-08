import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  mindbodyClientAccountUrl,
  mindbodySignUpUrl,
} from "../_shared/mindbodyBrandedWebUrls.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const siteId = Deno.env.get("MINDBODY_SITE_ID");

  if (req.method === "GET") {
    if (!siteId) {
      return new Response(
        JSON.stringify({ error: "Missing Mindbody site configuration" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }
    return new Response(
      JSON.stringify({
        signUpUrl: mindbodySignUpUrl(siteId),
        accountUrl: mindbodyClientAccountUrl(siteId),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get("MINDBODY_OAUTH_CLIENT_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    if (!clientId || !siteId || !supabaseUrl) {
      throw new Error("Missing Mindbody OAuth configuration");
    }

    // Parse request body for optional native flag, origin, and return path
    let native = false;
    let origin = "";
    let returnTo = "/";
    try {
      const body = await req.json();
      native = !!body.native;
      origin = body.origin || "";
      returnTo = body.returnTo || "/";
    } catch {
      // empty body is fine
    }

    if (!origin) {
      throw new Error("Missing app origin — reload the page and try again");
    }

    // Server-determined redirect URI pointing to our callback edge function
    const redirectUri = `${supabaseUrl}/functions/v1/mindbody-oauth-callback`;

    // Encode native info into the state parameter
    const statePayload = JSON.stringify({
      csrf: crypto.randomUUID(),
      native,
      origin,
      returnTo,
    });
    const state = btoa(statePayload);

    const scope = "openid email profile offline_access Mindbody.Api.Public.v6";
    const responseType = "code id_token";
    const nonce = crypto.randomUUID();
    const authUrl = new URL("https://signin.mindbodyonline.com/connect/authorize");
    authUrl.searchParams.set("response_type", responseType);
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", scope);
    authUrl.searchParams.set("subscriberId", siteId);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("nonce", nonce);
    authUrl.searchParams.set("response_mode", "form_post");
    // Mindbody expects %20 separators (not +) for response_type and scope.
    const authUrlString = authUrl
      .toString()
      .replace(/response_type=[^&]*/, `response_type=${encodeURIComponent(responseType)}`)
      .replace(/scope=[^&]*/, `scope=${encodeURIComponent(scope)}`);

    return new Response(
      JSON.stringify({
        authUrl: authUrlString,
        state,
        signUpUrl: mindbodySignUpUrl(siteId),
        accountUrl: mindbodyClientAccountUrl(siteId),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("OAuth init error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
