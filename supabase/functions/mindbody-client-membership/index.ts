import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("MINDBODY_API_KEY");
    const siteId = Deno.env.get("MINDBODY_SITE_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!apiKey || !siteId || !supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing required configuration");
    }

    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId) {
      throw new Error("sessionId is required");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: session, error: sessionError } = await supabase
      .from("mb_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error("Session not found. Please log in again.");
    }

    const mbHeaders = {
      "Content-Type": "application/json",
      "Api-Key": apiKey,
      "SiteId": siteId,
      "Authorization": `Bearer ${session.access_token}`,
    };

    // Fetch contracts (memberships)
    const contractsRes = await fetch(
      `https://api.mindbodyonline.com/public/v6/client/clientcontracts?ClientId=${session.mindbody_client_id}`,
      { method: "GET", headers: mbHeaders }
    );

    let contracts: any[] = [];
    if (contractsRes.ok) {
      const data = await contractsRes.json();
      const now = new Date();
      contracts = (data.Contracts || [])
        .filter((c: any) => {
          if (c.EndDate && new Date(c.EndDate) < now) return false;
          return true;
        })
        .map((c: any) => ({
          id: c.Id,
          name: c.Name,
          startDate: c.StartDate,
          endDate: c.EndDate,
          autopayEnabled: c.AutopayStatus === "Active",
          agreementDate: c.AgreementDate,
        }));
    }

    // Fetch client services (credits/packages)
    const servicesRes = await fetch(
      `https://api.mindbodyonline.com/public/v6/client/clientservices?ClientId=${session.mindbody_client_id}`,
      { method: "GET", headers: mbHeaders }
    );

    let clientServices: any[] = [];
    if (servicesRes.ok) {
      const data = await servicesRes.json();
      const now = new Date();
      clientServices = (data.ClientServices || [])
        .filter((s: any) => {
          if (s.ExpirationDate && new Date(s.ExpirationDate) < now) return false;
          if (s.Remaining !== undefined && s.Remaining <= 0) return false;
          return true;
        })
        .map((s: any) => ({
          id: s.Id,
          name: s.Name,
          remaining: s.Remaining,
          expirationDate: s.ExpirationDate,
          paymentDate: s.PaymentDate,
        }));
    }

    return new Response(
      JSON.stringify({ contracts, clientServices }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Client membership error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
