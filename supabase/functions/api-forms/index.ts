import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.20.0'
import { corsHeaders } from '../_shared/cors.ts'

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

    // Get form ID from URL
    const url = new URL(req.url)
    const formId = url.pathname.split('/').pop()

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
      console.error(`Form with ID ${formId} not found`)
      throw new Error(`Form with ID ${formId} not found`)
    }

    // Ensure form is published
    if (!formData.is_published) {
      console.error(`Form with ID ${formId} is not published`)
      throw new Error(`Form with ID ${formId} is not published`)
    }

    console.log('Successfully fetched form:', formData.title, 'ID:', formId)

    // Transform form data to the expected format
    const transformedData = transformFormData(formData)
    
    // Return the form data
    return new Response(JSON.stringify(transformedData), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 200,
    })
  } catch (error) {
    console.error('Error getting form:', error.message)
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      status: 400,
    })
  }
})

// Function to transform form data into a structure that's easier to use in the frontend
function transformFormData(formData) {
  console.log('Transform function received data type:', typeof formData)
  
  // Check if form data exists
  if (!formData) {
    console.error('No form data provided to transform');
    return {
      id: 'unknown',
      title: 'Error',
      description: 'Form data not available',
      primaryColor: '#9b87f5',
      submitbuttontext: 'إرسال الطلب',
      submitButtonText: 'إرسال الطلب',
      fields: []
    }
  }
  
  // Initialize result with default values
  const result = {
    id: formData.id,
    title: formData.title,
    description: formData.description,
    primaryColor: formData.primary_color || '#9b87f5',
    // Include both versions of submit button text for compatibility
    submitbuttontext: formData.submitbuttontext || 'إرسال الطلب',
    submitButtonText: formData.submitbuttontext || 'إرسال الطلب',
    fields: []
  }
  
  // Check for data property in formData
  const dataField = formData.data
  
  if (!dataField) {
    console.error('Form data missing data property')
    return result
  }
  
  // Log raw data for debugging
  console.log('Raw form data structure:', JSON.stringify(dataField).substring(0, 500) + '...')
  
  let transformedFields = []
  
  // Handle different data structures
  if (Array.isArray(dataField)) {
    // This is likely a multi-step form
    console.log('Processing as multi-step form with', dataField.length, 'steps')
    
    dataField.forEach((step, stepIndex) => {
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
        console.log(`Processing ${step.fields.length} fields in step ${stepIndex}`)
        step.fields.forEach(field => {
          transformedFields.push({
            ...field,
            stepId: step.id,
            stepTitle: step.title,
            stepIndex: stepIndex
          })
        })
      } else {
        console.log(`No fields array found in step ${stepIndex}`)
      }
    })
  } else if (typeof dataField === 'object' && dataField.steps && Array.isArray(dataField.steps)) {
    // Handle nested steps format
    console.log('Processing nested steps format with', dataField.steps.length, 'steps')
    dataField.steps.forEach((step, stepIndex) => {
      transformedFields.push({
        id: step.id || `step-${stepIndex}`,
        type: 'step',
        label: step.title || `Step ${stepIndex + 1}`,
        stepIndex: stepIndex,
        isStep: true
      })
      
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
  } else if (typeof dataField === 'object') {
    // Handle flat object format
    console.log('Processing flat object format')
    
    // Try to extract fields from where they might be located
    const fieldsArray = dataField.fields || dataField.elements || [];
    
    if (Array.isArray(fieldsArray) && fieldsArray.length > 0) {
      transformedFields = fieldsArray.map(field => ({
        ...field,
        stepIndex: 0,
        stepTitle: 'Default Step'
      }))
    } else {
      console.error('Could not find fields array in form data structure')
    }
  }
  
  console.log(`Transform complete, found ${transformedFields.length} fields`)
  
  result.fields = transformedFields
  // Keep original data for advanced processing if needed
  result.data = dataField
  
  return result
}
