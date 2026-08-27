/** Mindbody client record shape (subset). */
type MindbodyClientRow = {
  Id?: number | string;
  UniqueId?: number | string;
  Email?: string;
  FirstName?: string;
  LastName?: string;
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

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function pickMatchingClient(
  clients: MindbodyClientRow[],
  publicClientId: string,
  siteId: string,
  profile?: ClientProfile,
): MindbodyClientRow | null {
  const pub = publicClientId.trim();
  for (const client of clients) {
    const unique = client.UniqueId != null ? String(client.UniqueId) : "";
    const id = client.Id != null ? String(client.Id) : "";
    if (unique === pub || id === pub) return client;
  }

  const email = profile?.email?.trim();
  if (email) {
    const want = normalizeEmail(email);
    const byEmail = clients.find((c) => c.Email && normalizeEmail(c.Email) === want);
    if (byEmail?.Id != null) return byEmail;
  }

  const first = profile?.firstName?.trim().toLowerCase();
  const last = profile?.lastName?.trim().toLowerCase();
  if (first && last) {
    const byName = clients.find((c) =>
      c.FirstName?.trim().toLowerCase() === first &&
      c.LastName?.trim().toLowerCase() === last
    );
    if (byName?.Id != null) return byName;
  }

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

/** OAuth `sub` is Mindbody's Custom/Unique id — query UniqueIds, not ClientIds. */
async function lookupByUniqueId(
  publicClientId: string,
  apiKey: string,
  siteId: string,
  bearerToken: string,
  profile?: ClientProfile,
): Promise<MindbodyClientRow | null> {
  const enc = encodeURIComponent(publicClientId);
  const urls = [
    `https://api.mindbodyonline.com/public/v6/client/clients?UniqueIds=${enc}&limit=20&CrossRegionalLookup=true`,
    `https://api.mindbodyonline.com/public/v6/client/clients?UniqueIds=${enc}&limit=20`,
    `https://api.mindbodyonline.com/public/v6/client/clients?ClientIds=${enc}&limit=20&CrossRegionalLookup=true`,
    `https://api.mindbodyonline.com/public/v6/client/clients?SearchText=${enc}&limit=20&CrossRegionalLookup=true`,
  ];

  for (const url of urls) {
    const clients = await fetchClients(url, apiKey, siteId, bearerToken);
    const match = pickMatchingClient(clients, publicClientId, siteId, profile);
    if (match?.Id != null) return match;
  }
  return null;
}

/** Exact case-insensitive email match within a SearchText result set. */
function findExactEmailInClients(
  clients: MindbodyClientRow[],
  email: string,
): MindbodyClientRow | null {
  const want = normalizeEmail(email);
  return clients.find((c) => c.Id != null && c.Email && normalizeEmail(c.Email) === want) ?? null;
}

/**
 * Find an existing site client by email (trim + lowercase). Tries both the
 * original and normalised SearchText so Mindbody casing quirks don't hide a
 * match. Only accepts an exact normalised email equality — never a fuzzy
 * first-hit — so we never create a duplicate or link the wrong person.
 */
async function findClientByNormalizedEmail(
  email: string,
  apiKey: string,
  siteId: string,
  bearerToken: string,
): Promise<MindbodyClientRow | null> {
  const trimmed = email.trim();
  if (!trimmed) return null;
  const normalized = normalizeEmail(trimmed);
  const searchTerms = [...new Set([trimmed, normalized])];

  for (const term of searchTerms) {
    const enc = encodeURIComponent(term);
    const urls = [
      `https://api.mindbodyonline.com/public/v6/client/clients?SearchText=${enc}&limit=50&CrossRegionalLookup=true`,
      `https://api.mindbodyonline.com/public/v6/client/clients?SearchText=${enc}&limit=50`,
    ];
    for (const url of urls) {
      const clients = await fetchClients(url, apiKey, siteId, bearerToken);
      const match = findExactEmailInClients(clients, normalized);
      if (match) return match;
    }
  }
  return null;
}

async function fetchCrossRegionalSiteClientId(
  publicClientId: string,
  apiKey: string,
  siteId: string,
  bearerToken: string,
  numericHint?: string | null,
): Promise<string | null> {
  const idsToTry = [publicClientId, numericHint].filter(Boolean) as string[];

  for (const clientId of idsToTry) {
    const url =
      `https://api.mindbodyonline.com/public/v6/client/clientcrossregionalassociations?ClientId=${encodeURIComponent(clientId)}`;
    const res = await fetch(url, { method: "GET", headers: mindbodyHeaders(apiKey, siteId, bearerToken) });
    if (!res.ok) continue;

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
  }

  return null;
}

async function addClientAtSite(
  apiKey: string,
  siteId: string,
  staffToken: string,
  publicClientId: string,
  profile: ClientProfile,
): Promise<string | null> {
  const email = profile.email?.trim();

  // Main defence against duplicate studio profiles: never addClient when a
  // case-insensitive email match already exists.
  if (email) {
    const existing = await findClientByNormalizedEmail(email, apiKey, siteId, staffToken);
    if (existing?.Id != null) {
      console.log(
        "Linked existing Mindbody client via email pre-check (skipped addClient):",
        publicClientId,
        "->",
        existing.Id,
        "email:",
        email,
      );
      return String(existing.Id);
    }
  }

  const body: Record<string, unknown> = {
    FirstName: profile.firstName?.trim() || "Guest",
    LastName: profile.lastName?.trim() || "Client",
    Test: false,
    SendAccountEmails: false,
    SendPromotionalEmails: false,
  };
  if (email) body.Email = email;

  const res = await fetch("https://api.mindbodyonline.com/public/v6/client/addclient", {
    method: "POST",
    headers: mindbodyHeaders(apiKey, siteId, staffToken),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("Mindbody addclient failed:", res.status, errText);
    // Duplicate (or any reject with email on file): link the existing site
    // client rather than creating a second profile or returning null.
    if (email) {
      const found = await findClientByNormalizedEmail(email, apiKey, siteId, staffToken);
      if (found?.Id != null) {
        console.log(
          "Linked existing Mindbody client after addclient reject:",
          publicClientId,
          "->",
          found.Id,
          "email:",
          email,
        );
        return String(found.Id);
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

  // Rare: 200 with no Client.Id — still try email link before giving up.
  if (email) {
    const found = await findClientByNormalizedEmail(email, apiKey, siteId, staffToken);
    if (found?.Id != null) return String(found.Id);
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

  const email = profile?.email?.trim();
  if (email) {
    const byEmail = await findClientByNormalizedEmail(email, apiKey, siteId, bearerToken);
    if (byEmail?.Id != null) {
      const numeric = String(byEmail.Id);
      console.log("Resolved client via email:", email, "->", numeric, "UniqueId:", byEmail.UniqueId);
      return numeric;
    }
  }

  const byUnique = await lookupByUniqueId(pub, apiKey, siteId, bearerToken, profile);
  const numericHint = byUnique?.Id != null ? String(byUnique.Id) : null;
  if (numericHint && numericHint !== pub) {
    console.log("Resolved client via UniqueId:", pub, "->", numericHint);
    return numericHint;
  }

  const crossRegionalId = await fetchCrossRegionalSiteClientId(pub, apiKey, siteId, bearerToken, numericHint);
  if (crossRegionalId && crossRegionalId !== pub) {
    console.log("Resolved client via cross-regional associations:", pub, "->", crossRegionalId);
    return crossRegionalId;
  }

  // Create-or-link when lookups miss. addClientAtSite includes the email on
  // create; if Mindbody rejects (duplicate email), it re-queries and links
  // the existing site client instead of inventing a second profile.
  //
  // An email on its own is enough to get here. Mindbody does not always send a
  // name claim, and gating on firstName dead-ended every genuinely new customer
  // at profileNotFound. Email is the dedupe key addClientAtSite pre-checks, so
  // creating on email alone cannot attach anyone to a stranger's record.
  if (profile?.firstName || email) {
    if (!profile?.firstName) {
      console.warn(
        "No name claim from Mindbody — creating site client with addClient defaults:",
        pub,
        "email:",
        email,
      );
    }
    const createdOrLinked = await addClientAtSite(apiKey, siteId, bearerToken, pub, profile ?? {});
    if (createdOrLinked) {
      console.log(
        email
          ? "Resolved client via create-or-link:"
          : "Resolved client via addclient (no email):",
        pub,
        "->",
        createdOrLinked,
      );
      return createdOrLinked;
    }
  }

  console.warn("Could not resolve site client id for public id:", pub, "email:", email ?? "(none)");
  return null;
}

/** Probe that the user's OAuth token is accepted for this site (read-only). */
export async function probeUserMindbodyToken(
  publicClientId: string,
  accessToken: string,
  apiKey: string,
  siteId: string,
): Promise<{ ok: boolean; status: number; body: string }> {
  const enc = encodeURIComponent(publicClientId);
  const res = await fetch(
    `https://api.mindbodyonline.com/public/v6/client/clients?UniqueIds=${enc}&limit=1&CrossRegionalLookup=true`,
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
