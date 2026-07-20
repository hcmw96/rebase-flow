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
  ensureMindbodyClientEmail,
  sendBookingConfirmationEmails,
} from "../_shared/bookingConfirmationEmail.ts";
import {
  fetchActiveClientServices,
  findJuneContrastPassRow,
  pickBookableClientServiceId,
  pickBookableClientServiceIdForBooking,
} from "../_shared/mindbodyClientServices.ts";
import { isJuneContrastPassName } from "../_shared/contrastPass.ts";
import { logJunePassClassBooking } from "../_shared/contrastPassUsageLog.ts";
import {
  bookingInProgressResponse,
  claimBookingIdempotency,
  confirmedBookingResponse,
  findConfirmedSlotBooking,
  findConfirmedSlotBookingByMindbodyClient,
  persistBookingCheckout,
  releaseBookingClaim,
  resolveServerIdempotencyKey,
} from "../_shared/bookingIdempotency.ts";
import {
  checkoutAppointmentWithStoredCard,
  checkoutClassWithStoredCard,
  checkoutWithConsumerThenStaff,
  fetchSaleServicesForClass,
  fetchSaleServicesForSessionType,
  isMultiSessionPack,
  pickSaleServiceForClass,
  pickSaleServiceForSession,
  type CheckoutResult,
} from "../_shared/mindbodyCheckout.ts";
import {
  clientAlreadyBookedAppointment,
  clientAlreadyBookedClass,
} from "../_shared/mindbodyBookingGuard.ts";
import { alertOnHttpFailure, sendOpsAlert } from "../_shared/opsAlertEmail.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

async function loadBookableSession(
  supabaseAdmin: ReturnType<typeof createClient>,
  sessionId: string,
): Promise<MbSession | Response> {
  let { data: session, error: sessionError } = await supabaseAdmin
    .from("mb_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return new Response(
      JSON.stringify({
        error: "Session not found. Please log in again.",
        requiresLogin: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 },
    );
  }

  if (isMindbodyTokenExpired(session.token_expires_at)) {
    const refreshed = await refreshMindbodySessionIfNeeded(supabaseAdmin, session);
    if (!refreshed) {
      return new Response(
        JSON.stringify({
          error: "Session expired. Please log in again.",
          requiresLogin: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 },
      );
    }
    session = refreshed;
  }

  return session as MbSession;
}

async function sessionClientProfile(
  session: MbSession,
  apiKey: string,
  siteId: string,
): Promise<ClientProfile> {
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

async function resolveBookingClientId(
  publicClientId: string,
  apiKey: string,
  siteId: string,
  staffToken: string,
  profile: ClientProfile,
): Promise<string | null> {
  const clientId = await resolveSiteClientId(publicClientId, apiKey, siteId, staffToken, profile);
  console.log("Booking ClientId:", publicClientId, "->", clientId ?? "(unresolved)");
  return clientId;
}

async function returnBookingFailure(
  response: Response,
  context: {
    session: MbSession;
    profile?: ClientProfile;
    bookingType: string;
    serviceName?: string;
    startDateTime?: string;
  },
): Promise<Response> {
  await alertOnHttpFailure(response, {
    category: "booking_failed",
    title: `Booking failed — ${context.serviceName || "unknown service"}`,
    dedupeKey:
      `booking:${context.bookingType}:${context.serviceName || ""}:${context.startDateTime || ""}`,
    details: {
      bookingType: context.bookingType,
      serviceName: context.serviceName || null,
      startTime: context.startDateTime || null,
      guestEmail: context.profile?.email || context.session.email || null,
      mindbodyClientId: context.session.mindbody_client_id,
    },
  });
  return response;
}

function extractMindbodyErrorMessage(rawText: string): string {
  try {
    const errorData = JSON.parse(rawText) as { Error?: { Message?: string } };
    return errorData.Error?.Message || rawText;
  } catch {
    return rawText;
  }
}

async function postToMindbody(
  url: string,
  apiKey: string,
  siteId: string,
  bearerToken: string,
  body: Record<string, unknown>,
): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": apiKey,
      "SiteId": siteId,
      Authorization: `Bearer ${bearerToken}`,
    },
    body: JSON.stringify(body),
  });
}

/** When pass booking fails, try stored-card checkout unless the failure is non-recoverable. */
async function shouldFallThroughToCheckout(failure: {
  ok: false;
  response: Response;
}): Promise<boolean> {
  const status = failure.response.status;
  if (status === 503 || status === 401 || status === 409) return false;

  try {
    const body = await failure.response.clone().json();
    if (body.profileNotFound || body.requiresLogin) return false;
    if (body.bookingOutcomeUncertain) return false;
    return true;
  } catch {
    return status >= 400 && status < 500;
  }
}

/**
 * Only release the retry lock when Mindbody definitively did not charge.
 * Generic checkout and booking-conflict errors are ambiguous: Mindbody can
 * create a sale or appointment before returning the error.
 */
async function shouldReleaseClaimAfterFailure(response: Response): Promise<boolean> {
  try {
    const body = await response.clone().json();
    if (body.bookingOutcomeUncertain) return false;
    if (!body.checkoutAttempted) return true;
    return Boolean(
      body.noStoredCard ||
        body.storedCardUnavailable ||
        body.paymentAmountMismatch ||
        body.cardDeclined ||
        body.siteScopeIssue,
    );
  } catch {
    return false;
  }
}

