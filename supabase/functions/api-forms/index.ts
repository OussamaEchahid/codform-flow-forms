import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.20.0'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get important data from request for debugging
    const url = new URL(req.url)
    const formId = url.pathname.split('/').pop()
    const requestId = req.headers.get('X-Request-ID') || 'unknown'
    
    console.log(`[${requestId}] API-Forms: Request received for form ID: ${formId}`)
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(`[${requestId}] API-Forms: Missing Supabase credentials`)
      throw new Error('Missing Supabase credentials')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get form ID from URL
    if (!formId) {
      console.error(`[${requestId}] API-Forms: No form ID provided in URL`)
      throw new Error('No form ID provided')
    }

    console.log(`[${requestId}] API-Forms: Fetching form with ID: ${formId}`)

    // Get form from database
    const { data: formData, error } = await supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .maybeSingle()

    if (error) {
      console.error(`[${requestId}] API-Forms: Database error:`, error)
      throw error
    }

    if (!formData) {
      console.error(`[${requestId}] API-Forms: Form with ID ${formId} not found`)
      throw new Error(`Form with ID ${formId} not found`)
    }

    // Ensure form is published before returning
    if (!formData.is_published) {
      console.error(`[${requestId}] API-Forms: Form with ID ${formId} is not published`)
      
      // Force publish the form if it's not published
      const { error: updateError } = await supabase
        .from('forms')
        .update({ is_published: true })
        .eq('id', formId)
      
      if (updateError) {
        console.error(`[${requestId}] API-Forms: Error publishing form:`, updateError)
      } else {
        console.log(`[${requestId}] API-Forms: Auto-published form ${formId} for Shopify display`)
        formData.is_published = true
      }
    }

    console.log(`[${requestId}] API-Forms: Successfully fetched form: ${formData.title}, ID: ${formId}`)

    // Ensure formData is not null or undefined before transforming
    if (!formData) {
      throw new Error(`Form with ID ${formId} returned null data`)
    }
    
    // Transform form data to the expected format
    const transformedData = transformFormData(formData, requestId)
    
    console.log(`[${requestId}] API-Forms: Transformation complete, returning data`)
    
    // Return the form data with proper CORS headers and explicit JSON content type
    return new Response(JSON.stringify(transformedData), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Request-ID': requestId
      },
      status: 200,
    })
  } catch (error) {
    const requestId = req.headers.get('X-Request-ID') || 'unknown'
    console.error(`[${requestId}] API-Forms: Error getting form:`, error.message)
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Request-ID': requestId
      },
      status: 400,
    })
  }
})

// Function to transform form data into a structure that's easier to use in the frontend
function transformFormData(formData: any, requestId = 'unknown') {
  console.log(`[${requestId}] Transform function received data type:`, typeof formData)
  
  // Fail early with explicit error if no data
  if (!formData) {
    console.error(`[${requestId}] No form data provided to transform`);
    throw new Error('No form data provided to transform');
  }
  
  // Initialize result with default values
  const result: any = {
    id: formData.id || 'unknown',
    title: formData.title || 'Form',
    description: formData.description || '',
    primaryColor: formData.primary_color || formData.primaryColor || '#9b87f5',
    // Include both versions of submit button text for compatibility
    submitbuttontext: formData.submitbuttontext || 'إرسال الطلب',
    submitButtonText: formData.submitbuttontext || 'إرسال الطلب',
    is_published: formData.is_published || false,
    fields: []
  }
  
  console.log(`[${requestId}] Basic form info: ${result.title}, ID: ${result.id}, published: ${result.is_published}`)
  
  // Check for data property in formData
  const dataField = formData.data
  
  if (!dataField) {
    console.error(`[${requestId}] Form data missing data property`)
    // Return basic form structure rather than throwing an error
    // This makes the function more resilient
    return result
  }
  
  // Safe JSON stringify with clipping for large objects
  const safeStringify = (obj: any, maxLength = 500) => {
    try {
      const json = JSON.stringify(obj);
      return json.length > maxLength ? json.substring(0, maxLength) + '...' : json;
    } catch (e) {
      return '[Cannot stringify object]';
    }
  };
  
  // Log raw data for debugging
  console.log(`[${requestId}] Raw form data structure:`, safeStringify(dataField))
  
  let transformedFields = []
  
  // Handle different data structures
  if (Array.isArray(dataField)) {
    // This is likely a multi-step form
    console.log(`[${requestId}] Processing as multi-step form with ${dataField.length} steps`)
    
    dataField.forEach((step: any, stepIndex: number) => {
      if (!step) {
        console.warn(`[${requestId}] Step ${stepIndex} is undefined or null`);
        return;
      }
      
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
        console.log(`[${requestId}] Processing ${step.fields.length} fields in step ${stepIndex}`)
        step.fields.forEach((field: any) => {
          if (field) {
            transformedFields.push({
              ...field,
              stepId: step.id,
              stepTitle: step.title,
              stepIndex: stepIndex
            })
          }
        })
      } else {
        console.log(`[${requestId}] No fields array found in step ${stepIndex}`)
      }
    })
  } else if (typeof dataField === 'object' && dataField.steps && Array.isArray(dataField.steps)) {
    // Handle nested steps format
    console.log(`[${requestId}] Processing nested steps format with ${dataField.steps.length} steps`)
    dataField.steps.forEach((step: any, stepIndex: number) => {
      if (!step) {
        console.warn(`[${requestId}] Step ${stepIndex} is undefined or null`);
        return;
      }
      
      transformedFields.push({
        id: step.id || `step-${stepIndex}`,
        type: 'step',
        label: step.title || `Step ${stepIndex + 1}`,
        stepIndex: stepIndex,
        isStep: true
      })
      
      if (step.fields && Array.isArray(step.fields)) {
        step.fields.forEach((field: any) => {
          if (field) {
            transformedFields.push({
              ...field,
              stepId: step.id,
              stepTitle: step.title,
              stepIndex: stepIndex
            })
          }
        })
      }
    })
  } else if (typeof dataField === 'object') {
    // Handle flat object format
    console.log(`[${requestId}] Processing flat object format`)
    
    // Try to extract fields from where they might be located
    const fieldsArray = dataField.fields || dataField.elements || [];
    
    if (Array.isArray(fieldsArray) && fieldsArray.length > 0) {
      transformedFields = fieldsArray.map((field: any) => {
        if (!field) return null;
        
        return {
          ...field,
          stepIndex: 0,
          stepTitle: 'Default Step'
        };
      }).filter((field: any) => field !== null);
    } else {
      console.error(`[${requestId}] Could not find fields array in form data structure`)
    }
  }
  
  console.log(`[${requestId}] Transform complete, found ${transformedFields.length} fields`)
  
  result.fields = transformedFields
  // Keep original data for advanced processing if needed, but only if it's not too large
  try {
    const dataStr = JSON.stringify(dataField);
    // Only keep original data if it's not too large (avoid response size issues)
    if (dataStr.length < 100000) {
      result.data = dataField;
    } else {
      console.warn(`[${requestId}] Original data too large (${dataStr.length} chars), not including in response`);
      result.data = { note: "Original data too large, not included" };
    }
  } catch (e) {
    console.error(`[${requestId}] Error stringifying original data:`, e);
    result.data = { error: "Could not stringify original data" };
  }
  
  return result
}
