type SaleServiceRow = {
  Id?: number;
  Name?: string;
  Price?: number;
  OnlinePrice?: number;
};

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

export function pickSaleServiceForClass(services: SaleServiceRow[]): SaleServiceRow | null {
  if (!services.length) return null;
  const withPrice = services.filter((s) => {
    const p = s.OnlinePrice ?? s.Price;
    return p != null && p > 0;
  });
  const pool = withPrice.length ? withPrice : services;
  const prefer = pool.find((s) =>
    /communal|contrast|members?\s*suite|off\s*peak|drop|visit|class/i.test(s.Name || "")
  );
  return prefer ?? pool[0] ?? null;
}

export type CheckoutResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; message: string; noStoredCard?: boolean };

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
