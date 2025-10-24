import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookableItemsRequest {
  sessionTypeIds: number[];
  startDate?: string;
  endDate?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionTypeIds, startDate, endDate }: BookableItemsRequest = await req.json();

    console.log('📅 Fetching bookable items:', { sessionTypeIds, startDate, endDate });

    // Get Mindbody staff token
    const tokenResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/mindbodyStaffToken`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: req.headers.get('Authorization') || '',
        },
        body: JSON.stringify({
          username: 'henry@xeniasocial.com',
          password: 'Loveablefix!',
          siteId: '5736189',
        }),
      }
    );

    if (!tokenResponse.ok) {
      throw new Error('Failed to get Mindbody token');
    }

    const { AccessToken } = await tokenResponse.json();
    const mindbodyToken = AccessToken.replace(/\s+/g, '');

    // Build query parameters
    let url = `https://api.mindbodyonline.com/public/v6/appointment/bookableitems?sessionTypeIds=${sessionTypeIds.join(',')}`;
    
    if (startDate) {
      url += `&startDate=${startDate}`;
    }
    if (endDate) {
      url += `&endDate=${endDate}`;
    }

    console.log('🌐 Calling Mindbody API:', url);

    // Fetch bookable items from Mindbody
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': 'f660fd3e-a0d6-4f66-878c-871c9860e565',
        'SiteId': '5736189',
        Authorization: mindbodyToken,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Mindbody API error:', errorText);
      throw new Error(`Mindbody API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Retrieved ${data.Availabilities?.length || 0} availabilities`);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
