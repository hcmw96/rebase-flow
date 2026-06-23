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
} from "../_shared/mindbodyClientServices.ts";
import { isJuneContrastPassName } from "../_shared/contrastPass.ts";
import { logJunePassClassBooking } from "../_shared/contrastPassUsageLog.ts";
import {
  checkoutClassWithStoredCard,
  checkoutAppointmentWithStoredCard,
  fetchSaleServicesForClass,
  fetchSaleServicesForSessionType,
  isMultiSessionPack,
  pickSaleServiceForClass,
  pickSaleServiceForSession,
} from "../_shared/mindbodyCheckout.ts";

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

  const isPaymentError = (message: string) =>
    /pricing option|payment|package|sessions remaining|insufficient|does not have a valid|unable to apply|no .*available|not paid|does not have/i
      .test(message.toLowerCase());

  const isClientIdRetryable = (message: string) =>
    /site id does not match|custom id|does not exist|invalid client|cross.?regional/i.test(
      message.toLowerCase(),
    );

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
  if (bookResult && !bookResult.ok && !isPaymentError(bookResult.message)) {
    for (const cid of [clientId, publicClientId]) {
      const services = await fetchActiveClientServices(
        apiKey,
        siteId,
        activeSession.access_token,
        cid,
      );
      const clientServiceId = pickBookableClientServiceId(services);
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
  if (bookResult && !bookResult.ok && isClientIdRetryable(bookResult.message)) {
    const staffServices = await fetchActiveClientServices(apiKey, siteId, staffToken, clientId);
    const clientServiceId = pickBookableClientServiceId(staffServices);

    if (clientServiceId) {
      console.warn(
        "Consumer booking blocked by site scope; applying pass via staff with ClientServiceId:",
        clientServiceId,
      );
      bookResult = await attemptBook(staffToken, `staff:pass:${clientServiceId}`, clientId, {
        ClientServiceId: clientServiceId,
        RequirePayment: body.RequirePayment ?? true,
      });
    }
  }

  if (!bookResult?.ok) {
    const { message, status } = bookResult ?? { message: "Booking failed", status: 400 };
    const paymentIssue = isPaymentError(message);
    const siteScopeIssue = /site id does not match/i.test(message.toLowerCase());

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
          noPassOnFile: !hasPass,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
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
  locationId: number | undefined,
): Promise<
  | {
    ok: true;
    data: unknown;
    clientId: string;
    payment?: { method: "pass" | "stored_card"; amountGbp?: number };
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

  const passOnFile =
    pickBookableClientServiceId(
      await fetchActiveClientServices(apiKey, siteId, activeSession.access_token, clientId),
    ) ??
    pickBookableClientServiceId(
      await fetchActiveClientServices(apiKey, siteId, staffToken, clientId),
    );

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
    return booked;
  }

  const classIdNum = parseInt(classId, 10);
  const locId = locationId && locationId > 0 ? locationId : 1;
  let sawNoStoredCard = false;

  for (const [token, label] of [
    [activeSession.access_token, "consumer"] as const,
    [staffToken, "staff"] as const,
  ]) {
    const saleServices = await fetchSaleServicesForClass(apiKey, siteId, token, classIdNum, locId);
    const saleService = pickSaleServiceForClass(saleServices);
    if (!saleService?.Id) {
      console.warn(`No sale service for class ${classId} (${label})`);
      continue;
    }
    const amount = saleService.OnlinePrice ?? saleService.Price ?? 0;
    if (amount <= 0) continue;

    if (isMultiSessionPack(saleService.Name || "", saleService.Count)) {
      console.error(
        `Refusing pack/pass checkout for class ${classId}:`,
        saleService.Name,
        amount,
      );
      continue;
    }

    const checkout = await checkoutClassWithStoredCard(apiKey, siteId, token, {
      clientId,
      classId: classIdNum,
      locationId: locId,
      serviceId: saleService.Id,
      amount,
    });
    if (checkout.ok) {
      console.log(`Class ${classId} booked via checkout (${label})`);
      return {
        ok: true,
        data: checkout.data,
        clientId,
        payment: { method: "stored_card", amountGbp: amount },
      };
    }
    if (checkout.noStoredCard) sawNoStoredCard = true;
    console.warn(`Checkout (${label}) failed:`, checkout.message);
  }

  if (sawNoStoredCard) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error:
            "No payment card is saved on your Mindbody account. Add a card using the link on this page, then confirm again.",
          paymentRequired: true,
          noStoredCard: true,
          noPassOnFile: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      ),
    };
  }

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
): Promise<
  | {
    ok: true;
    data: unknown;
    clientId: string;
    payment?: { method: "pass" | "stored_card"; amountGbp?: number };
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

  const passOnFile =
    pickBookableClientServiceId(
      await fetchActiveClientServices(apiKey, siteId, activeSession.access_token, clientId),
    ) ??
    pickBookableClientServiceId(
      await fetchActiveClientServices(apiKey, siteId, staffToken, clientId),
    );

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
    return booked;
  }

  const sessionTypeIdNum = parseInt(sessionTypeId, 10);
  const staffIdNum = parseInt(staffId, 10);
  const locId = locationId > 0 ? locationId : 1;
  let sawNoStoredCard = false;

  for (const [token, label] of [
    [activeSession.access_token, "consumer"] as const,
    [staffToken, "staff"] as const,
  ]) {
    const saleServices = await fetchSaleServicesForSessionType(
      apiKey,
      siteId,
      token,
      sessionTypeIdNum,
      locId,
    );
    const saleService = pickSaleServiceForSession(saleServices);
    if (!saleService?.Id) {
      console.warn(`No sale service for session type ${sessionTypeId} (${label})`);
      continue;
    }
    const amount = saleService.OnlinePrice ?? saleService.Price ?? 0;
    if (amount <= 0) continue;

    if (isMultiSessionPack(saleService.Name || "", saleService.Count)) {
      console.error(
        `Refusing pack/pass checkout for session type ${sessionTypeId}:`,
        saleService.Name,
        amount,
      );
      continue;
    }

    const checkout = await checkoutAppointmentWithStoredCard(apiKey, siteId, token, {
      clientId,
      locationId: locId,
      serviceId: saleService.Id,
      amount,
      staffId: staffIdNum,
      sessionTypeId: sessionTypeIdNum,
      startDateTime,
      endDateTime,
    });
    if (checkout.ok) {
      console.log(`Appointment ${sessionTypeId} booked via checkout (${label})`);
      return {
        ok: true,
        data: checkout.data,
        clientId,
        payment: { method: "stored_card", amountGbp: amount },
      };
    }
    if (checkout.noStoredCard) sawNoStoredCard = true;
    console.warn(`Appointment checkout (${label}) failed:`, checkout.message);
  }

  if (sawNoStoredCard) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error:
            "No payment card is saved on your Mindbody account. Add a card using the link on this page, then confirm again.",
          paymentRequired: true,
          noStoredCard: true,
          noPassOnFile: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      ),
    };
  }

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
      idempotencyKey,
    } = await req.json();

    if (!sessionId) {
      throw new Error("User session is required. Please log in first.");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Idempotency short-circuit: if this key already produced a confirmed booking,
    // return it without calling Mindbody again. Prevents double-booking on retry.
    if (idempotencyKey) {
      const { data: existing } = await supabaseAdmin
        .from("bookings")
        .select("*")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();

      if (existing && existing.status === "confirmed") {
        return new Response(
          JSON.stringify({
            success: true,
            idempotent: true,
            booking: {
              id: existing.id,
              mindbodyId: existing.mindbody_appointment_id || existing.mindbody_class_id,
              serviceName: existing.service_name,
              startTime: existing.start_time,
              status: existing.status,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
        );
      }
    }
    const sessionResult = await loadBookableSession(supabaseAdmin, sessionId);
    if (sessionResult instanceof Response) return sessionResult;
    const session = sessionResult;

    let bookingResult: Record<string, unknown>;
    let mindbodyId: string | undefined;
    let bookedClientId: string | undefined;
    let paymentMeta: { method: "pass" | "stored_card"; amountGbp?: number } | undefined;
    let bookedClientServiceId: number | undefined;

    if (bookingType === "class") {
      if (!classId) {
        throw new Error("classId is required for class booking");
      }

      const result = await bookClassWithPayment(
        supabaseAdmin,
        session,
        apiKey,
        siteId,
        classId,
        typeof locationId === "number" ? locationId : parseInt(String(locationId || "1"), 10),
      );
      if (!result.ok) return result.response;
      bookingResult = result.data as Record<string, unknown>;
      mindbodyId = classId;
      bookedClientId = result.clientId;
      paymentMeta = result.payment;
      bookedClientServiceId = result.clientServiceId;
    } else {
      if (!sessionTypeId || !staffId || !startDateTime) {
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
      );
      if (!result.ok) return result.response;
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

    // Save booking to local database
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert({
        session_id: sessionId,
        mindbody_appointment_id: bookingType === "appointment" ? mindbodyId : null,
        mindbody_class_id: bookingType === "class" ? mindbodyId : null,
        service_name: serviceName || "Booking",
        service_id: sessionTypeId || classId,
        staff_name: resolvedStaffName,
        location_name: resolvedLocationName,
        start_time: startDateTime || classInfo?.StartDateTime,
        end_time: endDateTime || classInfo?.EndDateTime,
        status: "confirmed",
        booking_type: bookingType,
        idempotency_key: idempotencyKey || null,
        payment_method: paymentMeta?.method ?? null,
        mindbody_client_service_id: bookedClientServiceId != null
          ? String(bookedClientServiceId)
          : null,
      })
      .select()
      .single();

    if (bookingError) {
      console.error("Local booking save error:", bookingError);
      // Don't throw - the Mindbody booking succeeded
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
  } catch (error) {
    console.error("Booking error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
