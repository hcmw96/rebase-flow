import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveSiteClientId, type ClientProfile } from "../_shared/mindbodyClientResolve.ts";
import { fetchMindbodyClientProfile, fetchOidcUserInfo } from "../_shared/mindbodyClientProfile.ts";
import { getStaffToken } from "../_shared/mindbodyStaff.ts";
import {
  isMindbodyTokenExpired,
  refreshMindbodySessionIfNeeded,
} from "../_shared/mindbodyRefreshSession.ts";
import {
  checkoutServiceWithStoredCard,
  checkoutWithStaffToken,
  isMultiSessionPack,
  type SaleServiceRow,
} from "../_shared/mindbodyCheckout.ts";
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

type CatalogSaleRow = SaleServiceRow & {
  Id?: number;
  SellOnline?: boolean;
};

async function fetchAllSaleServices(
  apiKey: string,
  siteId: string,
  staffToken: string,
): Promise<CatalogSaleRow[]> {
  const all: CatalogSaleRow[] = [];
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
    const batch = (data.Services || []) as CatalogSaleRow[];
    all.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }
  return all;
}

function saleAmount(row: CatalogSaleRow, fallback = 0): number {
  return row.OnlinePrice ?? row.Price ?? fallback;
}

function isJunePassProduct(name: string): boolean {
  return isJuneContrastPassName(name) || PASS_PATTERN.test(name) || name.trim() === PASS_NAME;
}

