
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get query parameters
    const url = new URL(req.url);
    const shop = url.searchParams.get('shop');

    if (!shop) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: shop' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Fetching default form for shop ${shop}`);

    // Get the default form for this shop (most recently updated published form)
    const { data: defaultForms, error: defaultError } = await supabase
      .from('forms')
      .select('*')
      .eq('shop_id', shop)
      .eq('is_published', true)
      .order('updated_at', { ascending: false })
      .limit(1);
    
    if (defaultError) {
      console.error('Error fetching default form:', defaultError);
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve default form', details: defaultError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Return form data or error
    if (defaultForms && defaultForms.length > 0) {
      return new Response(
        JSON.stringify({ form: defaultForms[0] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } else {
      // No form found
      console.log('No default form found for this shop');
      return new Response(
        JSON.stringify({ message: 'No default form found for this shop' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