function checkoutFailureResponse(
  checkout: Extract<CheckoutResult, { ok: false }>,
): { ok: false; response: Response } {
  console.error("Stored-card checkout failed:", checkout.message);

  if (checkout.storedCardUnavailable) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error:
            "We couldn't charge a saved card — no payment was taken. Use Pay in Mindbody on the confirm screen to enter a new card or Apple Pay, or email reception@rebaserecovery.com.",
          checkoutAttempted: true,
          paymentRequired: true,
          storedCardUnavailable: true,
          noPassOnFile: true,
          useMindbodyCheckout: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      ),
    };
  }

  if (checkout.paymentAmountMismatch) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error:
            "The price on your account didn't match Mindbody's total (often a member discount) — no payment was taken. Tap Confirm again, or email reception@rebaserecovery.com.",
          checkoutAttempted: true,
          paymentRequired: true,
          paymentAmountMismatch: true,
          noPassOnFile: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      ),
    };
  }

  if (checkout.noStoredCard) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error:
            "No payment card is saved on your Mindbody account — no payment was taken. Use Pay in Mindbody to enter a new card or Apple Pay.",
          checkoutAttempted: true,
          paymentRequired: true,
          noStoredCard: true,
          noPassOnFile: true,
          useMindbodyCheckout: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      ),
    };
  }

  if (checkout.siteScopeIssue) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error:
            "We couldn't complete this booking in Mindbody. Add a payment card to your Mindbody account if you don't have one on file, then tap Confirm again — or email reception@rebaserecovery.com and we'll book you in.",
          checkoutAttempted: true,
          paymentRequired: true,
          siteScopeIssue: true,
          noPassOnFile: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      ),
    };
  }

  if (checkout.cardDeclined) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error:
            "Your card on file couldn't be charged. Update your card in your Mindbody account, then tap Confirm again — or email reception@rebaserecovery.com.",
          checkoutAttempted: true,
          paymentRequired: true,
          cardDeclined: true,
          noPassOnFile: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      ),
    };
  }

  if (checkout.bookingConflict) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error:
            "Mindbody couldn't confirm this booking after processing the request. Please do not retry — email reception@rebaserecovery.com so we can check it before any further payment.",
          checkoutAttempted: true,
          bookingOutcomeUncertain: true,
          noPassOnFile: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 },
      ),
    };
  }

  return {
    ok: false,
    response: new Response(
      JSON.stringify({
        error:
          "Mindbody couldn't confirm this booking after processing the request. Please do not retry — email reception@rebaserecovery.com so we can check it before any further payment.",
        checkoutAttempted: true,
        bookingOutcomeUncertain: true,
        paymentRequired: true,
        noPassOnFile: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    ),
  };
}

async function mindbodyPostWithRetry(
  supabaseAdmin: ReturnType<typeof createClient>,
  session: MbSession,
  apiKey: string,
  siteId: string,
  url: string,
  body: Record<string, unknown>,
): Promise<{ ok: true; data: unknown; clientId: string } | { ok: false; response: Response }> {
  const publicClientId = session.mindbody_client_id;

  // OAuth proves *who* the client is; staff token completes the booking at this site.
  // Consumer tokens often fail with "site id does not match" when the user visits multiple
  // studios (Rebase is linked under Places You Go, but the API token scope differs).
  let staffToken: string;
  try {
    staffToken = await getStaffToken();
  } catch (staffErr) {
    console.error("Staff token unavailable:", staffErr);
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "Booking is temporarily unavailable. Please contact reception." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 503 },
      ),
    };
  }

  let clientId = session.mindbody_site_client_id?.trim() || null;
  const profile = await sessionClientProfile(session, apiKey, siteId);

  if (!clientId) {
    clientId = await resolveBookingClientId(publicClientId, apiKey, siteId, staffToken, profile);
    if (clientId) {
      await supabaseAdmin
        .from("mb_sessions")
        .update({ mindbody_site_client_id: clientId, updated_at: new Date().toISOString() })
        .eq("id", session.id);
    }
  }

  if (!clientId) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error:
            "We could not match your Mindbody sign-in to your Rebase client record. Sign out, sign in again, or email reception@rebaserecovery.com — we will complete the booking for you.",
          profileNotFound: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      ),
    };
  }

  ensureMindbodyClientEmail(apiKey, siteId, staffToken, clientId, profile.email).catch((e) =>
    console.warn("ensureMindbodyClientEmail:", e)
  );

  let activeSession = session;
  if (isMindbodyTokenExpired(activeSession.token_expires_at) && activeSession.refresh_token) {
    const refreshed = await refreshMindbodySessionIfNeeded(supabaseAdmin, activeSession, { force: true });
    if (refreshed) activeSession = refreshed;
  }

  if (!activeSession.access_token) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error: "Session expired. Please sign in again.",
          requiresLogin: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 },
      ),
    };
  }

  type BookAttemptResult = {
    ok: boolean;
    status: number;
    message: string;
    data: unknown;
  };

  const siteIdNum = parseInt(siteId, 10);
  const crossRegionalExtras: Record<string, unknown> = Number.isFinite(siteIdNum)
    ? { CrossRegionalBookingClientServiceSiteID: siteIdNum }
    : {};

  const attemptBook = async (
    bearerToken: string,
    label: string,
    bookingClientId: string,
    extra: Record<string, unknown> = {},
  ): Promise<BookAttemptResult> => {
    const payload = { ...body, ...crossRegionalExtras, ...extra, ClientId: bookingClientId };
    const response = await postToMindbody(url, apiKey, siteId, bearerToken, payload);
    const rawText = await response.text();
    const message = extractMindbodyErrorMessage(rawText);
    let data: unknown = null;
    if (response.ok) {
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }
    }
    console.log(`Mindbody booking (${label}):`, response.status, response.ok ? "ok" : message);
    return { ok: response.ok, status: response.status, message, data };
  };

  // Keep this narrow — "time is not available" must NOT match as a payment error.
  const isPaymentError = (message: string) =>
    /pricing option|payment required|package|sessions remaining|insufficient credit|does not have a valid|unable to apply|not paid|no payment|no sessions remaining/i
      .test(message.toLowerCase());

  const isClientIdRetryable = (message: string) =>
    /site id does not match|custom id|does not exist|invalid client|cross.?regional/i.test(
      message.toLowerCase(),
    );
  const isBookingConflict = (message: string) =>
    /time is not available|already scheduled|scheduling restriction|maximum number of sessions/i
      .test(message.toLowerCase());

  const consumerClientIds = [...new Set([clientId, publicClientId].filter(Boolean))];

  let bookResult: BookAttemptResult | null = null;

  // 1) Consumer OAuth — tries site numeric id and OAuth unique id (fixes many "site id" errors).
  for (const cid of consumerClientIds) {
    bookResult = await attemptBook(activeSession.access_token, `consumer:${cid}`, cid);
    if (bookResult.ok) break;
    if (isPaymentError(bookResult.message)) break;
    if (!isClientIdRetryable(bookResult.message)) break;
  }

  // Re-resolve numeric client id if Mindbody rejected it.
  if (
    bookResult &&
    !bookResult.ok &&
    /custom id|does not exist|invalid client/i.test(bookResult.message.toLowerCase())
  ) {
    const resolved = await resolveBookingClientId(publicClientId, apiKey, siteId, staffToken, profile);
    if (resolved && !consumerClientIds.includes(resolved)) {
      clientId = resolved;
      await supabaseAdmin
        .from("mb_sessions")
        .update({ mindbody_site_client_id: clientId, updated_at: new Date().toISOString() })
        .eq("id", session.id);
      bookResult = await attemptBook(activeSession.access_token, `consumer:resolved:${clientId}`, clientId);
    }
  }

  // 2) Consumer + explicit pass/credit (ClientServiceId) when the account has one.
  // Prefer the ClientServiceId already chosen by the caller (service-matched).
  if (bookResult && !bookResult.ok && !isPaymentError(bookResult.message)) {
    const requestedServiceId = Number(body.ClientServiceId);
    for (const cid of [clientId, publicClientId]) {
      const services = await fetchActiveClientServices(
        apiKey,
        siteId,
        activeSession.access_token,
        cid,
      );
      const clientServiceId = Number.isFinite(requestedServiceId) && requestedServiceId > 0
        ? requestedServiceId
        : pickBookableClientServiceId(services);
      if (!clientServiceId) continue;

      bookResult = await attemptBook(
        activeSession.access_token,
        `consumer:pass:${clientServiceId}`,
        cid,
        { ClientServiceId: clientServiceId },
      );
      if (bookResult.ok || isPaymentError(bookResult.message)) break;
    }
  }

  // 3) Staff fallback when the consumer OAuth token is scoped to another site (Places You Go).
  // Only apply a pass when the caller already selected one — never invent a class/membership
  // credit for a paid appointment (massage, etc.).
  if (bookResult && !bookResult.ok && isClientIdRetryable(bookResult.message)) {
    const requestedServiceId = Number(body.ClientServiceId);
    const clientServiceId = Number.isFinite(requestedServiceId) && requestedServiceId > 0
      ? requestedServiceId
      : null;

    if (clientServiceId) {
      console.warn(
        "Consumer booking blocked by site scope; applying pass via staff with ClientServiceId:",
        clientServiceId,
      );
      bookResult = await attemptBook(staffToken, `staff:pass:${clientServiceId}`, clientId, {
        ClientServiceId: clientServiceId,
        RequirePayment: body.RequirePayment ?? true,
        ApplyPayment: body.ApplyPayment ?? true,
      });
    }
  }

  if (!bookResult?.ok) {
    const { message, status } = bookResult ?? { message: "Booking failed", status: 400 };
    const paymentIssue = isPaymentError(message);
    const siteScopeIssue = /site id does not match/i.test(message.toLowerCase());
    const bookingConflict = isBookingConflict(message);

    const staffServices = await fetchActiveClientServices(apiKey, siteId, staffToken, clientId);
    const hasPass = pickBookableClientServiceId(staffServices) != null;

    const requiresLogin =
      status === 401 &&
      !siteScopeIssue &&
      !paymentIssue;

    if (requiresLogin) {
      return {
        ok: false,
        response: new Response(
          JSON.stringify({ error: message, requiresLogin: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 },
        ),
      };
    }

    let userMessage = message;
    if (siteScopeIssue) {
      userMessage =
        "We couldn't complete this booking in Mindbody. Add a payment card to your Mindbody account if you don't have one on file, then tap Confirm again — or email reception@rebaserecovery.com and we'll book you in.";
    } else if (bookingConflict) {
      userMessage =
        "Mindbody couldn't confirm this booking after processing the request. Please do not retry — email reception@rebaserecovery.com so we can check it before any further payment.";
    } else if (paymentIssue || !hasPass) {
      userMessage =
        "We couldn't charge your card on file or apply a session pass. Add a card in your Mindbody account if needed, then tap Confirm again.";
    }

    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error: userMessage,
          paymentRequired: paymentIssue || !hasPass,
          siteScopeIssue,
          bookingOutcomeUncertain: bookingConflict,
          noPassOnFile: !hasPass,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: bookingConflict ? 409 : 400 },
      ),
    };
  }

  return { ok: true, data: bookResult.data, clientId };
}

