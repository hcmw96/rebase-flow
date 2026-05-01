import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const normaliseBrand = (value: string | null | undefined): string =>
  (value ?? "").replace(/re[\s-]?base/gi, "Rebase");

async function getStaffToken(): Promise<string> {
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
  return data.AccessToken;
}

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
      .select("id, mindbody_client_id")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error("Session not found. Please log in again.");
    }

    const staffToken = await getStaffToken();

    const mbHeaders = {
      "Content-Type": "application/json",
      "Api-Key": apiKey,
      "SiteId": siteId,
      "Authorization": `Bearer ${staffToken}`,
    };

    const publicClientId = session.mindbody_client_id;
    const now = new Date();

    // Resolve the site-local numeric ClientId from the OAuth public id.
    // Mindbody's /client/clients supports `ClientIds` (the public-id) and returns
    // the local Id we need for the other client/* endpoints.
    let clientId: string = publicClientId;
    let membershipIcon: number | null = null;
    try {
      const r = await fetch(
        `https://api.mindbodyonline.com/public/v6/client/clients?ClientIds=${publicClientId}&limit=1&CrossRegionalLookup=true`,
        { method: "GET", headers: mbHeaders }
      );
      if (r.ok) {
        const data = await r.json();
        const client = (data.Clients || [])[0];
        if (client) {
          if (client.Id) clientId = String(client.Id);
          if (typeof client.MembershipIcon === "number") membershipIcon = client.MembershipIcon;
        } else {
          console.warn("clients lookup returned no clients for", publicClientId);
        }
      } else {
        console.warn("clients non-OK:", r.status, await r.text());
      }
    } catch (e) {
      console.error("clients error:", e);
    }

    // 1. Contracts
    let contracts: any[] = [];
    try {
      const r = await fetch(
        `https://api.mindbodyonline.com/public/v6/client/clientcontracts?ClientId=${clientId}`,
        { method: "GET", headers: mbHeaders }
      );
      if (r.ok) {
        const data = await r.json();
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
        console.warn("clientcontracts non-OK:", r.status, await r.text());
      }
    } catch (e) {
      console.error("clientcontracts error:", e);
    }

    // 2. Client services (credits / packages)
    let clientServices: any[] = [];
    try {
      const r = await fetch(
        `https://api.mindbodyonline.com/public/v6/client/clientservices?ClientId=${clientId}`,
        { method: "GET", headers: mbHeaders }
      );
      if (r.ok) {
        const data = await r.json();
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
        console.warn("clientservices non-OK:", r.status, await r.text());
      }
    } catch (e) {
      console.error("clientservices error:", e);
    }

    // 3. Active client memberships
    let memberships: any[] = [];
    try {
      const r = await fetch(
        `https://api.mindbodyonline.com/public/v6/client/activeclientmemberships?ClientId=${clientId}`,
        { method: "GET", headers: mbHeaders }
      );
      if (r.ok) {
        const data = await r.json();
        const raw = data.ClientMemberships || data.ActiveClientMemberships || [];
        memberships = raw
          .filter((m: any) => !(m.ExpirationDate && new Date(m.ExpirationDate) < now))
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
        console.warn("activeclientmemberships non-OK:", r.status, await r.text());
      }
    } catch (e) {
      console.error("activeclientmemberships error:", e);
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
