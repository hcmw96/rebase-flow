/**
 * Resolve OAuth/public Mindbody client id → site-local numeric Id for booking APIs.
 */
export async function resolveSiteClientId(
  publicClientId: string,
  apiKey: string,
  siteId: string,
  bearerToken: string,
): Promise<string> {
  const lookupUrls = [
    `https://api.mindbodyonline.com/public/v6/client/clients?ClientIds=${encodeURIComponent(publicClientId)}&limit=1&CrossRegionalLookup=true`,
    `https://api.mindbodyonline.com/public/v6/client/clients?SearchText=${encodeURIComponent(publicClientId)}&limit=1&CrossRegionalLookup=true`,
    `https://api.mindbodyonline.com/public/v6/client/clients?ClientIds=${encodeURIComponent(publicClientId)}&limit=1`,
  ];

  const headers = {
    "Content-Type": "application/json",
    "Api-Key": apiKey,
    "SiteId": siteId,
    Authorization: `Bearer ${bearerToken}`,
  };

  for (const lookupUrl of lookupUrls) {
    try {
      const res = await fetch(lookupUrl, { method: "GET", headers });
      if (!res.ok) continue;
      const data = await res.json();
      const client = (data.Clients || [])[0];
      if (client?.Id != null) {
        return String(client.Id);
      }
    } catch {
      /* try next */
    }
  }

  return publicClientId;
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
