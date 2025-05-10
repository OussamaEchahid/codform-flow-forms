
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.20.0'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Using a try/catch to guarantee we always respond with JSON
  try {
    // Get important data from request for debugging
    const url = new URL(req.url)
    const formId = url.pathname.split('/').pop()
    const requestId = req.headers.get('X-Request-ID') || 'unknown'
    const noCache = url.searchParams.get('nocache') === 'true'
    
    console.log(`[${requestId}] API-Forms: Request received for form ID: ${formId}, noCache: ${noCache}`)
    
    // Explicitly set content type to JSON in all responses
    const responseHeaders = {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Request-ID': requestId
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(`[${requestId}] API-Forms: Missing Supabase credentials`)
      return new Response(JSON.stringify({ 
        error: 'Missing Supabase credentials',
        success: false 
      }), {
        headers: responseHeaders,
        status: 400,
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get form ID from URL
    if (!formId) {
      console.error(`[${requestId}] API-Forms: No form ID provided in URL`)
      return new Response(JSON.stringify({ 
        error: 'No form ID provided',
        success: false 
      }), {
        headers: responseHeaders,
        status: 400,
      })
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
      return new Response(JSON.stringify({ 
        error: error.message,
        success: false 
      }), {
        headers: responseHeaders,
        status: 400,
      })
    }

    if (!formData) {
      console.error(`[${requestId}] API-Forms: Form with ID ${formId} not found`)
      return new Response(JSON.stringify({ 
        error: `Form with ID ${formId} not found`,
        success: false 
      }), {
        headers: responseHeaders,
        status: 404,
      })
    }

    // Always ensure the form is published for display
    if (!formData.is_published) {
      console.log(`[${requestId}] API-Forms: Form with ID ${formId} is not published, auto-publishing`)
      
      // Force publish the form if it's not published
      const { error: updateError } = await supabase
        .from('forms')
        .update({ is_published: true })
        .eq('id', formId)
      
      if (updateError) {
        console.error(`[${requestId}] API-Forms: Error publishing form:`, updateError)
      } else {
        console.log(`[${requestId}] API-Forms: Auto-published form ${formId} for display`)
        formData.is_published = true
      }
    }

    // Just return the form data directly to minimize transformation errors
    return new Response(JSON.stringify({
      id: formData.id,
      title: formData.title || 'Form',
      description: formData.description || '',
      submitbuttontext: formData.submitbuttontext || 'إرسال الطلب',
      is_published: formData.is_published || false,
      data: formData.data || {},
      fields: formData.data?.fields || formData.data?.steps?.[0]?.fields || []
    }), {
      headers: responseHeaders,
      status: 200,
    })
    
  } catch (error) {
    const requestId = req.headers.get('X-Request-ID') || 'unknown'
    console.error(`[${requestId}] API-Forms: Critical error:`, error.message)
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error occurred',
      success: false
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Request-ID': requestId
      },
      status: 500,
    })
  }
})

// Function to transform form data has been removed to simplify the response and prevent errors
