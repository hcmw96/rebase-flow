import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get("MINDBODY_OAUTH_CLIENT_ID");
    const siteId = Deno.env.get("MINDBODY_SITE_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    if (!clientId || !siteId || !supabaseUrl) {
      throw new Error("Missing Mindbody OAuth configuration");
    }

    // Parse request body for optional native flag and origin
    let native = false;
    let origin = "";
    try {
      const body = await req.json();
      native = !!body.native;
      origin = body.origin || "";
    } catch {
      // empty body is fine
    }

    // Server-determined redirect URI pointing to our callback edge function
    const redirectUri = `${supabaseUrl}/functions/v1/mindbody-oauth-callback`;

    // Encode native info into the state parameter
    const statePayload = JSON.stringify({
      csrf: crypto.randomUUID(),
      native,
      origin,
    });
    const state = btoa(statePayload);

    const authUrl = new URL("https://signin.mindbodyonline.com/connect/authorize");
    authUrl.searchParams.set("response_type", "code id_token");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", "openid email profile offline_access Mindbody.Api.Public.v6");
    // Mindbody requires the camelCase `subscriberId` parameter to bind the issued token to a site.
    // Using snake_case (`subscriber_id`) is silently ignored and produces a token with no site claim,
    // which then fails Mindbody Public API calls with "User token site id does not match requested site".
    authUrl.searchParams.set("subscriberId", siteId);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("nonce", crypto.randomUUID());
    authUrl.searchParams.set("response_mode", "form_post");

    return new Response(
      JSON.stringify({ authUrl: authUrl.toString(), state }),
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
