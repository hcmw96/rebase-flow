export interface NormalizedProfile {
  sub: string;
  email?: string;
  given_name?: string;
  family_name?: string;
}

/**
 * Mindbody's IdP is IdentityServer, which does not always emit the standard
 * OIDC name claims — some tokens carry WS-Federation / ASP.NET claim URIs
 * instead, and the v6 client API answers in PascalCase. Read every spelling
 * we have seen rather than assuming `given_name`.
 */
const SUBJECT_KEYS = [
  "sub",
  "client_id",
  "unique_name",
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
];

const GIVEN_NAME_KEYS = [
  "given_name",
  "givenName",
  "givenname",
  "first_name",
  "firstName",
  "firstname",
  "FirstName",
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
];

const FAMILY_NAME_KEYS = [
  "family_name",
  "familyName",
  "familyname",
  "last_name",
  "lastName",
  "lastname",
  "LastName",
  "surname",
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname",
];

const FULL_NAME_KEYS = [
  "name",
  "Name",
  "full_name",
  "fullName",
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
];

const EMAIL_KEYS = [
  "email",
  "Email",
  "emailaddress",
  "email_address",
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
];

/** Username-shaped claims that are only usable as an email when they look like one. */
const USERNAME_KEYS = ["preferred_username", "upn", "unique_name"];

function firstClaim(raw: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return undefined;
}

export function normalizeIdTokenPayload(raw: Record<string, unknown>): NormalizedProfile {
  const sub = firstClaim(raw, SUBJECT_KEYS) ?? "";

  let given_name = firstClaim(raw, GIVEN_NAME_KEYS);
  let family_name = firstClaim(raw, FAMILY_NAME_KEYS);

  if (!given_name && !family_name) {
    const name = firstClaim(raw, FULL_NAME_KEYS);
    // IdentityServer often sets `name` to the login/email — that is not a person's name.
    if (name && !name.includes("@")) {
      const parts = name.split(/\s+/);
      given_name = parts[0];
      family_name = parts.slice(1).join(" ") || undefined;
    }
  }

  let email = firstClaim(raw, EMAIL_KEYS);
  if (!email) {
    const username = firstClaim(raw, USERNAME_KEYS);
    if (username?.includes("@")) email = username;
  }

  return { sub, email, given_name, family_name };
}

/** Raw /connect/userinfo claim set, so callers can log exactly what Mindbody returned. */
export async function fetchOidcUserInfoRaw(
  accessToken: string,
): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch("https://signin.mindbodyonline.com/connect/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      console.warn("Mindbody OIDC userinfo failed:", res.status, await res.text().catch(() => ""));
      return null;
    }
    return await res.json() as Record<string, unknown>;
  } catch (e) {
    console.warn("Mindbody OIDC userinfo error:", e);
    return null;
  }
}

export async function fetchOidcUserInfo(accessToken: string): Promise<NormalizedProfile | null> {
  const raw = await fetchOidcUserInfoRaw(accessToken);
  return raw ? normalizeIdTokenPayload(raw) : null;
}

export async function fetchMindbodyClientProfile(
  mindbodyClientId: string,
  accessToken: string,
  apiKey: string,
  siteId: string,
): Promise<{ email?: string; firstName?: string; lastName?: string } | null> {
  try {
    const res = await fetch(
      `https://api.mindbodyonline.com/public/v6/client/clients?UniqueIds=${encodeURIComponent(mindbodyClientId)}&limit=5&CrossRegionalLookup=true`,
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
