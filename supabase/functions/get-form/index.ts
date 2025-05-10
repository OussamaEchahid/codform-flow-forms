
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.18.0";

// Configure CORS headers for browser access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Get form ID from request body
    const body = await req.json();
    const formId = body?.id;
    
    if (!formId) {
      throw new Error('Form ID is required');
    }

    // Create Supabase client using the request's auth header
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get form data with optimized query
    const { data: formData, error } = await supabaseClient
      .from('forms')
      .select('id, title, description, data, is_published, submitbuttontext, primaryColor, fontSize, borderRadius, buttonStyle, shop_id')
      .eq('id', formId)
      .maybeSingle();
      
    if (error) {
      throw new Error(`Error fetching form: ${error.message}`);
    }
    
    if (!formData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Form not found' }),
        { status: 404, headers: { ...corsHeaders } }
      );
    }
    
    // Normalize the form data structure
    let normalizedData = formData;
    
    // Ensure data.fields exists and is an array
    if (!normalizedData.data) {
      normalizedData.data = { fields: [] };
    } else if (Array.isArray(normalizedData.data)) {
      normalizedData.data = { fields: normalizedData.data };
    } else if (!normalizedData.data.fields && !normalizedData.data.steps) {
      normalizedData.data.fields = [];
    }

    return new Response(
      JSON.stringify({ success: true, data: normalizedData }),
      { headers: { ...corsHeaders } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders } }
    );
  }
});
