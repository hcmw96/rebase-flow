export interface MindbodySession {
  sessionId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  expiresAt: string;
}

export type OAuthReturnPayload =
  | { kind: 'session'; session: MindbodySession }
  | { kind: 'error'; error: string };

/** Decode session/error payload from OAuth redirect (query or hash). */
export function decodeOAuthPayload(encoded: string): unknown | null {
  try {
    const binary = atob(decodeURIComponent(encoded));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    try {
      return JSON.parse(atob(decodeURIComponent(encoded)));
    } catch {
      return null;
    }
  }
}

function readEncodedParam(key: 'auth-session' | 'auth-error'): string | null {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get(key);
  if (fromQuery) return fromQuery;

  const hash = window.location.hash;
  const marker = `#${key}=`;
  if (!hash.includes(marker)) return null;
  return hash.split(marker)[1]?.split('&')[0] ?? null;
}

function toMindbodySession(data: Record<string, unknown>): MindbodySession | null {
  if (typeof data.sessionId !== 'string' || !data.sessionId) return null;
  if (typeof data.expiresAt !== 'string' || !data.expiresAt) return null;
  return {
    sessionId: data.sessionId,
    email: (data.email as string | null | undefined) ?? null,
    firstName: (data.firstName as string | null | undefined) ?? null,
    lastName: (data.lastName as string | null | undefined) ?? null,
    expiresAt: data.expiresAt,
  };
}

/** Read Mindbody OAuth result from URL (query preferred; hash for legacy redirects). */
export function readOAuthReturnFromUrl(): OAuthReturnPayload | null {
  const errorRaw = readEncodedParam('auth-error');
  if (errorRaw) {
    const decoded = decodeOAuthPayload(errorRaw) as { error?: string } | null;
    if (decoded?.error) return { kind: 'error', error: decoded.error };
  }

  const sessionRaw = readEncodedParam('auth-session');
  if (!sessionRaw) return null;

  const decoded = decodeOAuthPayload(sessionRaw);
  if (!decoded || typeof decoded !== 'object') return null;

  const session = toMindbodySession(decoded as Record<string, unknown>);
  if (!session) return null;
  return { kind: 'session', session };
}

/** Strip OAuth params from the address bar after they have been consumed. */
export function clearOAuthParamsFromUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('auth-session');
  url.searchParams.delete('auth-error');
  url.hash = '';
  const clean = `${url.pathname}${url.search}`;
  window.history.replaceState(null, '', clean || '/');
}
