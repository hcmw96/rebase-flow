import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Check if user has a valid MINDBODY connection
    const { data: connection, error: dbError } = await supabaseClient
      .from('mb_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (dbError && dbError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Database error:', dbError);
      throw new Error('Failed to check connection status');
    }

    const isConnected = connection && connection.access_token && 
      (!connection.expires_at || new Date(connection.expires_at) > new Date());

    console.log('Connection check for user:', user.id, 'Connected:', isConnected);

    return new Response(
      JSON.stringify({ 
        connected: !!isConnected,
        siteId: connection?.site_id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in mb-connected function:', error);
    return new Response(
      JSON.stringify({ 
        connected: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});