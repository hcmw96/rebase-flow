import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function decodeJwt(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const padded = parts[1] + "=".repeat((4 - (parts[1].length % 4)) % 4);
    return JSON.parse(atob(padded.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("MINDBODY_API_KEY")!;
    const siteId = Deno.env.get("MINDBODY_SITE_ID")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const { sessionId, probe } = await req.json();
    if (!sessionId) throw new Error("sessionId required");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: session, error } = await supabase
      .from("mb_sessions").select("*").eq("id", sessionId).single();
    if (error || !session) throw new Error("Session not found");

    const claims = decodeJwt(session.access_token) || {};
    const tokenSiteIds = claims.site_ids ?? claims.siteid ?? claims.site_id ?? null;
    const matchesExpectedSite = Array.isArray(tokenSiteIds)
      ? tokenSiteIds.map(String).includes(String(siteId))
      : String(tokenSiteIds) === String(siteId);

    let probeResult: any = null;
    if (probe) {
      // Safe read-only call to test if token is accepted for this site (no charge).
      const r = await fetch(
        `https://api.mindbodyonline.com/public/v6/client/clients?ClientIds=${encodeURIComponent(session.mindbody_client_id)}`,
        {
          headers: {
            "Api-Key": apiKey,
            "SiteId": siteId,
            "Authorization": `Bearer ${session.access_token}`,
          },
        }
      );
      const text = await r.text();
      probeResult = { status: r.status, ok: r.ok, body: text.slice(0, 500) };
    }

    return new Response(JSON.stringify({
      expectedSiteId: siteId,
      tokenClaims: {
        site_ids: claims.site_ids,
        siteid: claims.siteid,
        site_id: claims.site_id,
        subscriberId: claims.subscriberId,
        aud: claims.aud,
        exp: claims.exp,
      },
      matchesExpectedSite,
      mindbodyClientId: session.mindbody_client_id,
      tokenExpiresAt: session.token_expires_at,
      probe: probeResult,
    }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