/** Book a class: use pass credit, or charge stored card + book via checkout when none on file. */
async function bookClassWithPayment(
  supabaseAdmin: ReturnType<typeof createClient>,
  session: MbSession,
  apiKey: string,
  siteId: string,
  classId: string,
  startDateTime: string,
  locationId: number | undefined,
  serviceName?: string,
): Promise<
  | {
    ok: true;
    data: unknown;
    clientId: string;
    payment?: { method: "pass" | "stored_card"; amountGbp?: number; listPriceGbp?: number };
    clientServiceId?: number;
  }
  | { ok: false; response: Response }
> {
  const classBody = {
    ClassId: parseInt(classId, 10),
    RequirePayment: true,
    Waitlist: false,
    SendEmail: true,
    CrossRegionalBooking: true,
    CrossRegionalBookingClientServiceSiteID: parseInt(siteId, 10) || undefined,
  };

  let staffToken: string;
  try {
    staffToken = await getStaffToken();
  } catch {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "Booking is temporarily unavailable. Please contact reception." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 503 },
      ),
    };
  }

  const publicClientId = session.mindbody_client_id;
  let clientId = session.mindbody_site_client_id?.trim() || null;
  const profile = await sessionClientProfile(session, apiKey, siteId);
  if (!clientId) {
    clientId = await resolveBookingClientId(publicClientId, apiKey, siteId, staffToken, profile);
    if (clientId) {
      await supabaseAdmin
        .from("mb_sessions")
        .update({ mindbody_site_client_id: clientId, updated_at: new Date().toISOString() })
        .eq("id", session.id);
    }
  }
  if (!clientId) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error:
            "We could not match your Mindbody sign-in to your Rebase client record. Sign out, sign in again, or email reception@rebaserecovery.com.",
          profileNotFound: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      ),
    };
  }

  let activeSession = session;
  if (isMindbodyTokenExpired(activeSession.token_expires_at) && activeSession.refresh_token) {
    const refreshed = await refreshMindbodySessionIfNeeded(supabaseAdmin, activeSession, { force: true });
    if (refreshed) activeSession = refreshed;
  }

  const consumerServices = await fetchActiveClientServices(
    apiKey,
    siteId,
    activeSession.access_token,
    clientId,
  );
  const staffServices = await fetchActiveClientServices(apiKey, siteId, staffToken, clientId);
  const passOnFile =
    pickBookableClientServiceIdForBooking(consumerServices, {
      bookingType: "class",
      serviceName,
    }) ??
    pickBookableClientServiceIdForBooking(staffServices, {
      bookingType: "class",
      serviceName,
    });

  if (passOnFile) {
    const booked = await mindbodyPostWithRetry(
      supabaseAdmin,
      activeSession,
      apiKey,
      siteId,
      "https://api.mindbodyonline.com/public/v6/class/addclienttoclass",
      { ...classBody, ClientServiceId: passOnFile },
    );
    if (booked.ok) {
      return {
        ...booked,
        payment: { method: "pass" as const },
        clientServiceId: passOnFile,
      };
    }
    if (
      await clientAlreadyBookedClass(
        apiKey,
        siteId,
        staffToken,
        clientId,
        classId,
        startDateTime,
      )
    ) {
      console.warn(`Class ${classId} exists after pass booking error; treating as booked`);
      return {
        ok: true,
        data: { Class: { Id: parseInt(classId, 10), StartDateTime: startDateTime } },
        clientId,
        payment: { method: "pass" as const },
        clientServiceId: passOnFile,
      };
    }
    if (!(await shouldFallThroughToCheckout(booked))) {
      return booked;
    }
    console.warn(`Class pass ${passOnFile} failed; trying stored-card checkout for class ${classId}`);
  }

  const classIdNum = parseInt(classId, 10);
  const locId = locationId && locationId > 0 ? locationId : 1;

  if (
    await clientAlreadyBookedClass(
      apiKey,
      siteId,
      staffToken,
      clientId,
      classId,
      startDateTime,
    )
  ) {
    console.log(`Class ${classId} already booked in Mindbody for client ${clientId}`);
    return {
      ok: true,
      data: { Class: { Id: classIdNum, StartDateTime: startDateTime } },
      clientId,
      payment: { method: "stored_card" as const },
    };
  }

  let saleService = pickSaleServiceForClass(
    await fetchSaleServicesForClass(apiKey, siteId, activeSession.access_token, classIdNum, locId),
  );
  if (!saleService?.Id) {
    saleService = pickSaleServiceForClass(
      await fetchSaleServicesForClass(apiKey, siteId, staffToken, classIdNum, locId),
    );
  }
  if (!saleService?.Id) {
    console.warn(`No sale service for class ${classId}`);
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error:
            "We couldn't charge your card on file or apply a session pass. Add a card in your Mindbody account if needed, then tap Confirm again.",
          paymentRequired: true,
          noPassOnFile: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      ),
    };
  }

  const amount = saleService.OnlinePrice ?? saleService.Price ?? 0;
  if (amount <= 0) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "This class is not available for online booking right now." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      ),
    };
  }

  if (isMultiSessionPack(saleService.Name || "", saleService.Count)) {
    console.error(`Refusing pack/pass checkout for class ${classId}:`, saleService.Name, amount);
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error:
            "We couldn't charge your card on file or apply a session pass. Add a card in your Mindbody account if needed, then tap Confirm again.",
          paymentRequired: true,
          noPassOnFile: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      ),
    };
  }

  const checkout = await checkoutWithConsumerThenStaff(
    apiKey,
    siteId,
    activeSession.access_token,
    staffToken,
    (token) =>
      checkoutClassWithStoredCard(apiKey, siteId, token, {
        clientId,
        classId: classIdNum,
        locationId: locId,
        serviceId: saleService!.Id!,
        amount,
      }),
  );

  if (checkout.ok) {
    console.log(`Class ${classId} booked via checkout`);
    return {
      ok: true,
      data: checkout.data,
      clientId,
      payment: {
        method: "stored_card",
        amountGbp: checkout.amountCharged,
        listPriceGbp: amount !== checkout.amountCharged ? amount : undefined,
      },
    };
  }

  if (
    await clientAlreadyBookedClass(
      apiKey,
      siteId,
      staffToken,
      clientId,
      classId,
      startDateTime,
    )
  ) {
    console.warn(`Class ${classId} exists despite checkout error; treating as booked`);
    return {
      ok: true,
      data: { Class: { Id: classIdNum, StartDateTime: startDateTime } },
      clientId,
      payment: { method: "stored_card" as const, amountGbp: amount },
    };
  }

  return checkoutFailureResponse(checkout);
}

