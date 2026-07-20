type SaleServiceRow = {
  Id?: number;
  Name?: string;
  Price?: number;
  OnlinePrice?: number;
  Count?: number;
};

function salePrice(service: SaleServiceRow): number {
  return service.OnlinePrice ?? service.Price ?? 0;
}

/** Multi-session / pass products must not be used for a single drop-in class booking. */
export function isMultiSessionPack(name: string, count?: number): boolean {
  const n = name.trim();
  if (count != null && count > 1) return true;
  return (
    /\bpack\b/i.test(n) ||
    /\bpass\b/i.test(n) ||
    /\bunlimited\b/i.test(n) ||
    /\d+\s*week/i.test(n) ||
    /\d+\s*[-–]?\s*session\s*pack/i.test(n) ||
    /\d+\s*(?:session|visit)s?\s*pack/i.test(n)
  );
}

/**
 * Pick a single-session pricing option for drop-in class checkout.
 * Never returns multi-session packs (e.g. "10 Communal Contrast Pack").
 */
export function pickSaleServiceForClass(services: SaleServiceRow[]): SaleServiceRow | null {
  if (!services.length) return null;

  const withPrice = services.filter((s) => salePrice(s) > 0);
  const pool = withPrice.length ? withPrice : services;

  const singles = pool.filter((s) => !isMultiSessionPack(s.Name || "", s.Count));
  if (!singles.length) {
    console.warn(
      "pickSaleServiceForClass: only multi-session packs available — refusing pack checkout",
      pool.map((s) => ({ id: s.Id, name: s.Name, price: salePrice(s), count: s.Count })),
    );
    return null;
  }

  const contrastMatches = singles.filter((s) =>
    /communal|contrast|members?\s*suite|off\s*peak|drop|visit|class/i.test(s.Name || ""),
  );
  const candidates = contrastMatches.length ? contrastMatches : singles;

  const picked = [...candidates].sort((a, b) => salePrice(a) - salePrice(b))[0] ?? null;
  if (picked) {
    console.log("pickSaleServiceForClass:", {
      id: picked.Id,
      name: picked.Name,
      price: salePrice(picked),
      rejected: pool
        .filter((s) => s.Id !== picked.Id)
        .map((s) => ({ id: s.Id, name: s.Name, price: salePrice(s) })),
    });
  }
  return picked;
}

/** Pick the cheapest single-session pricing option for appointment checkout. */
export function pickSaleServiceForSession(services: SaleServiceRow[]): SaleServiceRow | null {
  if (!services.length) return null;

  const withPrice = services.filter((s) => salePrice(s) > 0);
  const pool = withPrice.length ? withPrice : services;
  const singles = pool.filter((s) => !isMultiSessionPack(s.Name || "", s.Count));
  if (!singles.length) {
    console.warn(
      "pickSaleServiceForSession: only multi-session packs available — refusing pack checkout",
      pool.map((s) => ({ id: s.Id, name: s.Name, price: salePrice(s), count: s.Count })),
    );
    return null;
  }

  const cryoMatches = singles.filter((s) => /cryo/i.test(s.Name || ""));
  const singleVisitMatches = singles.filter((s) =>
    /single|drop|visit|session(?!.*pack)/i.test(s.Name || ""),
  );
  const candidates = cryoMatches.length
    ? cryoMatches
    : singleVisitMatches.length
    ? singleVisitMatches
    : singles;

  const picked = [...candidates].sort((a, b) => salePrice(a) - salePrice(b))[0] ?? null;
  if (picked) {
    console.log("pickSaleServiceForSession:", {
      id: picked.Id,
      name: picked.Name,
      price: salePrice(picked),
    });
  }
  return picked;
}

function headers(apiKey: string, siteId: string, bearerToken: string) {
  return {
    "Content-Type": "application/json",
    "Api-Key": apiKey,
    "SiteId": siteId,
    Authorization: `Bearer ${bearerToken}`,
  };
}

