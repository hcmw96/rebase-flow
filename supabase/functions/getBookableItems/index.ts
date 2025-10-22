import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionTypeIds, locationIds } = await req.json();
    
    if (!sessionTypeIds || !Array.isArray(sessionTypeIds)) {
      return new Response(
        JSON.stringify({ error: 'sessionTypeIds array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const siteId = Deno.env.get('MINDBODY_SITE_ID');
    const apiKey = Deno.env.get('MINDBODY_API_KEY');
    const username = Deno.env.get('MINDBODY_STAFF_USERNAME');
    const password = Deno.env.get('MINDBODY_STAFF_PASSWORD');

    if (!siteId || !apiKey || !username || !password) {
      console.error('❌ Missing Mindbody credentials');
      return new Response(
        JSON.stringify({ error: 'Mindbody credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔹 Fetching bookable items for session types:', sessionTypeIds);

    // Build URL with parameters to include pricing options
    const url = new URL('https://api.mindbodyonline.com/public/v6/appointment/bookableitems');
    url.searchParams.append('sessionTypeIds', sessionTypeIds.join(','));
    url.searchParams.append('includePricingOptions', 'true'); // Request pricing information
    
    if (locationIds && Array.isArray(locationIds)) {
      url.searchParams.append('locationIds', locationIds.join(','));
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
        'SiteId': siteId,
        'Authorization': `Basic ${btoa(`${username}:${password}`)}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Mindbody API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch bookable items',
          details: errorText,
          status: response.status 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('✅ Bookable items fetched successfully');
    console.log('📊 Pricing options available:', data.PricingOptions?.length || 0);

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in getBookableItems:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
