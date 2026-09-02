import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveClassPrice } from "../_shared/mindbodyCheckout.ts";
import {
  fetchActiveClientServices,
  pickBookableClientServiceIdForBooking,
} from "../_shared/mindbodyClientServices.ts";
import { resolveSiteClientId } from "../_shared/mindbodyClientResolve.ts";
import { getStaffToken } from "../_shared/mindbodyStaff.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * What will this class cost me, before I commit?
 *
 * Deliberately calls the same resolveClassPrice() that mindbody-book calls to
 * charge, and the same pickBookableClientServiceIdForBooking() it uses to spend
 * an entitlement. The number returned here is the number the customer sees, and
 * mindbody-book refuses to charge anything else.
 */
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
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

    const { sessionId, classId, locationId, serviceName } = await req.json();
    if (!classId) throw new Error("classId is required");

    const classIdNum = parseInt(String(classId), 10);
    if (!Number.isFinite(classIdNum)) throw new Error("classId must be numeric");
    const locId = Number(locationId) > 0 ? Number(locationId) : 1;

    const staffToken = await getStaffToken();

    // Signed-out visitors still get the list price — they just can't have a pass.
    let consumerToken: string | null = null;
    let clientId: string | null = null;

    if (sessionId) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: session } = await supabase
        .from("mb_sessions")
        .select("id, mindbody_client_id, mindbody_site_client_id, access_token, email, first_name, last_name")
        .eq("id", sessionId)
        .single();

      if (session) {
        consumerToken = session.access_token || null;
        clientId = session.mindbody_site_client_id?.trim() ||
          (await resolveSiteClientId(session.mindbody_client_id, apiKey, siteId, staffToken, {
            email: session.email,
            firstName: session.first_name,
            lastName: session.last_name,
          }));
      }
    }

    // An entitlement that covers this class means the charge will be £0, so say
    // so rather than quoting a price we will not take.
    if (clientId) {
      const consumerServices = consumerToken
        ? await fetchActiveClientServices(apiKey, siteId, consumerToken, clientId)
        : [];
      const staffServices = await fetchActiveClientServices(apiKey, siteId, staffToken, clientId);
      const passId =
        pickBookableClientServiceIdForBooking(consumerServices, { bookingType: "class", serviceName }) ??
        pickBookableClientServiceIdForBooking(staffServices, { bookingType: "class", serviceName });

      if (passId != null) {
        const row = [...consumerServices, ...staffServices].find((s) => s.Id === passId);
        return json({
          priceGbp: 0,
          pass: { name: row?.Name ?? "Session pass / credit", remaining: row?.Remaining ?? null },
        });
      }
    }

    const resolved = await resolveClassPrice(
      apiKey,
      siteId,
      staffToken,
      classIdNum,
      locId,
    );

    if (!resolved) {
      console.warn("No bookable pricing option for class", classIdNum);
      return json({ priceGbp: null, pass: null, unavailable: true });
    }

    return json({
      priceGbp: resolved.priceGbp,
      optionName: resolved.optionName,
      serviceId: resolved.serviceId,
      pass: null,
    });
  } catch (error) {
    console.error("Class price error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return json({ error: message, priceGbp: null }, 400);
  }
});
