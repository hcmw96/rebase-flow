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
    // Create Supabase admin client for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const siteId = Deno.env.get('MINDBODY_SITE_ID');
    const clientId = Deno.env.get('MINDBODY_CLIENT_ID');
    const apiKey = Deno.env.get('MINDBODY_API_KEY');
    const staffUsername = Deno.env.get('MINDBODY_STAFF_USERNAME');
    const staffPassword = Deno.env.get('MINDBODY_STAFF_PASSWORD');

    if (!siteId || !clientId || !apiKey || !staffUsername || !staffPassword) {
      throw new Error('MINDBODY credentials not configured');
    }

    // Authenticate with MINDBODY using staff credentials
    const authResponse = await fetch('https://api.mindbodyonline.com/public/v6/usertoken/issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey
      },
      body: JSON.stringify({
        Username: staffUsername,
        Password: staffPassword
      })
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('MINDBODY auth failed:', errorText);
      throw new Error('Failed to authenticate with MINDBODY');
    }

    const authData = await authResponse.json();
    const accessToken = authData.AccessToken;

    // Get classes for the next 7 days
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    const classesResponse = await fetch(`https://api.mindbodyonline.com/public/v6/class/classes?siteId=${siteId}&startDateTime=${startDate.toISOString()}&endDateTime=${endDate.toISOString()}`, {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
        'Authorization': accessToken,
        'SiteId': siteId
      }
    });

    if (!classesResponse.ok) {
      const errorText = await classesResponse.text();
      console.error('Failed to fetch classes:', errorText);
      throw new Error('Failed to fetch classes from MINDBODY');
    }

    const classesData = await classesResponse.json();
    const classes = classesData.Classes || [];

    console.log('Fetched', classes.length, 'classes from MINDBODY API');

    // Transform and upsert classes
    const classRecords = classes.map((cls: any) => ({
      mb_class_id: cls.Id.toString(),
      name: cls.ClassDescription?.Name || 'Unknown Class',
      start_time: cls.StartDateTime,
      end_time: cls.EndDateTime,
      location_id: cls.Location?.Id?.toString(),
      location_name: cls.Location?.Name,
      instructor_name: cls.Staff?.[0]?.Name,
      description: cls.ClassDescription?.Description,
      booking_available: !cls.IsCanceled,
      is_cancelled: cls.IsCanceled || false,
      max_capacity: cls.MaxCapacity || 0,
      current_bookings: cls.TotalBooked || 0
    }));

    // Clear existing classes and insert new ones
    const { error: deleteError } = await supabase
      .from('mb_classes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.error('Error clearing classes:', deleteError);
    }

    if (classRecords.length > 0) {
      const { error: insertError } = await supabase
        .from('mb_classes')
        .insert(classRecords);

      if (insertError) {
        console.error('Error inserting classes:', insertError);
        throw new Error('Failed to sync classes to database');
      }
    }

    console.log('Successfully synced', classRecords.length, 'classes to database');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Synced ${classRecords.length} classes`,
        count: classRecords.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in mb-sync-classes function:', error);
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