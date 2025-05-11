
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.20.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
    if (authHeader) {
      // Format: Bearer <token>
      const token = authHeader.split(' ')[1]
      
      try {
        // Verify the token is a valid anon key
        // For this implementation, we just check if it starts with "eyJ" which is common for JWTs
        if (!token || !token.startsWith('eyJ')) {
          console.error('Invalid API key format provided')
          throw new Error('Invalid API key')
        }
      } catch (authError) {
        return new Response(JSON.stringify({ error: 'Unauthorized access - invalid API key' }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 401,
        })
      }
    }

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
      console.error('Form not found:', formId)
      throw new Error(`Form with ID ${formId} not found`)
    }

    // Verify the form is published
    if (formData.is_published !== true) {
      console.error('Form is not published:', formId)
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
  console.log('Transform function received data type:', typeof formData)
  
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
              stepId: step.id || `${stepIndex + 1}`,
              stepTitle: step.title || `Step ${stepIndex + 1}`,
              stepIndex: stepIndex
            })
            totalFields++
          })
        }
      })
    }
    
    console.log('Transformed', totalFields, 'total fields')
    
    // Log the first and second fields for debugging
    if (transformedFields.length > 0) {
      console.log('First field:', JSON.stringify(transformedFields[0]))
    }
    if (transformedFields.length > 1) {
      console.log('Second field:', JSON.stringify(transformedFields[1]))
    }
  }
  
  console.log('Transformed', transformedFields.length, 'fields for the form')
  
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
