import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveSiteClientId, type ClientProfile } from "../_shared/mindbodyClientResolve.ts";
import { fetchMindbodyClientProfile, fetchOidcUserInfo } from "../_shared/mindbodyClientProfile.ts";
import { getStaffToken } from "../_shared/mindbodyStaff.ts";
import {
  isMindbodyTokenExpired,
  refreshMindbodySessionIfNeeded,
} from "../_shared/mindbodyRefreshSession.ts";
import { checkoutServiceWithStoredCard, checkoutWithConsumerThenStaff } from "../_shared/mindbodyCheckout.ts";
import { isJuneContrastPassName } from "../_shared/contrastPass.ts";
import { fetchActiveClientServices, findJuneContrastPassRow } from "../_shared/mindbodyClientServices.ts";
import { logContrastPassPurchase } from "../_shared/contrastPassUsageLog.ts";
import {
  claimPassPurchase,
  confirmPassPurchase,
  releasePurchaseClaim,
  resolvePurchaseProductKey,
} from "../_shared/purchaseIdempotency.ts";
import { alertOnHttpFailure, sendOpsAlert } from "../_shared/opsAlertEmail.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PASS_NAME = "Unlimited 2 Week Contrast Pass";
const PASS_PATTERN = /unlimited\s*2\s*week\s*contrast\s*pass/i;
const SALE_START = "2026-06-01";
const SALE_END = "2026-06-30";
const LONDON = "Europe/London";

type MbSession = {
  id: string;
  mindbody_client_id: string;
  mindbody_site_client_id?: string | null;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

function londonYmd(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: LONDON });
}

function isJunePassSaleActive(at = new Date()): boolean {
  const ymd = londonYmd(at);
  return ymd >= SALE_START && ymd <= SALE_END;
}

function parsePackServiceId(productId: string | undefined): number | null {
  if (!productId?.trim()) return null;
  const pack = productId.match(/^pack-(\d+)$/i);
  if (pack) return parseInt(pack[1], 10);
  const n = parseInt(productId, 10);
  return Number.isFinite(n) ? n : null;
}

