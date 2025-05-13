
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.20.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

// Define the expected API key - make it consistent across functions
const VALID_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10eWZ1d2Rzc2hsenF3anVqYXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0OTYyNTksImV4cCI6MjA2MjA3MjI1OX0.hjwGefZdZFIrYCdcBJ0XWJVt6YWdBR6d77Rsq8F9Szg';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check API key if provided
    const authHeader = req.headers.get('Authorization')
    const apiKey = req.headers.get('X-API-Key');
    
    console.log('Request headers:', {
      hasAuthHeader: !!authHeader,
      hasApiKey: !!apiKey,
      authHeaderStart: authHeader ? authHeader.substring(0, 20) + '...' : 'none'
    });
    
    // Allow both Authorization header and X-API-Key header for backward compatibility
    let isAuthorized = false;
    let token = '';
    
    if (authHeader) {
      // Format: Bearer <token>
      token = authHeader.split(' ')[1] || authHeader;
      if (token === VALID_API_KEY) {
        isAuthorized = true;
      }
    }
    
    if (apiKey) {
      if (apiKey === VALID_API_KEY) {
        isAuthorized = true;
      }
    }
    
    // Debug authentication
    console.log('Authentication check:', {
      isAuthorized,
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
    });
    
    // Public access is allowed - we don't require API key for GET requests to form data
    // This lets the forms be loaded from any Shopify store
    const isPublicFormFetch = req.method === 'GET';
    
    // If API key was provided but is invalid, return an error
    if (token && !isAuthorized && !isPublicFormFetch) {
      console.error('Invalid API key provided:', token.substring(0, 10) + '...');
      return new Response(JSON.stringify({ error: 'Unauthorized access - invalid API key' }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 401,
      });
    }

    // Get form ID from URL
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/');
    const formId = pathParts[pathParts.length - 1];

    if (!formId) {
      throw new Error('No form ID provided')
    }

    console.log('Fetching form with ID:', formId)

    // Get form from database
    const { data: formData, error } = await supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .single()

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    if (!formData) {
      console.error('Form not found:', formId)
      throw new Error(`Form with ID ${formId} not found`)
    }

    // Verify the form is published
    if (formData.is_published !== true) {
      console.error('Form is not published:', formId)
      throw new Error(`Form with ID ${formId} is not published`)
    }

    console.log('Successfully fetched form:', formData.title, 'ID:', formId)

    // Transform form data to the expected format, optimizing for size
    const transformedData = transformFormData(formData)
    
    // Return the form data with proper caching headers
    return new Response(JSON.stringify(transformedData), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      },
      status: 200,
    })
  } catch (error) {
    console.error('Error getting form:', error.message)
    
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString(),
      path: new URL(req.url).pathname
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: error.message.includes('not found') ? 404 : 400,
    })
  }
})

// Function to transform form data into a structure that's easier to use in the frontend
function transformFormData(formData) {
  // Only log brief info in production to reduce function size
  if (Deno.env.get('SUPABASE_ENV') !== 'development') {
    console.log(`Transform function received form: ${formData.id}, title: ${formData.title}`);
  } else {
    console.log('Transform function received data type:', typeof formData);
  }
  
  if (!formData || !formData.data) {
    return {
      id: formData.id,
      title: formData.title,
      description: formData.description,
      primaryColor: formData.primary_color || '#9b87f5',
      fields: []
    }
  }

  const data = formData.data
  
  // In production environment, skip verbose logging
  if (Deno.env.get('SUPABASE_ENV') === 'development') {
    console.log('Form data array length:', Array.isArray(data) ? data.length : 'not an array');
    console.log('Raw form data structure:', JSON.stringify(data).substring(0, 500) + '...');
  }
  
  // Check if form has steps
  const hasSteps = Array.isArray(data) && data.some(step => step.fields && Array.isArray(step.fields))
  
  if (Deno.env.get('SUPABASE_ENV') === 'development') {
    console.log('Form has steps:', hasSteps);
  }
  
  let transformedFields = [];
  
  try {
    if (hasSteps) {
      // Process multi-step form
      if (Deno.env.get('SUPABASE_ENV') === 'development') {
        console.log('Processing as multi-step form');
      }
      
      data.forEach((step, stepIndex) => {
        // Add a step marker field
        transformedFields.push({
          id: step.id || `step-${stepIndex}`,
          type: 'step',
          label: step.title || `Step ${stepIndex + 1}`,
          stepIndex: stepIndex,
          isStep: true
        })
        
        // Process fields in this step
        if (step.fields && Array.isArray(step.fields)) {
          step.fields.forEach(field => {
            transformedFields.push({
              ...field,
              stepId: step.id,
              stepTitle: step.title,
              stepIndex: stepIndex
            })
          })
        }
      })
    } else {
      // Process single-step form with nested fields structure
      if (Deno.env.get('SUPABASE_ENV') === 'development') {
        console.log('Processing as single-step form with nested fields structure');
      }
      
      let totalFields = 0;
      
      if (Array.isArray(data) && data.length > 0) {
        data.forEach((step, stepIndex) => {
          // Add a step marker field
          transformedFields.push({
            id: step.id || `${stepIndex + 1}`,
            type: 'step',
            label: step.title || `Step ${stepIndex + 1}`,
            stepIndex: stepIndex,
            isStep: true
          })
          
          // Process fields in this step
          if (step.fields && Array.isArray(step.fields)) {
            step.fields.forEach(field => {
              transformedFields.push({
                ...field,
                stepId: step.id || `${stepIndex + 1}`,
                stepTitle: step.title || `Step ${stepIndex + 1}`,
                stepIndex: stepIndex
              })
              totalFields++;
            })
          }
        })
      }
      
      if (Deno.env.get('SUPABASE_ENV') === 'development') {
        console.log('Transformed', totalFields, 'total fields');
        
        // Log the first and second fields for debugging
        if (transformedFields.length > 0) {
          console.log('First field:', JSON.stringify(transformedFields[0]));
        }
        if (transformedFields.length > 1) {
          console.log('Second field:', JSON.stringify(transformedFields[1]));
        }
      }
    }
  } catch (error) {
    console.error('Error transforming form data:', error.message);
    // Return basic form data if transformation fails
    return {
      id: formData.id,
      title: formData.title,
      description: formData.description,
      primaryColor: formData.primary_color || '#9b87f5',
      error: 'Error transforming form data',
      fields: []
    };
  }
  
  if (Deno.env.get('SUPABASE_ENV') === 'development') {
    console.log('Transformed', transformedFields.length, 'fields for the form');
  } else {
    console.log(`Transformed ${transformedFields.length} fields for form: ${formData.id}`);
  }
  
  return {
    id: formData.id,
    title: formData.title,
    description: formData.description,
    primaryColor: formData.primary_color || '#9b87f5',
    borderRadius: formData.border_radius || '0.5rem',
    fontSize: formData.font_size || '1rem',
    buttonStyle: formData.button_style || 'rounded',
    fields: transformedFields
  }
}
