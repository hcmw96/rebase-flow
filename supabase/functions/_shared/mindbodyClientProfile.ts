export interface NormalizedProfile {
  sub: string;
  email?: string;
  given_name?: string;
  family_name?: string;
}

export function normalizeIdTokenPayload(raw: Record<string, unknown>): NormalizedProfile {
  const sub = String(raw.sub ?? raw.client_id ?? raw.unique_name ?? "");
  const name = typeof raw.name === "string" ? raw.name : undefined;

  let given_name = raw.given_name ?? raw.givenName ?? raw.first_name ?? raw.FirstName;
  let family_name = raw.family_name ?? raw.familyName ?? raw.last_name ?? raw.LastName;

  if (!given_name && !family_name && name) {
    const parts = name.trim().split(/\s+/);
    given_name = parts[0];
    family_name = parts.slice(1).join(" ") || undefined;
  }

  return {
    sub,
    email: (raw.email ?? raw.Email) as string | undefined,
    given_name: given_name as string | undefined,
    family_name: family_name as string | undefined,
  };
}

export async function fetchOidcUserInfo(accessToken: string): Promise<NormalizedProfile | null> {
  try {
    const res = await fetch("https://signin.mindbodyonline.com/connect/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return normalizeIdTokenPayload(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function fetchMindbodyClientProfile(
  mindbodyClientId: string,
  accessToken: string,
  apiKey: string,
  siteId: string,
): Promise<{ email?: string; firstName?: string; lastName?: string } | null> {
  try {
    const res = await fetch(
      `https://api.mindbodyonline.com/public/v6/client/clients?ClientIds=${encodeURIComponent(mindbodyClientId)}`,
      {
        headers: {
          "Api-Key": apiKey,
          "SiteId": siteId,
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    if (!res.ok) {
      console.error("Mindbody client profile fetch failed:", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const client = data.Clients?.[0];
    if (!client) return null;
    return {
      email: client.Email,
      firstName: client.FirstName,
      lastName: client.LastName,
    };
  } catch (e) {
    console.error("Mindbody client profile error:", e);
    return null;
  }
}

export function mergeProfiles(
  base: NormalizedProfile,
  ...extras: Array<NormalizedProfile | { email?: string; firstName?: string; lastName?: string } | null>
): NormalizedProfile {
  const merged = { ...base };
  for (const extra of extras) {
    if (!extra) continue;
    if ("sub" in extra && extra.sub) merged.sub = extra.sub;
    const email = "email" in extra ? extra.email : undefined;
    const given = "given_name" in extra
      ? extra.given_name
      : "firstName" in extra
      ? extra.firstName
      : undefined;
    const family = "family_name" in extra
      ? extra.family_name
      : "lastName" in extra
      ? extra.lastName
      : undefined;
    if (email) merged.email = email;
    if (given) merged.given_name = given;
    if (family) merged.family_name = family;
  }
  return merged;
}
