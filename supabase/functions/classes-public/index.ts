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
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get current date/time for filtering
    const now = new Date();
    
    // Fetch classes from the next 7 days
    const { data: classes, error } = await supabase
      .from('mb_classes')
      .select('*')
      .gte('start_time', now.toISOString())
      .lte('start_time', new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString())
      .eq('is_cancelled', false)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching classes:', error);
      throw new Error('Failed to fetch classes');
    }

    // Transform data to match the expected format
    const transformedClasses = classes?.map(cls => ({
      id: cls.mb_class_id,
      name: cls.name,
      start_time: cls.start_time,
      end_time: cls.end_time,
      location_id: cls.location_id,
      location_name: cls.location_name,
      instructor: cls.instructor_name,
      description: cls.description,
      booking_available: cls.booking_available,
      is_cancelled: cls.is_cancelled,
      max_capacity: cls.max_capacity,
      current_bookings: cls.current_bookings
    })) || [];

    console.log('Fetched', transformedClasses.length, 'classes from database');

    return new Response(
      JSON.stringify({ 
        success: true,
        classes: transformedClasses
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in classes-public function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        classes: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});