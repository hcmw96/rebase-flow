import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const normaliseBrand = (value: string | null | undefined): string =>
  (value ?? "").replace(/re[\s-]?base/gi, "Rebase");

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

    const now = new Date();

    // 1. Contracts
    let contracts: any[] = [];
    try {
      const contractsRes = await fetch(
        `https://api.mindbodyonline.com/public/v6/client/clientcontracts?ClientId=${session.mindbody_client_id}`,
        { method: "GET", headers: mbHeaders }
      );
      if (contractsRes.ok) {
        const data = await contractsRes.json();
        contracts = (data.Contracts || [])
          .filter((c: any) => !(c.EndDate && new Date(c.EndDate) < now))
          .map((c: any) => ({
            id: c.Id,
            name: normaliseBrand(c.Name),
            startDate: c.StartDate,
            endDate: c.EndDate,
            autopayEnabled: c.AutopayStatus === "Active",
            agreementDate: c.AgreementDate,
          }));
      } else {
        console.warn("clientcontracts non-OK:", contractsRes.status, await contractsRes.text());
      }
    } catch (e) {
      console.error("clientcontracts error:", e);
    }

    // 2. Client services (credits / packages)
    let clientServices: any[] = [];
    try {
      const servicesRes = await fetch(
        `https://api.mindbodyonline.com/public/v6/client/clientservices?ClientId=${session.mindbody_client_id}`,
        { method: "GET", headers: mbHeaders }
      );
      if (servicesRes.ok) {
        const data = await servicesRes.json();
        clientServices = (data.ClientServices || [])
          .filter((s: any) => {
            if (s.ExpirationDate && new Date(s.ExpirationDate) < now) return false;
            if (s.Remaining !== undefined && s.Remaining <= 0) return false;
            return true;
          })
          .map((s: any) => ({
            id: s.Id,
            name: normaliseBrand(s.Name),
            remaining: s.Remaining,
            expirationDate: s.ExpirationDate,
            paymentDate: s.PaymentDate,
          }));
      } else {
        console.warn("clientservices non-OK:", servicesRes.status, await servicesRes.text());
      }
    } catch (e) {
      console.error("clientservices error:", e);
    }

    // 3. Active client memberships (the actual recurring "Membership" feature)
    let memberships: any[] = [];
    try {
      const membershipsRes = await fetch(
        `https://api.mindbodyonline.com/public/v6/client/activeclientmemberships?ClientId=${session.mindbody_client_id}`,
        { method: "GET", headers: mbHeaders }
      );
      if (membershipsRes.ok) {
        const data = await membershipsRes.json();
        const raw = data.ClientMemberships || data.ActiveClientMemberships || [];
        memberships = raw
          .filter((m: any) => {
            if (m.ExpirationDate && new Date(m.ExpirationDate) < now) return false;
            return true;
          })
          .map((m: any) => ({
            id: m.Id ?? m.ClientMembershipId ?? null,
            membershipId: m.MembershipId ?? null,
            name: normaliseBrand(m.Name),
            programId: m.ProgramId ?? null,
            active: m.Active ?? true,
            autoRenewing: Boolean(m.AutoRenewing),
            activeDate: m.ActiveDate ?? null,
            expirationDate: m.ExpirationDate ?? null,
            remaining: typeof m.Remaining === "number" ? m.Remaining : null,
            paymentDate: m.PaymentDate ?? null,
          }));
      } else {
        console.warn("activeclientmemberships non-OK:", membershipsRes.status, await membershipsRes.text());
      }
    } catch (e) {
      console.error("activeclientmemberships error:", e);
    }

    // 4. Client record for MembershipIcon (tier indicator)
    let membershipIcon: number | null = null;
    try {
      const clientRes = await fetch(
        `https://api.mindbodyonline.com/public/v6/client/clients?ClientIds=${session.mindbody_client_id}&limit=1`,
        { method: "GET", headers: mbHeaders }
      );
      if (clientRes.ok) {
        const data = await clientRes.json();
        const client = (data.Clients || [])[0];
        if (client && typeof client.MembershipIcon === "number") {
          membershipIcon = client.MembershipIcon;
        }
      } else {
        console.warn("clients non-OK:", clientRes.status, await clientRes.text());
      }
    } catch (e) {
      console.error("clients error:", e);
    }

    return new Response(
      JSON.stringify({ contracts, clientServices, memberships, membershipIcon }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Client membership error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
