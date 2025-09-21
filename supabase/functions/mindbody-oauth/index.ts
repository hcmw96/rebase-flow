import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MindbodyTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const url = new URL(req.url);
    let action = url.searchParams.get('action');
    
    // If no action in query params, check request body
    if (!action && req.method === 'POST') {
      try {
        const body = await req.json();
        action = body.action;
      } catch {
        // Ignore JSON parsing errors
      }
    }

    console.log('📝 Processing action:', action);

    if (action === 'initiate') {
      // Initiate OAuth flow - requires user ID from request body
      let userId;
      try {
        const body = await req.json();
        userId = body.userId;
      } catch {
        return new Response(JSON.stringify({ error: 'User ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const clientId = Deno.env.get('MINDBODY_OAUTH_CLIENT_ID');
      // Redirect back to the frontend app, not the function
      const appUrl = url.origin.includes('supabase.co') 
        ? url.origin.replace('supabase.co', 'lovableproject.com')
        : 'http://localhost:3000';
      const redirectUri = `${appUrl}/reception?oauth_callback=true`;
      
      const authUrl = new URL('https://api.mindbodyonline.com/public/v6/usertoken/issuetoken');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', clientId!);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', 'read write');
      authUrl.searchParams.set('state', userId); // Use user ID as state for validation

      console.log('🚀 Initiating OAuth flow for user:', userId);
      console.log('🔗 Auth URL:', authUrl.toString());
      console.log('📍 Redirect URI:', redirectUri);

      return new Response(JSON.stringify({ 
        authUrl: authUrl.toString(),
        redirectUri 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'callback') {
      // Handle OAuth callback - get code and state from request body (called from frontend)
      let code, state;
      try {
        const body = await req.json();
        code = body.code;
        state = body.state;
      } catch {
        return new Response(JSON.stringify({ error: 'Code and state required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify user authentication using state (user ID)
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      if (userError || !user) {
        console.error('Authentication required for callback');
        return new Response(JSON.stringify({ error: 'Authentication required' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const error = null; // No error parameter in this flow

      if (error) {
        console.error('❌ OAuth error:', error);
        return new Response(JSON.stringify({ error: `OAuth error: ${error}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!code || !state) {
        console.error('❌ Missing code or state parameter');
        return new Response(JSON.stringify({ error: 'Missing authorization code or state' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify state matches user ID
      if (state !== user.id) {
        console.error('❌ State mismatch. Expected:', user.id, 'Got:', state);
        return new Response(JSON.stringify({ error: 'Invalid state parameter' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Exchange code for access token
      const clientId = Deno.env.get('MINDBODY_OAUTH_CLIENT_ID');
      const clientSecret = Deno.env.get('MINDBODY_OAUTH_CLIENT_SECRET');
      // Use the same redirect URI that was used in initiate
      const appUrl = url.origin.includes('supabase.co') 
        ? url.origin.replace('supabase.co', 'lovableproject.com')
        : 'http://localhost:3000';
      const redirectUri = `${appUrl}/reception?oauth_callback=true`;

      console.log('🔄 Exchanging code for token...');

      const tokenResponse = await fetch('https://api.mindbodyonline.com/public/v6/usertoken/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Api-Key': Deno.env.get('MINDBODY_API_KEY')!,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId!,
          client_secret: clientSecret!,
          code: code,
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('❌ Token exchange failed:', tokenResponse.status, errorText);
        return new Response(JSON.stringify({ 
          error: 'Failed to exchange authorization code',
          details: errorText 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const tokenData: MindbodyTokenResponse = await tokenResponse.json();
      console.log('✅ Token exchange successful');

      // Calculate expiry date
      const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

      // Store tokens in database
      const { error: dbError } = await supabaseClient
        .from('mb_connections')
        .upsert({
          user_id: user.id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: expiresAt.toISOString(),
          site_id: Deno.env.get('MINDBODY_SITE_ID')!,
        }, {
          onConflict: 'user_id'
        });

      if (dbError) {
        console.error('❌ Database error:', dbError);
        return new Response(JSON.stringify({ error: 'Failed to store connection' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('✅ OAuth connection stored successfully');

      // Return success response (no redirect needed since this is called from frontend)
      return new Response(JSON.stringify({ 
        success: true,
        connection: {
          site_id: Deno.env.get('MINDBODY_SITE_ID')!,
          expires_at: expiresAt.toISOString()
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'refresh') {
      // Refresh access token
      const { data: connection } = await supabaseClient
        .from('mb_connections')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!connection?.refresh_token) {
        return new Response(JSON.stringify({ error: 'No refresh token available' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('🔄 Refreshing access token...');

      const refreshResponse = await fetch('https://api.mindbodyonline.com/public/v6/usertoken/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Api-Key': Deno.env.get('MINDBODY_API_KEY')!,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: Deno.env.get('MINDBODY_OAUTH_CLIENT_ID')!,
          client_secret: Deno.env.get('MINDBODY_OAUTH_CLIENT_SECRET')!,
          refresh_token: connection.refresh_token,
        }),
      });

      if (!refreshResponse.ok) {
        const errorText = await refreshResponse.text();
        console.error('❌ Token refresh failed:', refreshResponse.status, errorText);
        return new Response(JSON.stringify({ 
          error: 'Failed to refresh token',
          details: errorText 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const refreshData: MindbodyTokenResponse = await refreshResponse.json();
      const expiresAt = new Date(Date.now() + (refreshData.expires_in * 1000));

      // Update stored tokens
      const { error: updateError } = await supabaseClient
        .from('mb_connections')
        .update({
          access_token: refreshData.access_token,
          refresh_token: refreshData.refresh_token || connection.refresh_token,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('❌ Failed to update tokens:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to update tokens' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('✅ Token refreshed successfully');

      return new Response(JSON.stringify({ 
        success: true,
        expires_at: expiresAt.toISOString() 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      return new Response(JSON.stringify({ error: 'Invalid action parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});