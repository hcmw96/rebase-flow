import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchMindbodyClientProfile } from "../_shared/mindbodyClientProfile.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Buffer before we treat the stored access token as expired (clock skew / network delay). */
const EXPIRY_BUFFER_MS = 2 * 60 * 1000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const apiKey = Deno.env.get("MINDBODY_API_KEY");
    const siteId = Deno.env.get("MINDBODY_SITE_ID");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");
    if (!sessionId) {
      throw new Error("sessionId is required");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let { data: session, error } = await supabase
      .from("mb_sessions")
      .select("id, mindbody_client_id, email, first_name, last_name, token_expires_at, access_token")
      .eq("id", sessionId)
      .maybeSingle();

    if (error || !session) {
      return new Response(JSON.stringify({ valid: false, reason: "not_found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const expiresAtMs = new Date(session.token_expires_at).getTime();
    if (Number.isNaN(expiresAtMs) || expiresAtMs - EXPIRY_BUFFER_MS <= Date.now()) {
      return new Response(JSON.stringify({ valid: false, reason: "expired" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (!session.access_token) {
      return new Response(JSON.stringify({ valid: false, reason: "no_token" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (apiKey && siteId && session.mindbody_client_id && (!session.email || !session.first_name)) {
      const clientProfile = await fetchMindbodyClientProfile(
        session.mindbody_client_id,
        session.access_token,
        apiKey,
        siteId,
      );
      if (clientProfile && (clientProfile.email || clientProfile.firstName)) {
        const { data: updated } = await supabase
          .from("mb_sessions")
          .update({
            email: clientProfile.email ?? session.email,
            first_name: clientProfile.firstName ?? session.first_name,
            last_name: clientProfile.lastName ?? session.last_name,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sessionId)
          .select("id, mindbody_client_id, email, first_name, last_name, token_expires_at")
          .single();
        if (updated) session = { ...session, ...updated };
      }
    }

    return new Response(
      JSON.stringify({
        valid: true,
        session: {
          sessionId: session.id,
          email: session.email,
          firstName: session.first_name,
          lastName: session.last_name,
          expiresAt: session.token_expires_at,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
