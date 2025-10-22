const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { sessionTypeIds } = await req.json()

    if (!sessionTypeIds || !Array.isArray(sessionTypeIds)) {
      return new Response(
        JSON.stringify({ error: 'sessionTypeIds array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Mindbody staff token
    const tokenRes = await fetch('https://api.mindbodyonline.com/public/v6/usertoken/issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': '90e551bb3b1e4ac198c8ba7dd4e5a0da',
        'SiteId': '5736189',
      },
      body: JSON.stringify({
        Username: 'henry@xeniasocial.com',
        Password: 'Loveablefix!',
      }),
    })

    if (!tokenRes.ok) {
      const error = await tokenRes.text()
      return new Response(
        JSON.stringify({ error: 'Failed to get Mindbody token', details: error }),
        { status: tokenRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { AccessToken } = await tokenRes.json()

    // Fetch bookable items
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 90) // Next 90 days

    const params = new URLSearchParams({
      sessionTypeIds: sessionTypeIds.join(','),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      includePricingOptions: 'true',
      LocationIds: '1',
    })

    const response = await fetch(
      `https://api.mindbodyonline.com/public/v6/appointment/bookableitems?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Api-Key': '90e551bb3b1e4ac198c8ba7dd4e5a0da',
          'SiteId': '5736189',
          'Authorization': AccessToken,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      return new Response(
        JSON.stringify({ error: 'Failed to fetch bookable items', details: error }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