/** Resolve a retail pack / June contrast pass from productId (`pack-{id}` or numeric). */
function resolvePurchasablePack(
  all: CatalogSaleRow[],
  hintId: number | null,
): { id: number; amount: number; name: string; isJunePass: boolean } | null {
  if (hintId != null) {
    const byId = all.find((s) => s.Id === hintId);
    if (byId?.Id != null) {
      const name = byId.Name || "";
      const june = isJunePassProduct(name);
      if (!june && !isMultiSessionPack(byId)) return null;
      if (byId.SellOnline === false) return null;
      return {
        id: byId.Id,
        amount: saleAmount(byId, june ? 130 : 0),
        name: name || (june ? PASS_NAME : "Pack"),
        isJunePass: june,
      };
    }
  }

  // Contrast-pass offer page may omit productId — fall back to name match.
  const exact = all.find((s) => (s.Name || "").trim() === PASS_NAME);
  if (exact?.Id != null) {
    return {
      id: exact.Id,
      amount: saleAmount(exact, 130),
      name: exact.Name || PASS_NAME,
      isJunePass: true,
    };
  }
  const pattern = all.find((s) => PASS_PATTERN.test(s.Name || ""));
  if (pattern?.Id != null) {
    return {
      id: pattern.Id,
      amount: saleAmount(pattern, 130),
      name: pattern.Name || PASS_NAME,
      isJunePass: true,
    };
  }
  return null;
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
    const defaultLocationId = parseInt(Deno.env.get("MINDBODY_DEFAULT_LOCATION_ID") || "1", 10);

    if (!apiKey || !siteId || !supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing required configuration");
    }

    const body = await req.json();
    const sessionId = body?.sessionId as string | undefined;
    const productId = body?.productId as string | undefined;
    const expectedPriceGbp =
      typeof body?.expectedPriceGbp === "number" && Number.isFinite(body.expectedPriceGbp)
        ? body.expectedPriceGbp
        : null;

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
    if (hintId == null && !productId) {
      // Contrast-pass offer page may omit productId; name match is allowed below.
    } else if (hintId == null) {
      return new Response(
        JSON.stringify({
          error: "This product cannot be purchased online. Please email reception@rebaserecovery.com.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const catalog = await fetchAllSaleServices(apiKey, siteId, staffToken);
    const passService = resolvePurchasablePack(catalog, hintId);
    if (!passService) {
      return new Response(
        JSON.stringify({
          error: hintId != null
            ? "This pack is not available for online purchase. Please email reception@rebaserecovery.com."
            : `Could not find "${PASS_NAME}" in Mindbody. Please contact reception@rebaserecovery.com.`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    if (passService.isJunePass && !isJunePassSaleActive()) {
      return new Response(
        JSON.stringify({ error: "This offer is only available throughout June 2026." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    // Non-June packs: never charge above the price shown on the site.
    let chargeAmount = passService.amount;
    if (!passService.isJunePass) {
      if (expectedPriceGbp == null || expectedPriceGbp <= 0) {
        return new Response(
          JSON.stringify({
            error: "Price unavailable for this pack. Please email reception@rebaserecovery.com.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
        );
      }
      if (chargeAmount <= 0) {
        return new Response(
          JSON.stringify({
            error: "This pack has no online price. Please email reception@rebaserecovery.com.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
        );
      }
      if (chargeAmount > expectedPriceGbp + 0.009) {
        console.warn(
          `Refusing pack ${passService.id} charge: catalog ${chargeAmount} exceeds displayed ${expectedPriceGbp}`,
        );
        return new Response(
          JSON.stringify({
            error:
              "The pack price changed since you opened this page. Refresh and try again, or email reception@rebaserecovery.com.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 },
        );
      }
      // Charge the lower of catalog vs displayed (promo / rounding).
      chargeAmount = Math.min(chargeAmount, expectedPriceGbp);
    }

    const locId = Number.isFinite(defaultLocationId) ? defaultLocationId : 1;
    const productKey = resolvePurchaseProductKey(passService.id);

    const activeServices = await fetchActiveClientServices(
      apiKey,
      siteId,
      staffToken,
      clientId,
    );
    if (passService.isJunePass) {
      const existingPass = findJuneContrastPassRow(activeServices);
      if (existingPass) {
        return new Response(
          JSON.stringify({
            success: true,
            idempotent: true,
            productName: passService.name,
            amountGbp: chargeAmount,
            validityDays: 14,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
        );
      }
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

    const checkout = await checkoutWithStaffToken(
      staffToken,
      (token) =>
        checkoutServiceWithStoredCard(apiKey, siteId, token, {
          clientId,
          locationId: locId,
          serviceId: passService.id,
          amount: chargeAmount,
        }),
    );

    if (!checkout.ok) {
      // storedCardUnavailable is a pre-charge lookup miss (no payment attempted),
      // so it is safe to release the claim and let the guest retry.
      const definitiveFailure = Boolean(
        checkout.noStoredCard ||
          checkout.storedCardUnavailable ||
          checkout.cardDeclined ||
          checkout.siteScopeIssue,
      );
      if (definitiveFailure) {
        await releasePurchaseClaim(supabaseAdmin, claimedPurchaseId);
      }
      const response = new Response(
        JSON.stringify({
          error: checkout.storedCardUnavailable
            ? "We couldn't reach your saved card just now — no payment was taken. If you have a card on your Mindbody account, wait a moment and tap again. If you haven't added one yet, use the card link below first. Still stuck? Email reception@rebaserecovery.com."
            : checkout.noStoredCard
            ? "No payment card is saved on your Mindbody account. Add a card using the link below, then try again."
            : definitiveFailure
            ? checkout.message
            : "Mindbody couldn't confirm this purchase after processing it. Please do not retry — email reception@rebaserecovery.com so we can check it before any further payment.",
          paymentRequired: true,
          noStoredCard: checkout.noStoredCard,
          storedCardUnavailable: checkout.storedCardUnavailable,
          purchaseOutcomeUncertain: !definitiveFailure,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: definitiveFailure ? 400 : 409,
        },
      );
      await alertOnHttpFailure(response, {
        category: "purchase_failed",
        title: `Pack purchase failed — ${passService.name}`,
        dedupeKey: `purchase:${productKey}:${clientId}`,
        details: {
          productName: passService.name,
          amountGbp: chargeAmount,
          guestEmail: profile.email || session.email || null,
          mindbodyClientId: session.mindbody_client_id,
        },
      });
      return response;
    }

    await confirmPassPurchase(supabaseAdmin, claimedPurchaseId, chargeAmount);

    if (passService.isJunePass) {
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
        amountGbp: chargeAmount,
        productName: passService.name,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        productName: passService.name,
        amountGbp: chargeAmount,
        validityDays: passService.isJunePass ? 14 : null,
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