async function fetchSaleServices(
  apiKey: string,
  siteId: string,
  bearerToken: string,
  params: URLSearchParams,
  label: string,
): Promise<SaleServiceRow[]> {
  const res = await fetch(
    `https://api.mindbodyonline.com/public/v6/sale/services?${params}`,
    { method: "GET", headers: headers(apiKey, siteId, bearerToken) },
  );
  if (!res.ok) {
    console.warn(`sale/services ${label} failed:`, res.status, await res.text().catch(() => ""));
    return [];
  }
  const data = await res.json();
  return (data.Services || []) as SaleServiceRow[];
}

/** Pricing options that can pay for a specific class (Mindbody sale/services). */
export async function fetchSaleServicesForClass(
  apiKey: string,
  siteId: string,
  bearerToken: string,
  classId: number,
  locationId?: number,
): Promise<SaleServiceRow[]> {
  const base = new URLSearchParams({ ClassId: String(classId) });
  if (locationId != null) base.set("LocationId", String(locationId));

  const onlineParams = new URLSearchParams(base);
  onlineParams.set("SellOnline", "true");
  const online = await fetchSaleServices(apiKey, siteId, bearerToken, onlineParams, `class:${classId}:online`);
  if (online.length) return online;

  return await fetchSaleServices(apiKey, siteId, bearerToken, base, `class:${classId}:all`);
}

/** Pricing options for a session type (appointments / suites). */
export async function fetchSaleServicesForSessionType(
  apiKey: string,
  siteId: string,
  bearerToken: string,
  sessionTypeId: number,
  locationId?: number,
): Promise<SaleServiceRow[]> {
  const params = new URLSearchParams({
    SessionTypeIds: String(sessionTypeId),
    SellOnline: "true",
  });
  if (locationId != null) params.set("LocationId", String(locationId));

  const res = await fetch(
    `https://api.mindbodyonline.com/public/v6/sale/services?${params}`,
    { method: "GET", headers: headers(apiKey, siteId, bearerToken) },
  );
  if (!res.ok) {
    console.warn(
      "sale/services for session type failed:",
      sessionTypeId,
      res.status,
      await res.text().catch(() => ""),
    );
    return [];
  }
  const data = await res.json();
  return (data.Services || []) as SaleServiceRow[];
}

export type CheckoutFailureFlags = {
  noStoredCard?: boolean;
  /**
   * Mindbody could not locate the client's saved card *right now*. This is a
   * pre-charge validation error (no payment is attempted), and for cross-studio
   * "roaming" clients it is often transient — the same checkout succeeds minutes
   * later. Safe to retry without any double-charge risk.
   */
  storedCardUnavailable?: boolean;
  /** Listed price didn't match Mindbody cart total (e.g. member discount). Pre-charge. */
  paymentAmountMismatch?: boolean;
  siteScopeIssue?: boolean;
  cardDeclined?: boolean;
  bookingConflict?: boolean;
};

export type CheckoutResult =
  | { ok: true; data: Record<string, unknown>; amountCharged: number }
  | ({ ok: false; message: string } & CheckoutFailureFlags);

/**
 * The exact Mindbody message when the stored-card lookup misses. Kept narrow so
 * we only auto-retry the pre-charge case (Mindbody never attempts payment when
 * it can't find a card, so retrying cannot double-charge).
 */
const STORED_CARD_UNAVAILABLE = /stored card can\s?not be found|stored card cannot be found|no stored card (?:on file|found)/i;

/** Classify Mindbody checkout error text for user messaging and UI routing. */
export function classifyCheckoutFailure(message: string): CheckoutFailureFlags {
  const lower = message.toLowerCase();
  const storedCardUnavailable = STORED_CARD_UNAVAILABLE.test(lower);
  return {
    // A card-holding client hitting the transient lookup miss must NOT be told
    // "no card on file"; keep that reserved for genuine missing-payment phrasing.
    noStoredCard:
      !storedCardUnavailable &&
      /no card|card on file|payment method|credit card|billing|no payment instrument|does not have a payment|no default card/i
        .test(lower),
    storedCardUnavailable,
    paymentAmountMismatch:
      /payment total.*does not match the calculated total|does not match the calculated total/i
        .test(lower),
    siteScopeIssue:
      /site id does not match|user token site id|custom id|cross.?regional|invalid client|does not exist/i.test(
        lower,
      ),
    cardDeclined:
      /\bdeclined\b|insufficient funds|card expired|expired card|invalid card|do not honor|authorization failed|card was declined/i
        .test(lower),
    bookingConflict:
      /time is not available|already scheduled|scheduling restriction|maximum number of sessions/i
        .test(lower),
  };
}

