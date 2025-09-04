import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return new Response(null, {
        status: 302,
        headers: { 'Location': `${Deno.env.get('SUPABASE_URL').replace('supabase.co', 'lovableproject.com')}/?error=oauth_failed` }
      });
    }

    if (!code || !state) {
      throw new Error('Missing authorization code or state');
    }

    // Create Supabase admin client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.mindbodyonline.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: Deno.env.get('MINDBODY_CLIENT_ID') ?? '',
        client_secret: Deno.env.get('MINDBODY_CLIENT_SECRET') ?? '',
        code: code,
        redirect_uri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mb-oauth-callback`
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      throw new Error('Failed to exchange authorization code');
    }

    const tokenData = await tokenResponse.json();
    console.log('Token exchange successful for user:', state);

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

    // Store connection in database
    const { error: dbError } = await supabase
      .from('mb_connections')
      .upsert({
        user_id: state,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt.toISOString(),
        site_id: Deno.env.get('MINDBODY_SITE_ID') ?? ''
      }, {
        onConflict: 'user_id'
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to store connection');
    }

    // Redirect back to app with success
    return new Response(null, {
      status: 302,
      headers: { 'Location': `${Deno.env.get('SUPABASE_URL').replace('supabase.co', 'lovableproject.com')}/integrations?connected=true` }
    });

  } catch (error) {
    console.error('Error in mb-oauth-callback function:', error);
    return new Response(null, {
      status: 302,
      headers: { 'Location': `${Deno.env.get('SUPABASE_URL').replace('supabase.co', 'lovableproject.com')}/?error=oauth_failed` }
    });
  }
});