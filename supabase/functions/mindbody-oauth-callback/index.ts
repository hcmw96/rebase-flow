import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TokenResponse {
  access_token: string;
  refresh_token: string;
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

function decodeJwtPayload(token: string): IdTokenPayload {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }
  const payload = parts[1];
  const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(decoded);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get("MINDBODY_OAUTH_CLIENT_ID");
    const clientSecret = Deno.env.get("MINDBODY_OAUTH_CLIENT_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!clientId || !clientSecret || !supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing required configuration");
    }

    const { code, redirectUri } = await req.json();

    if (!code || !redirectUri) {
      throw new Error("Missing code or redirectUri");
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch("https://signin.mindbodyonline.com/connect/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", errorText);
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }

    const tokens: TokenResponse = await tokenResponse.json();
    console.log("Token exchange successful");

    // Decode the id_token to get user info
    let userInfo: IdTokenPayload = { sub: "" };
    if (tokens.id_token) {
      userInfo = decodeJwtPayload(tokens.id_token);
    }

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Upsert the session
    const { data: session, error: sessionError } = await supabase
      .from("mb_sessions")
      .upsert(
        {
          mindbody_client_id: userInfo.sub,
          email: userInfo.email,
          first_name: userInfo.given_name,
          last_name: userInfo.family_name,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "mindbody_client_id",
        }
      )
      .select()
      .single();

    if (sessionError) {
      console.error("Session upsert error:", sessionError);
      throw new Error("Failed to save session");
    }

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        email: session.email,
        firstName: session.first_name,
        lastName: session.last_name,
        expiresAt: session.token_expires_at,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("OAuth callback error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
