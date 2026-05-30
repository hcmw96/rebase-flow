/** Mindbody client record shape (subset). */
type MindbodyClientRow = {
  Id?: number | string;
  UniqueId?: number | string;
  Email?: string;
};

export type ClientProfile = {
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

function mindbodyHeaders(apiKey: string, siteId: string, bearerToken: string) {
  return {
    "Content-Type": "application/json",
    "Api-Key": apiKey,
    "SiteId": siteId,
    Authorization: `Bearer ${bearerToken}`,
  };
}

function pickMatchingClient(
  clients: MindbodyClientRow[],
  publicClientId: string,
  siteId: string,
): MindbodyClientRow | null {
  const pub = publicClientId.trim();
  for (const client of clients) {
    const unique = client.UniqueId != null ? String(client.UniqueId) : "";
    const id = client.Id != null ? String(client.Id) : "";
    if (unique === pub || id === pub) return client;
  }
  // Prefer a client whose home site matches when present on the row
  for (const client of clients) {
    const homeSite = (client as { HomeLocation?: { SiteId?: number } }).HomeLocation?.SiteId;
    if (homeSite != null && String(homeSite) === String(siteId) && client.Id != null) {
      return client;
    }
  }
  return clients.find((c) => c.Id != null) ?? null;
}

async function fetchClients(
  url: string,
  apiKey: string,
  siteId: string,
  bearerToken: string,
): Promise<MindbodyClientRow[]> {
  const res = await fetch(url, { method: "GET", headers: mindbodyHeaders(apiKey, siteId, bearerToken) });
  if (!res.ok) {
    console.warn("Mindbody clients lookup failed:", res.status, url, await res.text().catch(() => ""));
    return [];
  }
  const data = await res.json();
  return (data.Clients || []) as MindbodyClientRow[];
}

async function lookupClients(
  publicClientId: string,
  apiKey: string,
  siteId: string,
  bearerToken: string,
  profile?: ClientProfile,
): Promise<MindbodyClientRow | null> {
  const enc = encodeURIComponent(publicClientId);
  const urls = [
    `https://api.mindbodyonline.com/public/v6/client/clients?ClientIds=${enc}&limit=20&CrossRegionalLookup=true`,
    `https://api.mindbodyonline.com/public/v6/client/clients?ClientIds=${enc}&limit=20`,
    `https://api.mindbodyonline.com/public/v6/client/clients?SearchText=${enc}&limit=20&CrossRegionalLookup=true`,
  ];

  const email = profile?.email?.trim();
  if (email) {
    urls.push(
      `https://api.mindbodyonline.com/public/v6/client/clients?SearchText=${encodeURIComponent(email)}&limit=20&CrossRegionalLookup=true`,
    );
  }

  for (const url of urls) {
    const clients = await fetchClients(url, apiKey, siteId, bearerToken);
    const match = pickMatchingClient(clients, publicClientId, siteId);
    if (match?.Id != null) return match;
  }

  return null;
}

async function fetchCrossRegionalSiteClientId(
  publicClientId: string,
  apiKey: string,
  siteId: string,
  bearerToken: string,
): Promise<string | null> {
  const url =
    `https://api.mindbodyonline.com/public/v6/client/clientcrossregionalassociations?ClientId=${encodeURIComponent(publicClientId)}`;
  const res = await fetch(url, { method: "GET", headers: mindbodyHeaders(apiKey, siteId, bearerToken) });
  if (!res.ok) return null;

  const data = await res.json();
  const associations = (data.CrossRegionalClientAssociations ||
    data.ClientAssociations ||
    data.Associations ||
    []) as Array<{ SiteId?: number; ClientId?: number | string; Id?: number | string }>;

  for (const row of associations) {
    if (row.SiteId != null && String(row.SiteId) === String(siteId)) {
      const id = row.ClientId ?? row.Id;
      if (id != null) return String(id);
    }
  }

  const first = associations.find((r) => (r.ClientId ?? r.Id) != null);
  if (first) return String(first.ClientId ?? first.Id);

  return null;
}

async function addClientAtSite(
  apiKey: string,
  siteId: string,
  staffToken: string,
  publicClientId: string,
  profile: ClientProfile,
): Promise<string | null> {
  const body: Record<string, unknown> = {
    FirstName: profile.firstName?.trim() || "Guest",
    LastName: profile.lastName?.trim() || "Client",
    Test: false,
    SendAccountEmails: false,
    SendPromotionalEmails: false,
  };
  const email = profile.email?.trim();
  if (email) body.Email = email;

  const res = await fetch("https://api.mindbodyonline.com/public/v6/client/addclient", {
    method: "POST",
    headers: mindbodyHeaders(apiKey, siteId, staffToken),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("Mindbody addclient failed:", res.status, errText);
    if (/duplicate|already exists|email/i.test(errText)) {
      const email = profile.email?.trim();
      if (email) {
        const clients = await fetchClients(
          `https://api.mindbodyonline.com/public/v6/client/clients?SearchText=${encodeURIComponent(email)}&limit=20&CrossRegionalLookup=true`,
          apiKey,
          siteId,
          staffToken,
        );
        const match = pickMatchingClient(clients, publicClientId, siteId) ?? clients[0];
        if (match?.Id != null) return String(match.Id);
      }
    }
    return null;
  }

  const data = await res.json();
  const client = data.Client as MindbodyClientRow | undefined;
  if (client?.Id != null) {
    console.log("Created Mindbody client at site:", publicClientId, "->", client.Id);
    return String(client.Id);
  }
  return null;
}

/**
 * Resolve OAuth public id → numeric site ClientId for booking APIs.
 * Never returns the public id when resolution fails (avoids "Custom ID does not exist").
 */
export async function resolveSiteClientId(
  publicClientId: string,
  apiKey: string,
  siteId: string,
  bearerToken: string,
  profile?: ClientProfile,
): Promise<string | null> {
  const pub = publicClientId.trim();
  if (!pub) return null;

  const found = await lookupClients(pub, apiKey, siteId, bearerToken, profile);
  if (found?.Id != null) {
    const numeric = String(found.Id);
    console.log("Resolved client via GET clients:", pub, "->", numeric, "UniqueId:", found.UniqueId);
    return numeric;
  }

  const crossRegionalId = await fetchCrossRegionalSiteClientId(pub, apiKey, siteId, bearerToken);
  if (crossRegionalId && crossRegionalId !== pub) {
    console.log("Resolved client via cross-regional associations:", pub, "->", crossRegionalId);
    return crossRegionalId;
  }

  if (profile && (profile.email || profile.firstName)) {
    const created = await addClientAtSite(apiKey, siteId, bearerToken, pub, profile);
    if (created) return created;
  }

  console.warn("Could not resolve site client id for public id:", pub);
  return null;
}

/** @deprecated Use resolveSiteClientId — returns null instead of public id on failure. */
export async function resolveSiteClientIdLegacy(
  publicClientId: string,
  apiKey: string,
  siteId: string,
  bearerToken: string,
): Promise<string> {
  const resolved = await resolveSiteClientId(publicClientId, apiKey, siteId, bearerToken);
  return resolved ?? publicClientId;
}

/** Probe that the user's OAuth token is accepted for this site (read-only). */
export async function probeUserMindbodyToken(
  publicClientId: string,
  accessToken: string,
  apiKey: string,
  siteId: string,
): Promise<{ ok: boolean; status: number; body: string }> {
  const res = await fetch(
    `https://api.mindbodyonline.com/public/v6/client/clients?ClientIds=${encodeURIComponent(publicClientId)}&limit=1`,
    {
      headers: {
        "Api-Key": apiKey,
        "SiteId": siteId,
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
  const body = await res.text();
  return { ok: res.ok, status: res.status, body: body.slice(0, 300) };
}
