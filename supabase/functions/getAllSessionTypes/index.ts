import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const sessionTypeId = url.searchParams.get('id')
    const sessionTypeName = url.searchParams.get('name')

    if (!sessionTypeId && !sessionTypeName) {
      return new Response(
        JSON.stringify({ error: 'Either id or name parameter is required' }),
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

    // Fetch session types
    let mindbodyUrl = 'https://api.mindbodyonline.com/public/v6/site/sessiontypes'
    const params = new URLSearchParams()
    
    if (sessionTypeId) {
      params.append('SessionTypeIds', sessionTypeId)
    }
    
    if (params.toString()) {
      mindbodyUrl += `?${params.toString()}`
    }

    const response = await fetch(mindbodyUrl, {
      method: 'GET',
      headers: {
        'Api-Key': '90e551bb3b1e4ac198c8ba7dd4e5a0da',
        'SiteId': '5736189',
        'Authorization': AccessToken,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      return new Response(
        JSON.stringify({ error: 'Failed to fetch session types', details: error, status: response.status }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    
    // If searching by name, filter the results
    if (sessionTypeName && data.SessionTypes) {
      const filtered = data.SessionTypes.find(
        (st: any) => st.Name.toLowerCase() === sessionTypeName.toLowerCase()
      )
      return new Response(
        JSON.stringify(filtered || null),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // If searching by ID, return first result
    if (sessionTypeId && data.SessionTypes && data.SessionTypes.length > 0) {
      return new Response(
        JSON.stringify(data.SessionTypes[0]),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
