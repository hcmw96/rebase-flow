import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  id_token?: string;
}

interface IdTokenPayload {
  sub: string;
  email?: string;
  given_name?: string;
  family_name?: string;
}

interface StatePayload {
  csrf?: string;
  native?: boolean;
  origin?: string;
  returnTo?: string;
}

function decodeJwtPayload(token: string): IdTokenPayload {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT format");
  const payload = parts[1];
  const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(decoded);
}

function parseState(stateStr: string): StatePayload {
  try {
    const decoded = atob(stateStr);
    return JSON.parse(decoded);
  } catch {
    // Legacy state format (plain UUID)
    return { csrf: stateStr, native: false, origin: "" };
  }
}

/** Redirect browser (full page fallback) back to the app with session or error in the URL hash. */
function redirectToApp(origin: string, payload: { session?: Record<string, unknown>; error?: string }) {
  const hashKey = payload.error ? "auth-error" : "auth-session";
  const hashValue = encodeURIComponent(btoa(JSON.stringify(payload.error ? { error: payload.error } : payload.session)));
  return new Response(null, {
    status: 302,
    headers: { Location: `${origin}/#${hashKey}=${hashValue}` },
  });
}

function htmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderPopupBridgeHtml(
  payload: { session?: Record<string, unknown>; error?: string },
  origin?: string,
  returnTo?: string,
) {
  const callbackPayload = payload.error
    ? { type: "rebase-oauth-callback", error: payload.error }
    : { type: "rebase-oauth-callback", session: payload.session };
  const serializedPayload = JSON.stringify(callbackPayload);
  const fallbackHashKey = payload.error ? "auth-error" : "auth-session";
  const fallbackHashValue = encodeURIComponent(
    btoa(JSON.stringify(payload.error ? { error: payload.error } : payload.session)),
  );
  const safeReturnTo = returnTo && returnTo.startsWith("/") ? returnTo : "/";
  const fallbackLocation = origin ? `${origin}${safeReturnTo}#${fallbackHashKey}=${fallbackHashValue}` : "";
  const successText = payload.error ? "Authentication failed" : "Authentication successful";

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${htmlEscape(successText)}</title>
  </head>
  <body>
    <p>${htmlEscape(successText)}. You can close this window.</p>
    <script>
      (function () {
        const payload = ${serializedPayload};
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(payload, '*');
          window.close();
          return;
        }
        const fallback = ${JSON.stringify(fallbackLocation)};
        if (fallback) window.location.replace(fallback);
      })();
    </script>
  </body>
</html>`;
}

async function exchangeAndSaveSession(code: string, redirectUri: string) {
  const clientId = Deno.env.get("MINDBODY_OAUTH_CLIENT_ID");
  const clientSecret = Deno.env.get("MINDBODY_OAUTH_CLIENT_SECRET");
  const siteId = Deno.env.get("MINDBODY_SITE_ID");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!clientId || !clientSecret || !siteId || !supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing required configuration");
  }

  const tokenResponse = await fetch("https://signin.mindbodyonline.com/connect/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
      scope: "openid email profile offline_access Mindbody.Api.Public.v6",
      subscriberId: siteId,
    }).toString(),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error("Token exchange failed:", errorText);
    throw new Error(`Token exchange failed: ${tokenResponse.status}`);
  }

  const tokens: TokenResponse = await tokenResponse.json();
  console.log("Token exchange successful");

  let userInfo: IdTokenPayload = { sub: "" };
  if (tokens.id_token) {
    userInfo = decodeJwtPayload(tokens.id_token);
  }

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: session, error: sessionError } = await supabase
    .from("mb_sessions")
    .upsert(
      {
        mindbody_client_id: userInfo.sub,
        email: userInfo.email,
        first_name: userInfo.given_name,
        last_name: userInfo.family_name,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "mindbody_client_id" }
    )
    .select()
    .single();

  if (sessionError) {
    console.error("Session upsert error:", sessionError);
    throw new Error("Failed to save session");
  }

  return {
    sessionId: session.id,
    email: session.email,
    firstName: session.first_name,
    lastName: session.last_name,
    expiresAt: session.token_expires_at,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const redirectUri = `${supabaseUrl}/functions/v1/mindbody-oauth-callback`;
  let formPostOrigin: string | undefined;

  try {
    // Handle form_post from Mindbody OAuth (POST with form data)
    if (req.method === "POST") {
      const contentType = req.headers.get("content-type") || "";

      if (contentType.includes("application/x-www-form-urlencoded")) {
        // This is the Mindbody form_post callback
        const formData = await req.formData();
        const code = formData.get("code") as string;
        const error = formData.get("error") as string;
        const stateStr = (formData.get("state") as string) || "";
        const statePayload = parseState(stateStr);
        formPostOrigin = statePayload.origin;

        if (error) {
          console.error("OAuth error from Mindbody:", error);
          return new Response(
            renderPopupBridgeHtml({ error: String(error) }, statePayload.origin, statePayload.returnTo),
            { headers: { "Content-Type": "text/html" }, status: 200 }
          );
        }

        if (!code) {
          throw new Error("No authorization code received");
        }

        const sessionData = await exchangeAndSaveSession(code, redirectUri);

        return new Response(
          renderPopupBridgeHtml({ session: sessionData }, statePayload.origin, statePayload.returnTo),
          { headers: { "Content-Type": "text/html" }, status: 200 }
        );
      }

      // JSON POST (legacy client-side flow)
      const { code } = await req.json();
      if (!code) throw new Error("Missing code");
      const sessionData = await exchangeAndSaveSession(code, redirectUri);
      return new Response(JSON.stringify(sessionData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  } catch (error) {
    console.error("OAuth callback error:", error);
    const message = error instanceof Error ? error.message : String(error);

    if (formPostOrigin) {
      return new Response(
        renderPopupBridgeHtml({ error: message }, formPostOrigin),
        { headers: { "Content-Type": "text/html" }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