/** Book an appointment: use pass credit, or charge stored card + book via checkout when none on file. */
async function bookAppointmentWithPayment(
  supabaseAdmin: ReturnType<typeof createClient>,
  session: MbSession,
  apiKey: string,
  siteId: string,
  sessionTypeId: string,
  staffId: string,
  locationId: number,
  startDateTime: string,
  endDateTime?: string,
  serviceName?: string,
): Promise<
  | {
    ok: true;
    data: unknown;
    clientId: string;
    payment?: { method: "pass" | "stored_card"; amountGbp?: number; listPriceGbp?: number };
    clientServiceId?: number;
  }
  | { ok: false; response: Response }
> {
  const appointmentBody = {
    LocationId: locationId || 1,
    StaffId: parseInt(staffId, 10),
    SessionTypeId: parseInt(sessionTypeId, 10),
    StartDateTime: startDateTime,
    ApplyPayment: true,
    SendConfirmationEmail: true,
  };

  let staffToken: string;
  try {
    staffToken = await getStaffToken();
  } catch {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "Booking is temporarily unavailable. Please contact reception." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 503 },
      ),
    };
  }

  const publicClientId = session.mindbody_client_id;
  let clientId = session.mindbody_site_client_id?.trim() || null;
  const profile = await sessionClientProfile(session, apiKey, siteId);
  if (!clientId) {
    clientId = await resolveBookingClientId(publicClientId, apiKey, siteId, staffToken, profile);
    if (clientId) {
      await supabaseAdmin
        .from("mb_sessions")
        .update({ mindbody_site_client_id: clientId, updated_at: new Date().toISOString() })
        .eq("id", session.id);
    }
  }
  if (!clientId) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error:
            "We could not match your Mindbody sign-in to your Rebase client record. Sign out, sign in again, or email reception@rebaserecovery.com.",
          profileNotFound: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      ),
    };
  }

  let activeSession = session;
  if (isMindbodyTokenExpired(activeSession.token_expires_at) && activeSession.refresh_token) {
    const refreshed = await refreshMindbodySessionIfNeeded(supabaseAdmin, activeSession, { force: true });
    if (refreshed) activeSession = refreshed;
  }

  const consumerServices = await fetchActiveClientServices(
    apiKey,
    siteId,
    activeSession.access_token,
    clientId,
  );
  const staffServices = await fetchActiveClientServices(apiKey, siteId, staffToken, clientId);
  const passOnFile =
    pickBookableClientServiceIdForBooking(consumerServices, {
      bookingType: "appointment",
      serviceName,
    }) ??
    pickBookableClientServiceIdForBooking(staffServices, {
      bookingType: "appointment",
      serviceName,
    });

  if (passOnFile) {
    const booked = await mindbodyPostWithRetry(
      supabaseAdmin,
      activeSession,
      apiKey,
      siteId,
      "https://api.mindbodyonline.com/public/v6/appointment/addappointment",
      { ...appointmentBody, ClientServiceId: passOnFile },
    );
    if (booked.ok) {
      return {
        ...booked,
        payment: { method: "pass" as const },
        clientServiceId: passOnFile,
      };
    }
    if (
      await clientAlreadyBookedAppointment(
        apiKey,
        siteId,
        staffToken,
        clientId,
        sessionTypeId,
        staffId,
        startDateTime,
      )
    ) {
      console.warn(
        `Appointment ${sessionTypeId} exists after pass booking error; treating as booked`,
      );
      return {
        ok: true,
        data: { Appointment: { StartDateTime: startDateTime } },
        clientId,
        payment: { method: "pass" as const },
        clientServiceId: passOnFile,
      };
    }
    if (!(await shouldFallThroughToCheckout(booked))) {
      return booked;
    }
    console.warn(
      `Appointment pass ${passOnFile} failed; trying stored-card checkout for session ${sessionTypeId}`,
    );
  }

  const sessionTypeIdNum = parseInt(sessionTypeId, 10);
  const staffIdNum = parseInt(staffId, 10);
  const locId = locationId > 0 ? locationId : 1;

  if (
    await clientAlreadyBookedAppointment(
      apiKey,
      siteId,
      staffToken,
      clientId,
      sessionTypeId,
      staffId,
      startDateTime,
    )
  ) {
    console.log(
      `Appointment ${sessionTypeId} at ${startDateTime} already booked in Mindbody for client ${clientId}`,
    );
    return {
      ok: true,
      data: { Appointment: { StartDateTime: startDateTime } },
      clientId,
      payment: { method: "stored_card" as const },
    };
  }

  let saleService = pickSaleServiceForSession(
    await fetchSaleServicesForSessionType(
      apiKey,
      siteId,
      activeSession.access_token,
      sessionTypeIdNum,
      locId,
    ),
  );
  if (!saleService?.Id) {
    saleService = pickSaleServiceForSession(
      await fetchSaleServicesForSessionType(apiKey, siteId, staffToken, sessionTypeIdNum, locId),
    );
  }
  if (!saleService?.Id) {
    console.warn(`No sale service for session type ${sessionTypeId}`);
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error:
            "We couldn't charge your card on file or apply a session pass. Add a card in your Mindbody account if needed, then tap Confirm again.",
          paymentRequired: true,
          noPassOnFile: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      ),
    };
  }

  const amount = saleService.OnlinePrice ?? saleService.Price ?? 0;
  if (amount <= 0) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "This session is not available for online booking right now." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      ),
    };
  }

  if (isMultiSessionPack(saleService.Name || "", saleService.Count)) {
    console.error(
      `Refusing pack/pass checkout for session type ${sessionTypeId}:`,
      saleService.Name,
      amount,
    );
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error:
            "We couldn't charge your card on file or apply a session pass. Add a card in your Mindbody account if needed, then tap Confirm again.",
          paymentRequired: true,
          noPassOnFile: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      ),
    };
  }

  const checkout = await checkoutWithConsumerThenStaff(
    apiKey,
    siteId,
    activeSession.access_token,
    staffToken,
    (token) =>
      checkoutAppointmentWithStoredCard(apiKey, siteId, token, {
        clientId,
        locationId: locId,
        serviceId: saleService!.Id!,
        amount,
        staffId: staffIdNum,
        sessionTypeId: sessionTypeIdNum,
        startDateTime,
        endDateTime,
      }),
  );

  if (checkout.ok) {
    console.log(`Appointment ${sessionTypeId} booked via checkout`);
    return {
      ok: true,
      data: checkout.data,
      clientId,
      payment: {
        method: "stored_card",
        amountGbp: checkout.amountCharged,
        listPriceGbp: amount !== checkout.amountCharged ? amount : undefined,
      },
    };
  }

  if (
    await clientAlreadyBookedAppointment(
      apiKey,
      siteId,
      staffToken,
      clientId,
      sessionTypeId,
      staffId,
      startDateTime,
    )
  ) {
    console.warn(
      `Appointment ${sessionTypeId} exists despite checkout error; treating as booked`,
    );
    return {
      ok: true,
      data: { Appointment: { StartDateTime: startDateTime } },
      clientId,
      payment: { method: "stored_card" as const, amountGbp: amount },
    };
  }

  return checkoutFailureResponse(checkout);
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

    const {
      sessionId,
      bookingType, // 'class' or 'appointment'
      classId,
      sessionTypeId,
      staffId,
      staffName,
      locationId,
      locationName,
      startDateTime,
      endDateTime,
      serviceName,
    } = await req.json();

    if (!sessionId) {
      throw new Error("User session is required. Please log in first.");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const effectiveIdempotencyKey = resolveServerIdempotencyKey({
      sessionId,
      bookingType: bookingType || "appointment",
      classId,
      sessionTypeId,
      staffId,
      startDateTime,
    });

    if (!startDateTime) {
      throw new Error("startDateTime is required");
    }

    const slotStartDateTime = startDateTime;
    const resolvedBookingType = bookingType === "class" ? "class" : "appointment";
    const resolvedServiceId = sessionTypeId || classId || null;

    const sessionResult = await loadBookableSession(supabaseAdmin, sessionId);
    if (sessionResult instanceof Response) return sessionResult;
    const session = sessionResult;
    const guestProfile = await sessionClientProfile(session, apiKey, siteId);

    const existingConfirmed = await findConfirmedSlotBooking(supabaseAdmin, {
      sessionId,
      bookingType: resolvedBookingType,
      serviceId: resolvedServiceId,
      startDateTime: slotStartDateTime,
    });
    if (existingConfirmed) {
      return confirmedBookingResponse(existingConfirmed);
    }

    const siteClientId = session.mindbody_site_client_id?.trim();
    if (siteClientId) {
      const existingByClient = await findConfirmedSlotBookingByMindbodyClient(supabaseAdmin, {
        mindbodySiteClientId: siteClientId,
        bookingType: resolvedBookingType,
        serviceId: resolvedServiceId,
        startDateTime: slotStartDateTime,
      });
      if (existingByClient) {
        return confirmedBookingResponse(existingByClient);
      }
    }

    const claim = await claimBookingIdempotency(supabaseAdmin, {
      idempotencyKey: effectiveIdempotencyKey,
      sessionId,
      bookingType: resolvedBookingType,
      serviceName: serviceName || "Booking",
      startDateTime: slotStartDateTime,
      endDateTime: endDateTime ?? null,
      serviceId: resolvedServiceId,
      staffName: staffName ?? null,
      locationName: locationName ?? null,
    });

    if (claim.type === "confirmed") {
      return confirmedBookingResponse(claim.booking);
    }

    let claimedBookingId: string | undefined;

    if (claim.type === "in_progress") {
      try {
        const staffToken = await getStaffToken();
        let alreadyInMindbody = false;
        if (resolvedBookingType === "class" && classId) {
          alreadyInMindbody = await clientAlreadyBookedClass(
            apiKey,
            siteId,
            staffToken,
            siteClientId || session.mindbody_client_id,
            classId,
            slotStartDateTime,
          );
        } else if (sessionTypeId && staffId) {
          alreadyInMindbody = await clientAlreadyBookedAppointment(
            apiKey,
            siteId,
            staffToken,
            siteClientId || session.mindbody_client_id,
            sessionTypeId,
            staffId,
            slotStartDateTime,
          );
        }

        if (alreadyInMindbody) {
          const { data: pending } = await supabaseAdmin
            .from("bookings")
            .select("id")
            .eq("idempotency_key", effectiveIdempotencyKey)
            .eq("status", "pending")
            .maybeSingle();

          if (pending?.id) {
            const reconciled = await persistBookingCheckout(supabaseAdmin, {
              sessionId,
              bookingId: String(pending.id),
              idempotencyKey: effectiveIdempotencyKey,
              bookingType: resolvedBookingType,
              mindbodyAppointmentId: resolvedBookingType === "appointment" ? undefined : null,
              mindbodyClassId: resolvedBookingType === "class" ? classId : null,
              serviceName: serviceName || "Booking",
              serviceId: resolvedServiceId,
              staffName: staffName ?? null,
              locationName: locationName ?? null,
              startDateTime: slotStartDateTime,
              endDateTime: endDateTime ?? null,
              paymentMethod: "stored_card",
            });
            if (reconciled) {
              return confirmedBookingResponse(reconciled);
            }
          }

          const recovered =
            (await findConfirmedSlotBooking(supabaseAdmin, {
              sessionId,
              bookingType: resolvedBookingType,
              serviceId: resolvedServiceId,
              startDateTime: slotStartDateTime,
            })) ||
            (siteClientId
              ? await findConfirmedSlotBookingByMindbodyClient(supabaseAdmin, {
                mindbodySiteClientId: siteClientId,
                bookingType: resolvedBookingType,
                serviceId: resolvedServiceId,
                startDateTime: slotStartDateTime,
              })
              : null);
          if (recovered) {
            return confirmedBookingResponse(recovered);
          }
        }
      } catch (reconcileErr) {
        console.error("Pending booking reconciliation error:", reconcileErr);
      }
      return bookingInProgressResponse();
    }

    claimedBookingId = claim.bookingId;
    let mindbodySucceeded = false;

    try {
    let bookingResult: Record<string, unknown>;
    let mindbodyId: string | undefined;
    let bookedClientId: string | undefined;
    let paymentMeta: { method: "pass" | "stored_card"; amountGbp?: number; listPriceGbp?: number } | undefined;
    let bookedClientServiceId: number | undefined;

    if (bookingType === "class") {
      if (!classId) {
        await releaseBookingClaim(supabaseAdmin, claimedBookingId);
        throw new Error("classId is required for class booking");
      }

      const result = await bookClassWithPayment(
        supabaseAdmin,
        session,
        apiKey,
        siteId,
        classId,
        slotStartDateTime,
        typeof locationId === "number" ? locationId : parseInt(String(locationId || "1"), 10),
        serviceName,
      );
      if (!result.ok) {
        if (await shouldReleaseClaimAfterFailure(result.response)) {
          await releaseBookingClaim(supabaseAdmin, claimedBookingId);
        }
        return await returnBookingFailure(result.response, {
          session,
          profile: guestProfile,
          bookingType: "class",
          serviceName,
          startDateTime: slotStartDateTime,
        });
      }
      mindbodySucceeded = true;
      bookingResult = result.data as Record<string, unknown>;
      mindbodyId = classId;
      bookedClientId = result.clientId;
      paymentMeta = result.payment;
      bookedClientServiceId = result.clientServiceId;
    } else {
      if (!sessionTypeId || !staffId || !startDateTime) {
        await releaseBookingClaim(supabaseAdmin, claimedBookingId);
        throw new Error("sessionTypeId, staffId, and startDateTime are required");
      }

      const result = await bookAppointmentWithPayment(
        supabaseAdmin,
        session,
        apiKey,
        siteId,
        sessionTypeId,
        staffId,
        typeof locationId === "number" ? locationId : parseInt(String(locationId || "1"), 10),
        startDateTime,
        endDateTime,
        serviceName,
      );
      if (!result.ok) {
        if (await shouldReleaseClaimAfterFailure(result.response)) {
          await releaseBookingClaim(supabaseAdmin, claimedBookingId);
        }
        return await returnBookingFailure(result.response, {
          session,
          profile: guestProfile,
          bookingType: "appointment",
          serviceName,
          startDateTime: slotStartDateTime,
        });
      }
      mindbodySucceeded = true;
      bookingResult = result.data as Record<string, unknown>;
      const checkoutAppointment = bookingResult.Appointment as { Id?: number } | undefined;
      const checkoutAppointments = bookingResult.Appointments as Array<{ Id?: number }> | undefined;
      mindbodyId =
        checkoutAppointment?.Id?.toString() ??
        checkoutAppointments?.[0]?.Id?.toString();
      bookedClientId = result.clientId;
      paymentMeta = result.payment;
      bookedClientServiceId = result.clientServiceId;
    }

    // Build metadata with fallbacks to client-provided values so the row is never sparse.
    const appointment = bookingResult.Appointment as {
      Staff?: { FirstName?: string; LastName?: string };
      Location?: { Name?: string };
    } | undefined;
    const classInfo = bookingResult.Class as { StartDateTime?: string; EndDateTime?: string } | undefined;
    const resolvedStaffName = appointment?.Staff?.FirstName
      ? `${appointment.Staff.FirstName} ${appointment.Staff.LastName || ""}`.trim()
      : (staffName || null);
    const resolvedLocationName = appointment?.Location?.Name || locationName || null;

    const booking = await persistBookingCheckout(supabaseAdmin, {
      sessionId,
      bookingId: claimedBookingId,
      idempotencyKey: effectiveIdempotencyKey,
      bookingType: resolvedBookingType,
      mindbodyAppointmentId: bookingType === "appointment" ? mindbodyId : null,
      mindbodyClassId: bookingType === "class" ? mindbodyId : null,
      serviceName: serviceName || "Booking",
      serviceId: resolvedServiceId,
      staffName: resolvedStaffName,
      locationName: resolvedLocationName,
      startDateTime: startDateTime || classInfo?.StartDateTime || slotStartDateTime,
      endDateTime: endDateTime || classInfo?.EndDateTime,
      paymentMethod: paymentMeta?.method ?? null,
      mindbodyClientServiceId: bookedClientServiceId != null
        ? String(bookedClientServiceId)
        : null,
    });

    if (!booking) {
      const recovered = await findConfirmedSlotBooking(supabaseAdmin, {
        sessionId,
        bookingType: resolvedBookingType,
        serviceId: resolvedServiceId,
        startDateTime: startDateTime || classInfo?.StartDateTime || slotStartDateTime,
      });
      if (recovered) {
        return confirmedBookingResponse(recovered);
      }
      console.error("Mindbody booking succeeded but local confirm failed for", claimedBookingId);
    }

    const communalContrast =
      /communal\s*contrast/i.test(serviceName || "") || bookingType === "class";
    if (
      bookingType === "class" &&
      paymentMeta?.method === "pass" &&
      communalContrast &&
      bookedClientId
    ) {
      try {
        const staffToken = await getStaffToken();
        const services = await fetchActiveClientServices(
          apiKey,
          siteId,
          staffToken,
          bookedClientId,
        );
        const junePass =
          (bookedClientServiceId != null &&
            services.find((s) => s.Id === bookedClientServiceId && isJuneContrastPassName(s.Name))) ||
          findJuneContrastPassRow(services);
        if (junePass?.Id != null) {
          await logJunePassClassBooking(supabaseAdmin, {
            sessionId,
            mindbodyClientId: session.mindbody_client_id,
            mindbodySiteClientId: bookedClientId,
            mindbodyClientServiceId: junePass.Id,
            mindbodyClassId: classId,
            bookingId: booking?.id ?? null,
            serviceName: serviceName || null,
            classStartTime: startDateTime || classInfo?.StartDateTime || null,
          });
        }
      } catch (logErr) {
        console.warn("June pass booking audit:", logErr);
      }
    }

    try {
      const profile = await sessionClientProfile(session, apiKey, siteId);
      await sendBookingConfirmationEmails(
        {
          to: profile.email,
          firstName: profile.firstName,
          serviceName: serviceName || "Booking",
          startTime: startDateTime || classInfo?.StartDateTime,
          endTime: endDateTime || classInfo?.EndDateTime,
          locationName: resolvedLocationName,
          bookingType: bookingType === "appointment" ? "appointment" : "class",
        },
        {
          apiKey,
          siteId,
          mindbodyClientId: bookedClientId,
          classId: bookingType === "class" ? classId : undefined,
        },
      );
    } catch (emailErr) {
      console.error("Confirmation email error (booking still confirmed):", emailErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking: {
          id: booking?.id,
          mindbodyId,
          serviceName: serviceName || "Booking",
          startTime: startDateTime,
          status: "confirmed",
        },
        payment: paymentMeta,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
    } catch (bookingErr) {
      // Do not release the claim on unexpected errors after entering Mindbody.
      // A network/runtime failure may happen after Mindbody has charged or booked.
      throw bookingErr;
    }
  } catch (error) {
    console.error("Booking error:", error);
    const message = error instanceof Error ? error.message : "Booking failed";
    sendOpsAlert({
      category: "booking_error",
      title: "Unhandled booking error",
      summary: message,
      dedupeKey: `booking:unhandled:${message.slice(0, 120)}`,
    });
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