/**
 * Charge stored cards using staff credentials only.
 * Production logs show consumer OAuth checkout fails 100% of the time with
 * "User token site id does not match" for cross-studio Mindbody accounts.
 * Never retry a failed checkout with another token: Mindbody may have charged
 * or created the booking before returning an error.
 */
export async function checkoutWithConsumerThenStaff(
  _apiKey: string,
  _siteId: string,
  _consumerToken: string,
  staffToken: string,
  runCheckout: (bearerToken: string) => Promise<CheckoutResult>,
): Promise<CheckoutResult> {
  const staff = await runCheckout(staffToken);
  if (staff.ok) {
    console.log("checkoutshoppingcart ok via staff token");
    return staff;
  }

  console.warn(
    "Staff checkout failed:",
    staff.message?.slice(0, 200) || "unknown",
  );
  return staff;
}

function parseCheckoutFailure(
  res: Response,
  raw: string,
  data: Record<string, unknown>,
): { message: string } & CheckoutFailureFlags {
  const message =
    (data as { Error?: { Message?: string } }).Error?.Message ||
    (data as { Message?: string }).Message ||
    raw.slice(0, 400) ||
    `Checkout failed (${res.status})`;
  return { message, ...classifyCheckoutFailure(message) };
}

function parseCalculatedCartTotal(message: string): number | null {
  const match = message.match(
    /calculated total\s*\((\d+(?:\.\d+)?)\)/i,
  );
  if (!match) return null;
  const amount = Number(match[1]);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function isPaymentAmountMismatch(message: string): boolean {
  return /payment total.*does not match the calculated total|does not match the calculated total/i
    .test(message);
}

/**
 * Charge stored card via Mindbody checkout (pricing option / pass purchase or class + payment).
 * @see https://api.mindbodyonline.com/public/v6/sale/checkoutshoppingcart
 */
export async function checkoutWithStoredCard(
  apiKey: string,
  siteId: string,
  bearerToken: string,
  opts: {
    clientId: string;
    locationId: number;
    serviceId: number;
    amount: number;
    classIds?: number[];
    appointmentBookingRequests?: Array<Record<string, unknown>>;
  },
): Promise<CheckoutResult> {
  const item: Record<string, unknown> = {
    Item: {
      Type: "Service",
      Metadata: { Id: String(opts.serviceId) },
    },
    Quantity: 1,
  };
  if (opts.classIds?.length) {
    item.ClassIds = opts.classIds;
  }
  if (opts.appointmentBookingRequests?.length) {
    item.AppointmentBookingRequests = opts.appointmentBookingRequests;
  }

  const clientIdNum = parseInt(opts.clientId, 10);
  let chargeAmount = opts.amount;

  // Stored-card lookup miss is a pre-charge validation error and is often
  // transient for cross-studio clients. Amount mismatches (member discounts)
  // are also pre-charge — retry once with Mindbody's calculated total.
  const MAX_ATTEMPTS = 3;
  let lastFailure: ({ message: string } & CheckoutFailureFlags) | null = null;
  let amountMismatchRetried = false;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const body = {
      ClientId: Number.isFinite(clientIdNum) ? clientIdNum : opts.clientId,
      LocationId: opts.locationId,
      InStore: false,
      SendEmail: true,
      Test: false,
      Items: [item],
      Payments: [
        {
          Type: "StoredCard",
          Metadata: { Amount: chargeAmount },
        },
      ],
    };

    const res = await fetch("https://api.mindbodyonline.com/public/v6/sale/checkoutshoppingcart", {
      method: "POST",
      headers: headers(apiKey, siteId, bearerToken),
      body: JSON.stringify(body),
    });

    const raw = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      /* ignore */
    }

    if (res.ok) {
      if (chargeAmount !== opts.amount) {
        console.log(
          `checkoutshoppingcart ok with adjusted amount ${chargeAmount} (listed ${opts.amount})`,
        );
      }
      return { ok: true, data, amountCharged: chargeAmount };
    }

    lastFailure = parseCheckoutFailure(res, raw, data);

    if (lastFailure.storedCardUnavailable && attempt < MAX_ATTEMPTS) {
      console.warn(
        `checkoutshoppingcart stored-card lookup miss (attempt ${attempt}/${MAX_ATTEMPTS}); retrying`,
      );
      await new Promise((resolve) => setTimeout(resolve, 1200 * attempt));
      continue;
    }

    if (
      !amountMismatchRetried &&
      isPaymentAmountMismatch(lastFailure.message)
    ) {
      const calculated = parseCalculatedCartTotal(lastFailure.message);
      if (calculated != null && calculated !== chargeAmount) {
        console.warn(
          `checkoutshoppingcart amount mismatch: sent ${chargeAmount}, Mindbody expects ${calculated}; retrying`,
        );
        chargeAmount = calculated;
        amountMismatchRetried = true;
        continue;
      }
    }

    console.warn("checkoutshoppingcart failed:", res.status, lastFailure.message.slice(0, 300));
    return { ok: false, ...lastFailure };
  }

  return {
    ok: false,
    message: lastFailure?.message ?? "Checkout failed",
    ...(lastFailure ?? {}),
  };
}

