
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: corsHeaders }
      );
    }

    // Parse the request body
    let requestData;
    try {
      requestData = await req.json();
    } catch (e) {
      console.error('Error parsing JSON:', e);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { formId, data } = requestData;
    
    console.log('Processing submission for form:', formId);
    console.log('Submission data:', JSON.stringify(data));
    
    if (!formId || !data) {
      console.error('Missing required fields:', { formId, hasData: !!data });
      return new Response(
        JSON.stringify({ error: 'Form ID and data are required' }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://mtyfuwdsshlzqwjujavp.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10eWZ1d2Rzc2hsenF3anVqYXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0OTYyNTksImV4cCI6MjA2MjA3MjI1OX0.hjwGefZdZFIrYCdcBJ0XWJVt6YWdBR6d77Rsq8F9Szg';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract Shopify-related information from submission data
    const shopDomain = data.shopDomain || null;
    const productId = data.productId || null;
    
    console.log('Shopify info:', { shopDomain, productId });
    
    // Save submission to the database
    const { data: submissionData, error } = await supabase
      .from('form_submissions')
      .insert({
        form_id: formId,
        data: data,
        shop_id: shopDomain,
        status: 'new'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving submission:', error);
      return new Response(
        JSON.stringify({ error: 'Error saving submission', details: error.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('Successfully saved submission:', submissionData.id);

    // Return success response with CORS headers
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Form submitted successfully', 
        submissionId: submissionData.id 
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Unexpected error:', error.message);
    return new Response(
      JSON.stringify({ error: `Unexpected error: ${error.message}` }),
      { status: 500, headers: corsHeaders }
    );
  }
});
