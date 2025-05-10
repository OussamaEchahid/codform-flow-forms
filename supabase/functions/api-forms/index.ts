
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

    // Get form from database with simplified error handling and retries
    let attempts = 0;
    const maxAttempts = 2;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`[${requestId}] API-Forms: Attempt ${attempts} of ${maxAttempts}`)
      
      try {
        const { data: formData, error } = await supabase
          .from('forms')
          .select('*')
          .eq('id', formId)
          .maybeSingle()

        if (error) {
          console.error(`[${requestId}] API-Forms: Database error:`, error)
          // On first attempt, retry once
          if (attempts < maxAttempts) {
            console.log(`[${requestId}] API-Forms: Retrying...`)
            continue
          }
          
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

        // Return a simplified response format
        return new Response(JSON.stringify({
          id: formData.id,
          title: formData.title || 'Form',
          description: formData.description || '',
          submitbuttontext: formData.submitbuttontext || 'إرسال الطلب',
          is_published: formData.is_published || false,
          data: formData.data || {},
          fields: formData.data?.fields || formData.data?.steps?.[0]?.fields || [],
          success: true
        }), {
          headers: responseHeaders,
          status: 200,
        })
      } catch (innerError) {
        console.error(`[${requestId}] API-Forms: Error in attempt ${attempts}:`, innerError)
        // Only continue to retry if we haven't reached max attempts
        if (attempts < maxAttempts) {
          console.log(`[${requestId}] API-Forms: Retrying after error...`)
          await new Promise(r => setTimeout(r, 500)) // Small delay before retry
          continue
        }
        
        // If we've reached max attempts, return the error
        console.error(`[${requestId}] API-Forms: Max attempts reached with errors`)
        return new Response(JSON.stringify({ 
          error: innerError.message || 'Error fetching form data',
          success: false 
        }), {
          headers: responseHeaders,
          status: 500,
        })
      }
    }
    
    // This should never be reached due to the return statements in the loop
    return new Response(JSON.stringify({ 
      error: 'Unexpected error in form fetching logic',
      success: false 
    }), {
      headers: responseHeaders,
      status: 500,
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
