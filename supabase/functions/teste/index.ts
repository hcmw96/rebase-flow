import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🟢 Mindbody OAuth callback received');

    // Parse form data from Mindbody's form_post response
    const formData = await req.formData();
    const code = formData.get('code');
    const idToken = formData.get('id_token');
    const state = formData.get('state');

    console.log('📦 Received data:', { code: !!code, idToken: !!idToken, state });

    if (!code || !idToken) {
      throw new Error('Missing code or id_token from Mindbody');
    }

    // Store tokens in localStorage via redirect
    const redirectUrl = state || '/book-service';
    
    // Create HTML that stores tokens and redirects
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Redirecting...</title>
      </head>
      <body>
        <script>
          localStorage.setItem('access_token', '${idToken}');
          localStorage.setItem('auth_code', '${code}');
          window.location.href = '${redirectUrl}';
        </script>
        <p>Redirecting...</p>
      </body>
      </html>
    `;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('❌ Error in teste callback:', error);
    
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
      </head>
      <body>
        <h1>Authentication Error</h1>
        <p>${error.message}</p>
        <a href="/book-service">Return to booking</a>
      </body>
      </html>
    `;

    return new Response(errorHtml, {
      status: 500,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }
});
