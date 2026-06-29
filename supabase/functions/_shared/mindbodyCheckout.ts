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

  const picked = [...singles].sort((a, b) => salePrice(a) - salePrice(b))[0] ?? null;
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

/** Pricing options that can pay for a specific class (Mindbody sale/services). */
export async function fetchSaleServicesForClass(
  apiKey: string,
  siteId: string,
  bearerToken: string,
  classId: number,
  locationId?: number,
): Promise<SaleServiceRow[]> {
  const params = new URLSearchParams({
    ClassId: String(classId),
    SellOnline: "true",
  });
  if (locationId != null) params.set("LocationId", String(locationId));

  const res = await fetch(
    `https://api.mindbodyonline.com/public/v6/sale/services?${params}`,
    { method: "GET", headers: headers(apiKey, siteId, bearerToken) },
  );
  if (!res.ok) {
    console.warn("sale/services for class failed:", classId, res.status, await res.text().catch(() => ""));
    return [];
  }
  const data = await res.json();
  return (data.Services || []) as SaleServiceRow[];
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

export type CheckoutResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; message: string; noStoredCard?: boolean };

/**
 * Try consumer token first; only fall back to staff when the card is missing.
 * Never retry after an ambiguous failure — the consumer call may have charged.
 */
export async function checkoutWithConsumerThenStaff(
  apiKey: string,
  siteId: string,
  consumerToken: string,
  staffToken: string,
  runCheckout: (bearerToken: string) => Promise<CheckoutResult>,
): Promise<CheckoutResult> {
  const consumer = await runCheckout(consumerToken);
  if (consumer.ok) return consumer;
  if (consumer.noStoredCard) {
    return await runCheckout(staffToken);
  }
  return consumer;
}

function parseCheckoutFailure(
  res: Response,
  raw: string,
  data: Record<string, unknown>,
): { message: string; noStoredCard: boolean } {
  const message =
    (data as { Error?: { Message?: string } }).Error?.Message ||
    (data as { Message?: string }).Message ||
    raw.slice(0, 400) ||
    `Checkout failed (${res.status})`;
  const lower = message.toLowerCase();
  const noStoredCard =
    /stored card|no card|card on file|payment method|credit card|billing/i.test(lower);
  return { message, noStoredCard };
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

  const body = {
    ClientId: opts.clientId,
    LocationId: opts.locationId,
    InStore: false,
    SendEmail: true,
    Test: false,
    Items: [item],
    Payments: [
      {
        Type: "StoredCard",
        Metadata: { Amount: opts.amount },
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
    return { ok: true, data };
  }

  const { message, noStoredCard } = parseCheckoutFailure(res, raw, data);
  console.warn("checkoutshoppingcart failed:", res.status, message.slice(0, 300));
  return { ok: false, message, noStoredCard };
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