/** Charge stored card and book the class in one checkout. */
export async function checkoutClassWithStoredCard(
  apiKey: string,
  siteId: string,
  bearerToken: string,
  opts: {
    clientId: string;
    classId: number;
    locationId: number;
    serviceId: number;
    amount: number;
  },
): Promise<CheckoutResult> {
  const result = await checkoutWithStoredCard(apiKey, siteId, bearerToken, {
    clientId: opts.clientId,
    locationId: opts.locationId,
    serviceId: opts.serviceId,
    amount: opts.amount,
    classIds: [opts.classId],
  });
  if (result.ok) {
    console.log("checkoutshoppingcart ok for class", opts.classId);
  }
  return result;
}

/** Charge stored card and book an appointment in one checkout. */
export async function checkoutAppointmentWithStoredCard(
  apiKey: string,
  siteId: string,
  bearerToken: string,
  opts: {
    clientId: string;
    locationId: number;
    serviceId: number;
    amount: number;
    staffId: number;
    sessionTypeId: number;
    startDateTime: string;
    endDateTime?: string;
  },
): Promise<CheckoutResult> {
  const appointmentRequest: Record<string, unknown> = {
    StaffId: opts.staffId,
    LocationId: opts.locationId,
    SessionTypeId: opts.sessionTypeId,
    StartDateTime: opts.startDateTime,
  };
  if (opts.endDateTime) {
    appointmentRequest.EndDateTime = opts.endDateTime;
  }

  const result = await checkoutWithStoredCard(apiKey, siteId, bearerToken, {
    clientId: opts.clientId,
    locationId: opts.locationId,
    serviceId: opts.serviceId,
    amount: opts.amount,
    appointmentBookingRequests: [appointmentRequest],
  });
  if (result.ok) {
    console.log(
      "checkoutshoppingcart ok for appointment",
      opts.sessionTypeId,
      opts.startDateTime,
    );
  }
  return result;
}

/** Purchase a pricing option (e.g. 2-week pass) — no class booking in this cart. */
export async function checkoutServiceWithStoredCard(
  apiKey: string,
  siteId: string,
  bearerToken: string,
  opts: {
    clientId: string;
    locationId: number;
    serviceId: number;
    amount: number;
  },
): Promise<CheckoutResult> {
  const result = await checkoutWithStoredCard(apiKey, siteId, bearerToken, opts);
  if (result.ok) {
    console.log("checkoutshoppingcart ok for service", opts.serviceId);
  }
  return result;
}
