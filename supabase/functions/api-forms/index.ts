
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// CORS headers for cross-origin requests (needed for Shopify)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get form ID from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const formId = pathParts[pathParts.length - 1];

    console.log('Fetching form with ID:', formId);
    
    if (!formId || formId === 'api-forms') {
      return new Response(
        JSON.stringify({ error: 'Form ID is required' }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://mtyfuwdsshlzqwjujavp.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10eWZ1d2Rzc2hsenF3anVqYXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0OTYyNTksImV4cCI6MjA2MjA3MjI1OX0.hjwGefZdZFIrYCdcBJ0XWJVt6YWdBR6d77Rsq8F9Szg';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch form data from the database - only published forms
    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .eq('is_published', true)
      .single();
    
    if (error) {
      console.error('Error fetching form:', error);
      return new Response(
        JSON.stringify({ error: 'Error fetching form' }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (!data) {
      console.error('Form not found');
      return new Response(
        JSON.stringify({ error: 'Form not found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    console.log('Successfully fetched form:', data.title);

    // Return the form data with CORS headers
    return new Response(
      JSON.stringify(data),
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
