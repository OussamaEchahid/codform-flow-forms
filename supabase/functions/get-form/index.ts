
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.18.0";

// Configure CORS headers for browser access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

serve(async (req: Request) => {
  // Generate request ID for tracking
  const requestId = crypto.randomUUID().substring(0, 8);
  console.log(`[${requestId}] Processing get-form request`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    let formId;
    
    // Try to get form ID from various sources for better compatibility
    try {
      // First try from request body as JSON
      const body = await req.json();
      formId = body?.id;
      console.log(`[${requestId}] Got form ID from JSON body: ${formId}`);
    } catch (jsonError) {
      // If JSON parsing fails, try from URL query parameters
      try {
        const url = new URL(req.url);
        formId = url.searchParams.get('id');
        console.log(`[${requestId}] Got form ID from URL params: ${formId}`);
      } catch (urlError) {
        console.error(`[${requestId}] Error parsing URL:`, urlError);
      }
    }
    
    if (!formId) {
      throw new Error('Form ID is required');
    }

    console.log(`[${requestId}] Retrieving form data for ID: ${formId}`);

    // Create Supabase client using the request's auth header or anon key
    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      authHeader ? '' : (Deno.env.get('SUPABASE_ANON_KEY') ?? ''),
      { 
        global: { 
          headers: authHeader ? { Authorization: authHeader } : {} 
        } 
      }
    );

    // Get form data with optimized query
    const { data: formData, error } = await supabaseClient
      .from('forms')
      .select('id, title, description, data, is_published, submitbuttontext, primaryColor, fontSize, borderRadius, buttonStyle, shop_id')
      .eq('id', formId)
      .maybeSingle();
      
    if (error) {
      console.error(`[${requestId}] Database error:`, error);
      throw new Error(`Error fetching form: ${error.message}`);
    }
    
    if (!formData) {
      console.warn(`[${requestId}] Form not found: ${formId}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Form not found', formId }),
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

    console.log(`[${requestId}] Successfully retrieved form data`);
    
    return new Response(
      JSON.stringify({ success: true, data: normalizedData, requestId }),
      { headers: { ...corsHeaders } }
    );
  } catch (error) {
    console.error(`[${requestId}] Error:`, error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error", 
        requestId,
        timestamp: new Date().toISOString()
      }),
      { status: 400, headers: { ...corsHeaders } }
    );
  }
});
