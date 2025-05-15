
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request for CORS preflight");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log request details for debugging
    const url = new URL(req.url);
    const shop = url.searchParams.get('shop');
    const requestId = `req_${Math.random().toString(36).substring(2, 10)}`;
    
    console.log(`[${requestId}] Default form request received for shop: ${shop}`);
    console.log(`[${requestId}] Request headers:`, Object.fromEntries(req.headers.entries()));

    if (!shop) {
      console.error(`[${requestId}] Missing required parameter: shop`);
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: shop' }),
        { headers: corsHeaders, status: 400 }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      console.error(`[${requestId}] Missing Supabase configuration`);
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { headers: corsHeaders, status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[${requestId}] Fetching default form for shop ${shop}`);

    // Get the default form for this shop (most recently updated published form)
    const { data: defaultForms, error: defaultError } = await supabase
      .from('forms')
      .select('*')
      .eq('shop_id', shop)
      .eq('is_published', true)
      .order('updated_at', { ascending: false })
      .limit(1);
    
    if (defaultError) {
      console.error(`[${requestId}] Error fetching default form:`, defaultError);
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve default form', details: defaultError }),
        { headers: corsHeaders, status: 500 }
      );
    }

    // Return form data or error
    if (defaultForms && defaultForms.length > 0) {
      console.log(`[${requestId}] Default form found with ID: ${defaultForms[0].id}`);
      return new Response(
        JSON.stringify({ form: defaultForms[0] }),
        { headers: corsHeaders, status: 200 }
      );
    } else {
      // No form found
      console.log(`[${requestId}] No default form found for shop: ${shop}`);
      return new Response(
        JSON.stringify({ message: 'No default form found for this shop' }),
        { headers: corsHeaders, status: 404 }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: corsHeaders, status: 500 }
    );
  }
});
