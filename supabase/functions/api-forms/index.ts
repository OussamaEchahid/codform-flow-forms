
// This function fetches form data by ID for the store front
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request
    let formId;
    
    try {
      const body = await req.json();
      formId = body.id;
    } catch (e) {
      // If the request body is not valid JSON, try to get formId from URL
      const url = new URL(req.url);
      formId = url.searchParams.get('id');
    }

    if (!formId) {
      return new Response(
        JSON.stringify({ error: 'Form ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Fetching form with ID: ${formId}`);

    // Get the form data
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .eq('is_published', true)
      .single();

    if (formError || !form) {
      console.error('Error or no form found:', formError);
      return new Response(
        JSON.stringify({ error: 'Form not found or not published' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Make sure we include the floating button settings in the response
    const responseData = {
      ...form,
      floating_button: form.floating_button || { 
        enabled: true, // Default to true if missing
        text: 'Order Now',
        textColor: '#ffffff',
        backgroundColor: '#000000',
        borderRadius: '4px',
        showIcon: true,
        icon: 'shopping-cart'
      }
    };

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in api-forms function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
