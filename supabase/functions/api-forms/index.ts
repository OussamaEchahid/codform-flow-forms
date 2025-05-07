
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get form ID from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    let formId = pathParts[pathParts.length - 1];
    
    // Handle direct requests to the edge function or different path formats
    if (formId === 'api-forms' || formId === '') {
      // Check if there's an ID query parameter
      const idParam = url.searchParams.get('id');
      if (idParam) {
        formId = idParam;
      } else {
        return new Response(
          JSON.stringify({ error: 'Form ID is required' }),
          { status: 400, headers: corsHeaders }
        );
      }
    }
    
    console.log('Fetching form with ID:', formId);
    
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
      console.error(`Form not found with ID: ${formId}`);
      return new Response(
        JSON.stringify({ error: 'Form not found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    console.log(`Successfully fetched form: ${data.title}, ID: ${data.id}`);

    // Convert form data for the front-end
    const formResponse = {
      id: data.id,
      title: data.title,
      description: data.description,
      fields: transformFormData(data.data),
      is_published: data.is_published,
      created_at: data.created_at,
      updated_at: data.updated_at
    };

    // Return the form data with CORS headers
    return new Response(
      JSON.stringify(formResponse),
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

// Transform complex form data into a simplified format for the Shopify extension
function transformFormData(formData: any) {
  try {
    // If data is not an array (could be steps or direct fields), handle accordingly
    if (!formData || !Array.isArray(formData)) {
      console.error('Form data is not in expected format');
      return [];
    }
    
    // Extract fields from steps or use direct fields
    let fields = [];
    
    // Check if this is a multi-step form
    const hasSteps = formData.some(item => item.type === 'step' || item.isStep);
    
    if (hasSteps) {
      // For multi-step forms, extract fields from all steps
      formData.forEach(step => {
        if (step.fields && Array.isArray(step.fields)) {
          fields = fields.concat(step.fields);
        }
      });
    } else {
      // For single-step forms, use the array directly
      fields = formData;
    }
    
    // Transform fields to a simplified format
    return fields.map(field => ({
      id: field.id,
      type: field.type,
      label: field.label || field.title || '',
      required: field.required || false,
      placeholder: field.placeholder || '',
      helpText: field.helpText || field.description || '',
      options: field.options || [],
      checkboxLabel: field.checkboxLabel || ''
    }));
  } catch (error) {
    console.error('Error transforming form data:', error);
    return [];
  }
}
