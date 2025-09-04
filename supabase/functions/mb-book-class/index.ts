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

    // Parse request body
    const { classId } = await req.json();
    if (!classId) {
      throw new Error('Class ID is required');
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

    // Get user's MINDBODY connection
    const { data: connection, error: connectionError } = await supabaseClient
      .from('mb_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (connectionError || !connection) {
      throw new Error('MINDBODY not connected');
    }

    // Check if token is still valid
    if (connection.expires_at && new Date(connection.expires_at) <= new Date()) {
      throw new Error('MINDBODY connection expired');
    }

    const apiKey = Deno.env.get('MINDBODY_API_KEY');
    const siteId = connection.site_id;

    if (!apiKey) {
      throw new Error('MINDBODY API key not configured');
    }

    // Get client ID from MINDBODY (this would normally be stored when user signs up)
    // For now, we'll use a placeholder - in a real implementation, you'd need to
    // either store the client ID when they connect or look it up via their email
    const clientId = 100; // This should be the actual MINDBODY client ID

    console.log('Booking class', classId, 'for user', user.id);

    // Book the class
    const bookingResponse = await fetch('https://api.mindbodyonline.com/public/v6/class/addclienttoclass', {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Authorization': connection.access_token,
        'SiteId': siteId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ClientId: clientId,
        ClassId: parseInt(classId),
        Test: false
      })
    });

    if (!bookingResponse.ok) {
      const errorText = await bookingResponse.text();
      console.error('Booking failed:', errorText);
      
      // Parse error response
      try {
        const errorData = JSON.parse(errorText);
        const errorMessage = errorData.Error?.Message || 'Failed to book class';
        throw new Error(errorMessage);
      } catch {
        throw new Error('Failed to book class - please try again');
      }
    }

    const bookingData = await bookingResponse.json();
    console.log('Booking successful:', bookingData);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Class booked successfully',
        bookingData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in mb-book-class function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});