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
    const action = url.searchParams.get('action');

    if (action === 'initiate') {
      // Initiate OAuth flow - no auth required
      const clientId = Deno.env.get('MINDBODY_OAUTH_CLIENT_ID');
      const redirectUri = `${url.origin}/api/mindbody-oauth?action=callback`;
      
      const authUrl = new URL('https://api.mindbodyonline.com/public/v6/usertoken/issuetoken');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', clientId!);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', 'read write');
      authUrl.searchParams.set('state', Math.random().toString(36).substring(7)); // Random state for security

      console.log('🚀 Initiating OAuth flow');
      console.log('🔗 Auth URL:', authUrl.toString());

      return new Response(JSON.stringify({ 
        authUrl: authUrl.toString(),
        redirectUri 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'callback') {
      // Handle OAuth callback - requires auth context
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      if (userError || !user) {
        console.error('Authentication required for callback');
        return new Response(JSON.stringify({ error: 'Authentication required' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');

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
      const redirectUri = `${url.origin}/api/mindbody-oauth?action=callback`;

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

      // Redirect back to the app with success
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovableproject.com') || 'http://localhost:3000'}/reception?oauth=success`,
        },
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