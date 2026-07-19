import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveSiteClientId, type ClientProfile } from "../_shared/mindbodyClientResolve.ts";
import { fetchMindbodyClientProfile, fetchOidcUserInfo } from "../_shared/mindbodyClientProfile.ts";
import { getStaffToken } from "../_shared/mindbodyStaff.ts";

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
      .select(
        "id, mindbody_client_id, mindbody_site_client_id, access_token, email, first_name, last_name",
      )
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({
          contracts: [],
          clientServices: [],
          memberships: [],
          membershipIcon: null,
          requiresLogin: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
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

    // Build the client profile (email drives resolution) so cross-regional
    // members resolve to their numeric site id — otherwise every lookup below
    // 400s on the raw OAuth id and the member wrongly appears to have no pass.
    let email = (session.email as string | null) ?? undefined;
    let firstName = (session.first_name as string | null) ?? undefined;
    let lastName = (session.last_name as string | null) ?? undefined;
    const accessToken = session.access_token as string | null;
    if ((!email || !firstName) && accessToken) {
      const oidc = await fetchOidcUserInfo(accessToken);
      if (oidc) {
        email = email ?? oidc.email;
        firstName = firstName ?? oidc.given_name;
        lastName = lastName ?? oidc.family_name;
      }
      const fetched = await fetchMindbodyClientProfile(publicClientId, accessToken, apiKey, siteId);
      if (fetched) {
        email = email ?? fetched.email;
        firstName = firstName ?? fetched.firstName;
        lastName = lastName ?? fetched.lastName;
      }
    }
    const profile: ClientProfile = { email, firstName, lastName };

    const cachedSiteClientId =
      (session.mindbody_site_client_id as string | null)?.trim() || null;
    const resolvedSiteClientId = cachedSiteClientId ??
      (await resolveSiteClientId(publicClientId, apiKey, siteId, staffToken, profile));
    if (resolvedSiteClientId && resolvedSiteClientId !== cachedSiteClientId) {
      await supabase
        .from("mb_sessions")
        .update({
          mindbody_site_client_id: resolvedSiteClientId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.id);
    }
    let clientId = resolvedSiteClientId ?? publicClientId;
    let membershipIcon: number | null = null;
    try {
      const r = await fetch(
        `https://api.mindbodyonline.com/public/v6/client/clients?ClientIds=${encodeURIComponent(clientId)}&limit=1&CrossRegionalLookup=true`,
        { method: "GET", headers: mbHeaders },
      );
      if (r.ok) {
        const data = await r.json();
        const client = (data.Clients || [])[0];
        if (typeof client?.MembershipIcon === "number") membershipIcon = client.MembershipIcon;
      }
    } catch (e) {
      console.warn("membership icon lookup:", e);
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
