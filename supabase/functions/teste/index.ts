const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🔹 Mindbody OAuth callback received");

    // Parse form data from Mindbody's form_post response
    const formData = await req.formData();
    const code = formData.get('code') as string;
    const idToken = formData.get('id_token') as string;
    const state = formData.get('state') as string;

    console.log("✅ Received OAuth data:", { 
      hasCode: !!code, 
      hasIdToken: !!idToken,
      state 
    });

    if (!code || !idToken) {
      console.error("❌ Missing code or id_token");
      return new Response(
        `<html><body><h1>Error</h1><p>Missing OAuth data</p></body></html>`,
        { 
          status: 400, 
          headers: { 'Content-Type': 'text/html', ...corsHeaders } 
        }
      );
    }

    // Parse state to get the original full return URL if provided
    let redirectTarget = '/services';
    if (state) {
      try {
        const stateObj = JSON.parse(state);
        redirectTarget = stateObj.returnUrl || stateObj.from || '/services';
      } catch (e) {
        console.log("⚠️ Failed to parse state, using default path");
      }
    }

    // Build redirect URL (absolute if returnUrl provided)
    let redirectUrl: URL;
    try {
      if (typeof redirectTarget === 'string' && redirectTarget.startsWith('http')) {
        redirectUrl = new URL(redirectTarget);
      } else {
        redirectUrl = new URL(redirectTarget, req.url.split('/functions')[0]);
      }
    } catch (_e) {
      // Fallback
      redirectUrl = new URL('/services', req.url.split('/functions')[0]);
    }
    
    redirectUrl.searchParams.set('access_token', idToken);
    redirectUrl.searchParams.set('auth_code', code);
    redirectUrl.searchParams.set('id_token', idToken);

    console.log("🔄 Redirecting to:", redirectUrl.toString());

    // Redirect back to the booking page with tokens
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl.toString(),
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error("❌ Error in OAuth callback:", error);
    return new Response(
      `<html><body><h1>Error</h1><p>${error.message}</p></body></html>`,
      { 
        status: 500, 
        headers: { 'Content-Type': 'text/html', ...corsHeaders } 
      }
    );
  }
});
