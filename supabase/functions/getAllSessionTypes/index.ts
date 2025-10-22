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
    const url = new URL(req.url);
    const name = url.searchParams.get('name');
    const id = url.searchParams.get('id');
    
    if (!name && !id) {
      return new Response(
        JSON.stringify({ error: 'Either name or id parameter is required' }),
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

    console.log('🔹 Fetching session types:', id ? `ID: ${id}` : `Name: ${name}`);

    // Build URL
    const apiUrl = new URL('https://api.mindbodyonline.com/public/v6/site/sessiontypes');
    if (id) {
      apiUrl.searchParams.append('SessionTypeIds', id);
    }

    const response = await fetch(apiUrl.toString(), {
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
          error: 'Failed to fetch session types',
          details: errorText,
          status: response.status 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // If searching by name, filter results
    if (name && data.SessionTypes && Array.isArray(data.SessionTypes)) {
      const normalizedSearch = name.toLowerCase().trim();
      const filtered = data.SessionTypes.filter((sessionType: any) => 
        sessionType.Name?.toLowerCase().includes(normalizedSearch) ||
        sessionType.Name?.toLowerCase() === normalizedSearch
      );
      
      console.log(`✅ Found ${filtered.length} session type(s) matching "${name}"`);
      
      // Return first match or null
      return new Response(
        JSON.stringify(filtered[0] || null),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If searching by ID, return first result
    if (id && data.SessionTypes && Array.isArray(data.SessionTypes) && data.SessionTypes.length > 0) {
      console.log(`✅ Found session type with ID ${id}`);
      return new Response(
        JSON.stringify(data.SessionTypes[0]),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('⚠️ No session types found');
    return new Response(
      JSON.stringify(null),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in getAllSessionTypes:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