async function loadSession(
  supabaseAdmin: ReturnType<typeof createClient>,
  sessionId: string,
): Promise<MbSession | Response> {
  let { data: session, error } = await supabaseAdmin
    .from("mb_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (error || !session) {
    return new Response(
      JSON.stringify({ error: "Session not found. Please log in again.", requiresLogin: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 },
    );
  }

  if (isMindbodyTokenExpired(session.token_expires_at)) {
    const refreshed = await refreshMindbodySessionIfNeeded(supabaseAdmin, session);
    if (!refreshed) {
      return new Response(
        JSON.stringify({ error: "Session expired. Please log in again.", requiresLogin: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 },
      );
    }
    session = refreshed;
  }

  return session as MbSession;
}

async function clientProfile(session: MbSession, apiKey: string, siteId: string): Promise<ClientProfile> {
  let email = session.email ?? undefined;
  let firstName = session.first_name ?? undefined;
  let lastName = session.last_name ?? undefined;

  if ((!email || !firstName) && session.access_token) {
    const oidc = await fetchOidcUserInfo(session.access_token);
    if (oidc) {
      email = email ?? oidc.email;
      firstName = firstName ?? oidc.given_name;
      lastName = lastName ?? oidc.family_name;
    }
    const fetched = await fetchMindbodyClientProfile(
      session.mindbody_client_id,
      session.access_token,
      apiKey,
      siteId,
    );
    if (fetched) {
      email = email ?? fetched.email;
      firstName = firstName ?? fetched.firstName;
      lastName = lastName ?? fetched.lastName;
    }
  }

  return { email, firstName, lastName };
}

type SaleRow = { Id?: number; Name?: string; Price?: number; OnlinePrice?: number };

async function findJunePassService(
  apiKey: string,
  siteId: string,
  staffToken: string,
  hintId: number | null,
): Promise<{ id: number; amount: number; name: string } | null> {
  const all: SaleRow[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const res = await fetch(
      `https://api.mindbodyonline.com/public/v6/sale/services?Limit=${limit}&Offset=${offset}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": apiKey,
          SiteId: siteId,
          Authorization: `Bearer ${staffToken}`,
        },
      },
    );
    if (!res.ok) break;
    const data = await res.json();
    const batch = (data.Services || []) as SaleRow[];
    all.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }

  if (hintId != null) {
    const byId = all.find((s) => s.Id === hintId);
    if (byId?.Id != null) {
      const amount = byId.OnlinePrice ?? byId.Price ?? 130;
      return { id: byId.Id, amount, name: byId.Name || PASS_NAME };
    }
  }

  const exact = all.find((s) => (s.Name || "").trim() === PASS_NAME);
  if (exact?.Id != null) {
    return {
      id: exact.Id,
      amount: exact.OnlinePrice ?? exact.Price ?? 130,
      name: exact.Name || PASS_NAME,
    };
  }

  const pattern = all.find((s) => PASS_PATTERN.test(s.Name || ""));
  if (pattern?.Id != null) {
    return {
      id: pattern.Id,
      amount: pattern.OnlinePrice ?? pattern.Price ?? 130,
      name: pattern.Name || PASS_NAME,
    };
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!isJunePassSaleActive()) {
      return new Response(
        JSON.stringify({ error: "This offer is only available throughout June 2026." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const apiKey = Deno.env.get("MINDBODY_API_KEY");
    const siteId = Deno.env.get("MINDBODY_SITE_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const defaultLocationId = parseInt(Deno.env.get("MINDBODY_DEFAULT_LOCATION_ID") || "1", 10);

    if (!apiKey || !siteId || !supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing required configuration");
    }

    const { sessionId, productId } = await req.json();
    if (!sessionId) {
      throw new Error("sessionId is required");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const sessionResult = await loadSession(supabaseAdmin, sessionId);
    if (sessionResult instanceof Response) return sessionResult;
    const session = sessionResult;

    const staffToken = await getStaffToken();
    const profile = await clientProfile(session, apiKey, siteId);

    let clientId = session.mindbody_site_client_id?.trim() || null;
    if (!clientId) {
      clientId = await resolveSiteClientId(
        session.mindbody_client_id,
        apiKey,
        siteId,
        staffToken,
        profile,
      );
      if (clientId) {
        await supabaseAdmin
          .from("mb_sessions")
          .update({ mindbody_site_client_id: clientId, updated_at: new Date().toISOString() })
          .eq("id", session.id);
      }
    }

    if (!clientId) {
      return new Response(
        JSON.stringify({
          error:
            "We could not match your Mindbody sign-in to your Rebase account. Sign out and sign in again.",
          profileNotFound: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const hintId = parsePackServiceId(productId);
    const passService = await findJunePassService(apiKey, siteId, staffToken, hintId);
    if (!passService) {
      return new Response(
        JSON.stringify({
          error: `Could not find "${PASS_NAME}" in Mindbody. Please contact reception@rebaserecovery.com.`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const locId = Number.isFinite(defaultLocationId) ? defaultLocationId : 1;
    const productKey = resolvePurchaseProductKey(passService.id);

    const activeServices = await fetchActiveClientServices(
      apiKey,
      siteId,
      staffToken,
      clientId,
    );
    const existingPass = findJuneContrastPassRow(activeServices);
    if (existingPass) {
      return new Response(
        JSON.stringify({
          success: true,
          idempotent: true,
          productName: passService.name,
          amountGbp: passService.amount,
          validityDays: 14,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const purchaseClaim = await claimPassPurchase(supabaseAdmin, {
      sessionId: session.id,
      mindbodySiteClientId: clientId,
      productKey,
      productName: passService.name,
    });

    if (purchaseClaim.type === "confirmed") {
      return new Response(
        JSON.stringify({
          success: true,
          idempotent: true,
          productName: purchaseClaim.productName,
          amountGbp: purchaseClaim.amountGbp,
          validityDays: 14,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }
    if (purchaseClaim.type === "in_progress") {
      return new Response(
        JSON.stringify({
          error: "Your purchase is already being processed. Please wait — do not tap again.",
          purchaseInProgress: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 },
      );
    }

    const claimedPurchaseId = purchaseClaim.claimId;

    const checkout = await checkoutWithConsumerThenStaff(
      apiKey,
      siteId,
      session.access_token,
      staffToken,
      (token) =>
        checkoutServiceWithStoredCard(apiKey, siteId, token, {
          clientId,
          locationId: locId,
          serviceId: passService.id,
          amount: passService.amount,
        }),
    );

    if (!checkout.ok) {
      await releasePurchaseClaim(supabaseAdmin, claimedPurchaseId);
      const response = new Response(
        JSON.stringify({
          error: checkout.noStoredCard
            ? "No payment card is saved on your Mindbody account. Add a card using the link below, then try again."
            : checkout.message,
          paymentRequired: true,
          noStoredCard: checkout.noStoredCard,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
      await alertOnHttpFailure(response, {
        category: "purchase_failed",
        title: `Pass purchase failed — ${passService.name}`,
        dedupeKey: `purchase:${productKey}:${clientId}`,
        details: {
          productName: passService.name,
          amountGbp: passService.amount,
          guestEmail: profile.email || session.email || null,
          mindbodyClientId: session.mindbody_client_id,
        },
      });
      return response;
    }

    await confirmPassPurchase(supabaseAdmin, claimedPurchaseId, passService.amount);

    const refreshedServices = await fetchActiveClientServices(
      apiKey,
      siteId,
      staffToken,
      clientId,
    );
    const passCredit = refreshedServices.find((s) => isJuneContrastPassName(s.Name));

    await logContrastPassPurchase(supabaseAdmin, {
      sessionId: session.id,
      mindbodyClientId: session.mindbody_client_id,
      mindbodySiteClientId: clientId,
      mindbodySaleServiceId: passService.id,
      mindbodyClientServiceId: passCredit?.Id ?? null,
      amountGbp: passService.amount,
      productName: passService.name,
    });

    return new Response(
      JSON.stringify({
        success: true,
        productName: passService.name,
        amountGbp: passService.amount,
        validityDays: 14,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    console.error("Purchase pass error:", error);
    const message = error instanceof Error ? error.message : String(error);
    sendOpsAlert({
      category: "purchase_error",
      title: "Unhandled pass purchase error",
      summary: message,
      dedupeKey: `purchase:unhandled:${message.slice(0, 120)}`,
    });
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});
