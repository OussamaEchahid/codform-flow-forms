
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
    
    // Log the raw form data for debugging
    console.log('Raw form data structure:', JSON.stringify(data.data).substring(0, 200) + '...');

    // Convert form data for the front-end
    const formFields = transformFormData(data.data);
    console.log(`Transformed ${formFields.length} fields for the form`);

    const formResponse = {
      id: data.id,
      title: data.title,
      description: data.description,
      fields: formFields,
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
    // Log incoming data structure for debugging
    console.log('Transform function received data type:', typeof formData);
    
    if (!formData) {
      console.error('Form data is null or undefined');
      return [];
    }
    
    if (!Array.isArray(formData)) {
      console.error('Form data is not an array:', formData);
      return [];
    }
    
    console.log('Form data array length:', formData.length);
    
    // Determine if this is a multi-step form
    const hasSteps = formData.some(item => item.type === 'step' || item.isStep);
    console.log('Form has steps:', hasSteps);
    
    let allFields: any[] = [];
    
    // Extract fields based on form structure
    if (hasSteps) {
      // Process multi-step form structure
      formData.forEach((step, stepIndex) => {
        console.log(`Processing step ${stepIndex + 1}: ${step.title || step.id}`);
        
        // Extract fields from the step
        if (step.fields && Array.isArray(step.fields)) {
          // Process each field in the step
          step.fields.forEach((field: any) => {
            // Preserve all original field properties in the response
            const transformedField = {
              id: field.id,
              type: field.type,
              label: field.label || field.title || '',
              required: field.required || false,
              placeholder: field.placeholder || '',
              helpText: field.helpText || field.description || '',
              options: field.options || [],
              checkboxLabel: field.checkboxLabel || '',
              style: field.style || {},  // Preserve styling information
              content: field.content || '',  // For HTML/text content fields
              stepId: step.id, // Keep track of which step this field belongs to
              stepTitle: step.title || `Step ${stepIndex + 1}`,
              stepIndex: stepIndex,
              // Preserve any other custom properties
              ...field
            };
            
            // Remove any properties that are already copied to avoid duplication
            delete transformedField.fields;
            
            allFields.push(transformedField);
          });
        } else {
          console.warn(`Step ${stepIndex + 1} has no fields or fields is not an array`);
        }
      });
    } else {
      // Process single-step form (direct array of fields)
      allFields = formData.map((field: any) => ({
        id: field.id,
        type: field.type,
        label: field.label || field.title || '',
        required: field.required || false,
        placeholder: field.placeholder || '',
        helpText: field.helpText || field.description || '',
        options: field.options || [],
        checkboxLabel: field.checkboxLabel || '',
        style: field.style || {},  // Preserve styling information
        content: field.content || '',  // For HTML/text content fields
        // Preserve any other custom properties
        ...field
      }));
    }
    
    console.log(`Transformed ${allFields.length} total fields`);
    
    // Log a sample of the transformed fields for debugging
    if (allFields.length > 0) {
      console.log('Sample transformed field:', JSON.stringify(allFields[0]));
    }
    
    return allFields;
  } catch (error) {
    console.error('Error transforming form data:', error);
    return [];
  }
}
