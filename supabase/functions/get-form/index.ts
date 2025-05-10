
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.20.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Using a try/catch to guarantee we always respond with JSON
  try {
    const requestId = `req_${Math.random().toString(36).substring(2, 8)}`;
    
    // Get form ID from URL or request body
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    let formId = pathSegments[pathSegments.length - 1];
    
    // If formId not in path, try to get it from the request body or query params
    if (!formId || formId === 'get-form') {
      formId = url.searchParams.get('id') || '';
      
      // If still no formId, try to get from request body
      if (!formId && req.headers.get('content-type')?.includes('application/json')) {
        try {
          const body = await req.json();
          formId = body.id || '';
        } catch (e) {
          console.error(`[${requestId}] Error parsing JSON body:`, e);
        }
      }
    }
    
    console.log(`[${requestId}] Get-Form: Request received for form ID: ${formId}`);
    
    if (!formId) {
      console.error(`[${requestId}] Get-Form: No form ID provided`);
      return new Response(
        JSON.stringify({ 
          error: 'No form ID provided',
          success: false 
        }),
        {
          headers: { ...corsHeaders },
          status: 400
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(`[${requestId}] Get-Form: Missing Supabase credentials`);
      return new Response(
        JSON.stringify({ 
          error: 'Missing Supabase credentials',
          success: false 
        }),
        {
          headers: { ...corsHeaders },
          status: 400
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get form from database
    const { data: formData, error } = await supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .maybeSingle();

    if (error) {
      console.error(`[${requestId}] Get-Form: Database error:`, error);
      return new Response(
        JSON.stringify({ 
          error: error.message,
          success: false 
        }),
        {
          headers: { ...corsHeaders },
          status: 400
        }
      );
    }

    if (!formData) {
      console.error(`[${requestId}] Get-Form: Form with ID ${formId} not found`);
      return new Response(
        JSON.stringify({ 
          error: `Form with ID ${formId} not found`,
          success: false 
        }),
        {
          headers: { ...corsHeaders },
          status: 404
        }
      );
    }

    // Auto-publish the form if it's not already published
    if (!formData.is_published) {
      console.log(`[${requestId}] Get-Form: Form with ID ${formId} is not published, auto-publishing`);
      
      const { error: updateError } = await supabase
        .from('forms')
        .update({ is_published: true })
        .eq('id', formId);
      
      if (updateError) {
        console.error(`[${requestId}] Get-Form: Error publishing form:`, updateError);
      } else {
        console.log(`[${requestId}] Get-Form: Auto-published form ${formId} for display`);
        formData.is_published = true;
      }
    }

    // Return the form data in the expected format
    return new Response(
      JSON.stringify({
        id: formData.id,
        title: formData.title || 'Form',
        description: formData.description || '',
        submitbuttontext: formData.submitbuttontext || 'إرسال الطلب',
        is_published: formData.is_published || false,
        data: formData.data || {},
        fields: formData.data?.fields || formData.data?.steps?.[0]?.fields || [],
        success: true
      }),
      {
        headers: { ...corsHeaders },
        status: 200
      }
    );
  } catch (error) {
    console.error('Get-Form: Critical error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false
      }),
      {
        headers: { ...corsHeaders },
        status: 500
      }
    );
  }
})
