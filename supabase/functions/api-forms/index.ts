
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.20.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

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
      throw error
    }

    if (!formData) {
      throw new Error(`Form with ID ${formId} not found`)
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
    
    return new Response(JSON.stringify({ error: error.message }), {
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
  
  if (!formData || !formData.data) {
    return {
      id: formData.id,
      title: formData.title,
      description: formData.description,
      primaryColor: formData.primary_color || '#9b87f5',
      submitbuttontext: formData.submitbuttontext || 'إرسال الطلب', // Add lowercase submitbuttontext
      fields: []
    }
  }

  const data = formData.data
  
  console.log('Form data array length:', Array.isArray(data) ? data.length : 'not an array')
  
  // Log a portion of the raw form data structure
  console.log('Raw form data structure:', JSON.stringify(data).substring(0, 500) + '...')
  
  // Check if form has steps
  const hasSteps = Array.isArray(data) && data.some(step => step.fields && Array.isArray(step.fields))
  console.log('Form has steps:', hasSteps)
  
  let transformedFields = []
  
  if (hasSteps) {
    // Process multi-step form
    console.log('Processing as multi-step form')
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
    console.log('Processing as single-step form with nested fields structure')
    let totalFields = 0
    
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
              stepId: step.id,
              stepTitle: step.title,
              stepIndex: stepIndex
            })
            totalFields++
          })
        }
      })
    }
    
    console.log('Total fields processed:', totalFields)
  }
  
  // Construct the final transformed data object with both camelCase and lowercase variants
  // to ensure compatibility with all components 
  return {
    id: formData.id,
    title: formData.title,
    description: formData.description,
    primaryColor: formData.primary_color || '#9b87f5',
    submitbuttontext: formData.submitbuttontext || 'إرسال الطلب', // Add lowercase from database
    submitButtonText: formData.submitbuttontext || 'إرسال الطلب', // Add camelCase for component compatibility
    fields: transformedFields,
    // Add any form-wide settings
    data: data // Keep the original data structure for advanced processing
  }
}
