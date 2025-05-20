
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// Add retry mechanism for database operations
async function queryWithRetry(queryFn, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error) {
      console.warn(`Database query attempt ${attempt + 1}/${maxRetries} failed:`, error);
      lastError = error;
      
      if (attempt < maxRetries - 1) {
        // Wait before retrying (with exponential backoff)
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }
  }
  
  throw lastError;
}

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 300000; // 5 minutes in milliseconds

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request for CORS preflight");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log request details for debugging
    const url = new URL(req.url);
    const shop = url.searchParams.get('shop');
    const skipCache = url.searchParams.get('skipCache') === 'true';
    const requestId = `req_${Math.random().toString(36).substring(2, 10)}`;
    
    console.log(`[${requestId}] Default form request received for shop: ${shop}`);
    console.log(`[${requestId}] Request headers:`, Object.fromEntries(req.headers.entries()));
    console.log(`[${requestId}] Full URL:`, req.url);

    if (!shop) {
      console.error(`[${requestId}] Missing required parameter: shop`);
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameter: shop',
          success: false,
          message: 'Shop parameter is required'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 400 
        }
      );
    }

    // Check cache first (unless skipCache is true)
    if (!skipCache) {
      const cacheKey = `default_form_${shop}`;
      const cachedData = cache.get(cacheKey);
      
      if (cachedData) {
        const { data, timestamp } = cachedData;
        const now = Date.now();
        
        // Return cached data if it's still fresh
        if (now - timestamp < CACHE_TTL) {
          console.log(`[${requestId}] Using cached data for shop ${shop}, age: ${(now - timestamp) / 1000}s`);
          
          return new Response(
            JSON.stringify({ 
              form: data,
              success: true,
              fromCache: true
            }),
            { 
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=300'
              }, 
              status: 200 
            }
          );
        } else {
          console.log(`[${requestId}] Cache expired for shop ${shop}, fetching fresh data`);
          cache.delete(cacheKey);
        }
      }
    }

    // Create Supabase client with PUBLIC ANON KEY - no auth needed for form retrieval
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      console.error(`[${requestId}] Missing Supabase configuration`);
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          success: false,
          message: 'Internal server configuration error'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[${requestId}] Fetching default form for shop ${shop}`);

    // Get the default form for this shop (most recently updated published form) with retry
    let defaultForms, defaultError;
    
    try {
      const queryResult = await queryWithRetry(async () => {
        return await supabase
          .from('forms')
          .select('*')
          .eq('shop_id', shop)
          .eq('is_published', true)
          .order('updated_at', { ascending: false })
          .limit(1);
      });
      
      defaultForms = queryResult.data;
      defaultError = queryResult.error;
    } catch (error) {
      console.error(`[${requestId}] Error after retries:`, error);
      defaultError = {
        message: error.message || 'Database query failed after multiple attempts',
        details: error.toString()
      };
    }
    
    if (defaultError) {
      console.error(`[${requestId}] Error fetching default form:`, defaultError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to retrieve default form', 
          details: defaultError,
          success: false,
          message: 'Database error occurred'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      );
    }

    // Return form data or error
    if (defaultForms && defaultForms.length > 0) {
      const formData = defaultForms[0];
      console.log(`[${requestId}] Default form found with ID: ${formData.id}`);
      
      // Store in cache
      cache.set(`default_form_${shop}`, {
        data: formData,
        timestamp: Date.now()
      });
      
      return new Response(
        JSON.stringify({ 
          form: formData,
          success: true
        }),
        { 
          headers: {
            ...corsHeaders,
            'Cache-Control': 'public, max-age=300',
            'Content-Type': 'application/json'
          }, 
          status: 200 
        }
      );
    } else {
      // No form found
      console.log(`[${requestId}] No default form found for shop: ${shop}`);
      
      // Cache this negative result too to avoid repeated lookups
      cache.set(`default_form_${shop}`, {
        data: null,
        timestamp: Date.now()
      });
      
      return new Response(
        JSON.stringify({ 
          message: 'No default form found for this shop',
          success: false
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        success: false,
        message: 'An unexpected error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});
