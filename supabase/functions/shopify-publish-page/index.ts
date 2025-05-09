
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestPayload {
  pageId: string;
  pageSlug: string;
  productId: string;
  shop: string;
  accessToken: string;
  requestId?: string;
  timestamp?: number;
  forceMetaobjectCreation?: boolean;
  fallbackOnly?: boolean;
  debugMode?: boolean;
  ignoreMetaobjectErrors?: boolean;
  bypassConnectionCheck?: boolean;  // Added to bypass connection checking
  maxRetries?: number;  // Allow configuring the number of retries
}

interface MetaobjectDefinition {
  id: string;
  handle: string;
  displayName: string;
}

// Helper to add retries for fetch requests with better error handling
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3, requestId = "unknown"): Promise<Response> {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Exponential backoff
      if (attempt > 0) {
        const delay = Math.min(100 * Math.pow(2, attempt), 2000);
        console.log(`[${requestId}] Retry attempt ${attempt + 1}/${maxRetries}, waiting ${delay}ms before retry`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      // Add request timeout to avoid hanging forever
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const fetchOptions = {
        ...options,
        signal: controller.signal
      };
      
      try {
        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);
        
        // Retry on server errors (5xx)
        if (response.status >= 500 && response.status < 600 && attempt < maxRetries - 1) {
          console.log(`[${requestId}] Server error: ${response.status}, will retry`);
          continue;
        }
        
        return response;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError; // Re-throw to be caught by outer try/catch
      }
    } catch (error) {
      console.error(`[${requestId}] Fetch attempt ${attempt + 1} failed:`, error);
      lastError = error;
      
      // Only retry on network errors or timeouts
      if (error.name !== 'TypeError' && error.name !== 'NetworkError' && error.name !== 'AbortError') {
        throw error;
      }
    }
  }
  
  throw lastError || new Error(`All fetch attempts failed for ${url}`);
}

// Try REST API fallback for metafield creation
async function tryRestApiFallback(
  shop: string,
  accessToken: string,
  productId: string,
  pageContent: any,
  pageSlug: string,
  requestId: string,
  maxRetries = 3
): Promise<boolean> {
  try {
    console.log(`[${requestId}] Attempting REST API fallback for metafield creation`);
    
    // Extract product ID numeric part
    const idParts = productId.split('/');
    const numericProductId = idParts[idParts.length - 1];
    
    // Create a metafield with the landing page URL
    const landingPageUrl = `https://${shop}/pages/${pageSlug}`;
    
    const metafieldData = {
      metafield: {
        namespace: "codform",
        key: "landing_page",
        value: landingPageUrl,
        type: "url"
      }
    };
    
    try {
      const response = await fetchWithRetry(
        `https://${shop}/admin/api/2023-10/products/${numericProductId}/metafields.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken,
            "Cache-Control": "no-cache, no-store"
          },
          body: JSON.stringify(metafieldData)
        },
        maxRetries,
        requestId
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[${requestId}] Failed to create metafield:`, errorText);
        return false;
      }
      
      console.log(`[${requestId}] Successfully created metafield as fallback`);
      return true;
    } catch (error) {
      console.error(`[${requestId}] Network error in REST API fallback:`, error);
      
      // Try a different approach for metafields
      try {
        console.log(`[${requestId}] Attempting alternative metafield creation method`);
        
        // Alternative approach using different endpoint
        const alternativeResponse = await fetchWithRetry(
          `https://${shop}/admin/api/2023-10/metafields.json`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": accessToken,
              "Cache-Control": "no-cache, no-store"
            },
            body: JSON.stringify({
              metafield: {
                namespace: "codform",
                key: "landing_page_" + numericProductId,
                value: landingPageUrl,
                owner_id: numericProductId,
                owner_resource: "product",
                type: "url"
              }
            })
          },
          2,
          requestId
        );
        
        if (!alternativeResponse.ok) {
          console.error(`[${requestId}] Alternative metafield creation failed:`, await alternativeResponse.text());
          return false;
        }
        
        console.log(`[${requestId}] Successfully created metafield with alternative method`);
        return true;
      } catch (altError) {
        console.error(`[${requestId}] Alternative metafield approach also failed:`, altError);
        return false;
      }
    }
  } catch (error) {
    console.error(`[${requestId}] Error in REST API fallback:`, error);
    return false;
  }
}

// Try creating a metaobject via GraphQL
async function tryCreateMetaobject(
  shop: string, 
  accessToken: string, 
  pageSlug: string,
  pageTitle: string,
  pageContent: any,
  forceMetaobjectCreation: boolean = false,
  requestId: string,
  maxRetries = 3
): Promise<{success: boolean, metaobjectId?: string, metaobjectHandle?: string, errors?: any[]}> {
  console.log(`[${requestId}] Checking for existing metaobject definition`);
  
  try {
    // First check if the metaobject definition exists
    const metaobjectDefinitionQuery = `
      query {
        metaobjectDefinitions(first: 10) {
          edges {
            node {
              id
              name
              type
              fieldDefinitions {
                name
                type {
                  name
                }
              }
            }
          }
        }
      }
    `;
    
    let definitionsResponse;
    try {
      definitionsResponse = await fetchWithRetry(`https://${shop}/admin/api/2023-10/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
          'Cache-Control': 'no-cache, no-store'
        },
        body: JSON.stringify({
          query: metaobjectDefinitionQuery
        }),
      }, maxRetries, requestId);
    } catch (fetchError) {
      console.error(`[${requestId}] Network error fetching metaobject definitions:`, fetchError);
      return { 
        success: false, 
        errors: [{ 
          message: "Network error fetching metaobject definitions", 
          type: "network_error",
          details: fetchError
        }]
      };
    }
    
    if (!definitionsResponse.ok) {
      console.error(`[${requestId}] GraphQL query for metaobject definitions failed: ${definitionsResponse.status}`);
      let errorText = "Unknown error";
      try {
        errorText = await definitionsResponse.text();
      } catch (e) {
        console.error(`[${requestId}] Failed to read error response text:`, e);
      }
      console.error(`[${requestId}] Error details:`, errorText);
      return { 
        success: false, 
        errors: [{ message: `GraphQL query failed with status ${definitionsResponse.status}`, details: errorText }]
      };
    }
    
    let definitionsData;
    try {
      definitionsData = await definitionsResponse.json();
      console.log(`[${requestId}] Metaobject definitions response:`, JSON.stringify(definitionsData));
    } catch (jsonError) {
      console.error(`[${requestId}] Failed to parse JSON response:`, jsonError);
      return { 
        success: false, 
        errors: [{ message: "Failed to parse metaobject definitions response", details: jsonError }]
      };
    }
    
    // Check for permission errors
    if (definitionsData.errors) {
      const permissionError = definitionsData.errors.find((e: any) => 
        e.message && (
          e.message.includes("Access denied") || 
          e.message.includes("access scope") || 
          e.message.includes("write_metaobject_definitions")
        )
      );
      
      if (permissionError) {
        console.error(`[${requestId}] Permission error:`, permissionError);
        return {
          success: false,
          errors: [{ 
            message: "Missing required permissions: write_metaobject_definitions",
            type: "permission",
            details: permissionError
          }]
        };
      }
      
      return { 
        success: false,
        errors: definitionsData.errors
      };
    }
    
    // Handle missing metaobject definitions data
    if (!definitionsData.data || !definitionsData.data.metaobjectDefinitions) {
      console.error(`[${requestId}] No metaobjectDefinitions data returned from GraphQL`);
      return { 
        success: false,
        errors: [{ message: "No metaobject definitions data returned" }]
      };
    }
    
    // Look for a landing page definition
    let landingPageDefinition: MetaobjectDefinition | null = null;
    
    if (definitionsData.data.metaobjectDefinitions.edges) {
      const definitions = definitionsData.data.metaobjectDefinitions.edges;
      for (const edge of definitions) {
        if (edge.node.type === "landing_page" || edge.node.name.toLowerCase().includes("landing")) {
          landingPageDefinition = {
            id: edge.node.id,
            handle: edge.node.type,
            displayName: edge.node.name
          };
          break;
        }
      }
    }
    
    // Create a new metaobject definition if needed
    if (!landingPageDefinition && forceMetaobjectCreation) {
      console.log(`[${requestId}] Creating new metaobject definition for landing pages`);
      
      const createDefinitionMutation = `
        mutation metaobjectDefinitionCreate($definition: MetaobjectDefinitionInput!) {
          metaobjectDefinitionCreate(definition: $definition) {
            metaobjectDefinition {
              id
              type
            }
            userErrors {
              field
              message
            }
          }
        }
      `;
      
      const definitionInput = {
        definition: {
          name: "Landing Pages",
          type: "landing_page",
          fieldDefinitions: [
            {
              name: "title",
              type: "single_line_text_field",
              required: true
            },
            {
              name: "url",
              type: "url",
              required: true
            },
            {
              name: "description",
              type: "multi_line_text_field",
              required: false
            }
          ]
        }
      };
      
      let createDefinitionResponse;
      try {
        createDefinitionResponse = await fetchWithRetry(`https://${shop}/admin/api/2023-10/graphql.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken,
            'Cache-Control': 'no-cache, no-store'
          },
          body: JSON.stringify({
            query: createDefinitionMutation,
            variables: definitionInput
          }),
        }, 2, requestId);
      } catch (fetchError) {
        console.error(`[${requestId}] Network error creating metaobject definition:`, fetchError);
        return { 
          success: false, 
          errors: [{ 
            message: "Network error creating metaobject definition", 
            type: "network_error",
            details: fetchError
          }]
        };
      }
      
      if (!createDefinitionResponse.ok) {
        console.error(`[${requestId}] Failed to create metaobject definition: ${createDefinitionResponse.status}`);
        let errorText = "Unknown error";
        try {
          errorText = await createDefinitionResponse.text();
        } catch (e) {
          console.error(`[${requestId}] Failed to read error response text:`, e);
        }
        console.error(`[${requestId}] Error details:`, errorText);
        return { 
          success: false,
          errors: [{ message: `Failed to create metaobject definition: ${errorText}` }]
        };
      }
      
      let createDefinitionResult;
      try {
        createDefinitionResult = await createDefinitionResponse.json();
        console.log(`[${requestId}] Metaobject definition creation response:`, JSON.stringify(createDefinitionResult));
      } catch (jsonError) {
        console.error(`[${requestId}] Failed to parse definition creation response:`, jsonError);
        return { 
          success: false, 
          errors: [{ message: "Failed to parse definition creation response", details: jsonError }]
        };
      }
      
      // Check for permission errors
      if (createDefinitionResult.errors) {
        const permissionError = createDefinitionResult.errors.find((e: any) => 
          e.message && (
            e.message.includes("Access denied") || 
            e.message.includes("write_metaobject_definitions") ||
            e.message.includes("access scope")
          )
        );
        
        if (permissionError) {
          console.error(`[${requestId}] Permission error in definition creation:`, permissionError);
          return {
            success: false,
            errors: [{ 
              message: "Missing required permissions: write_metaobject_definitions",
              type: "permission",
              details: permissionError
            }]
          };
        }
      }
      
      if (createDefinitionResult.data?.metaobjectDefinitionCreate?.userErrors?.length > 0) {
        console.error(`[${requestId}] User errors in definition creation:`, createDefinitionResult.data.metaobjectDefinitionCreate.userErrors);
        return { 
          success: false,
          errors: createDefinitionResult.data.metaobjectDefinitionCreate.userErrors
        };
      }
      
      if (!createDefinitionResult.data?.metaobjectDefinitionCreate?.metaobjectDefinition?.id) {
        console.error(`[${requestId}] Failed to get definition ID from creation response`);
        return { 
          success: false,
          errors: [{ message: "Failed to get metaobject definition ID" }]
        };
      }
      
      landingPageDefinition = {
        id: createDefinitionResult.data.metaobjectDefinitionCreate.metaobjectDefinition.id,
        handle: "landing_page",
        displayName: "Landing Pages"
      };
      
      console.log(`[${requestId}] Successfully created metaobject definition:`, landingPageDefinition);
    }
    
    // If we still don't have a metaobject definition, return early
    if (!landingPageDefinition) {
      console.error(`[${requestId}] Failed to find or create metaobject definition for landing pages`);
      return { 
        success: false,
        errors: [{ 
          message: "Failed to find or create metaobject definition for landing pages",
          type: "definition_missing"
        }]
      };
    }
    
    // Create a metaobject for the landing page
    console.log(`[${requestId}] Creating metaobject for landing page using definition:`, landingPageDefinition);
    
    const landingPageUrl = `https://${shop}/pages/${pageSlug}`;
    
    const createMetaobjectMutation = `
      mutation metaobjectCreate($metaobject: MetaobjectCreateInput!) {
        metaobjectCreate(metaobject: $metaobject) {
          metaobject {
            id
            handle
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
    
    const metaobjectInput = {
      metaobject: {
        type: landingPageDefinition.handle,
        fields: [
          {
            key: "title",
            value: pageTitle
          },
          {
            key: "url",
            value: landingPageUrl
          },
          {
            key: "description",
            value: "صفحة معلومات للمنتج من تطبيق COD Forms"
          }
        ]
      }
    };
    
    let createMetaobjectResponse;
    try {
      createMetaobjectResponse = await fetchWithRetry(`https://${shop}/admin/api/2023-10/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
          'Cache-Control': 'no-cache, no-store'
        },
        body: JSON.stringify({
          query: createMetaobjectMutation,
          variables: metaobjectInput
        }),
      }, maxRetries, requestId);
    } catch (fetchError) {
      console.error(`[${requestId}] Network error creating metaobject:`, fetchError);
      return { 
        success: false, 
        errors: [{ 
          message: "Network error creating metaobject", 
          type: "network_error",
          details: fetchError
        }]
      };
    }
    
    if (!createMetaobjectResponse.ok) {
      console.error(`[${requestId}] Failed to create metaobject: ${createMetaobjectResponse.status}`);
      let errorText = "Unknown error";
      try {
        errorText = await createMetaobjectResponse.text();
      } catch (e) {
        console.error(`[${requestId}] Failed to read error response text:`, e);
      }
      console.error(`[${requestId}] Error details:`, errorText);
      return { 
        success: false,
        errors: [{ message: `Failed to create metaobject: ${errorText}` }]
      };
    }
    
    let createMetaobjectResult;
    try {
      createMetaobjectResult = await createMetaobjectResponse.json();
      console.log(`[${requestId}] Metaobject creation response:`, JSON.stringify(createMetaobjectResult));
    } catch (jsonError) {
      console.error(`[${requestId}] Failed to parse metaobject creation response:`, jsonError);
      return { 
        success: false, 
        errors: [{ message: "Failed to parse metaobject creation response", details: jsonError }]
      };
    }
    
    if (createMetaobjectResult.data?.metaobjectCreate?.userErrors?.length > 0) {
      console.error(`[${requestId}] User errors in metaobject creation:`, createMetaobjectResult.data.metaobjectCreate.userErrors);
      return { 
        success: false,
        errors: createMetaobjectResult.data.metaobjectCreate.userErrors
      };
    }
    
    if (!createMetaobjectResult.data?.metaobjectCreate?.metaobject?.id) {
      console.error(`[${requestId}] Failed to get metaobject ID from creation response`);
      return { 
        success: false,
        errors: [{ message: "Failed to get metaobject ID" }]
      };
    }
    
    const metaobjectId = createMetaobjectResult.data.metaobjectCreate.metaobject.id;
    const metaobjectHandle = createMetaobjectResult.data.metaobjectCreate.metaobject.handle;
    
    console.log(`[${requestId}] Successfully created metaobject:`, { id: metaobjectId, handle: metaobjectHandle });
    
    return { 
      success: true, 
      metaobjectId,
      metaobjectHandle
    };
  } catch (error) {
    console.error(`[${requestId}] Error in tryCreateMetaobject:`, error);
    return { 
      success: false,
      errors: [{ message: error.message || "Unknown error in metaobject creation" }]
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Parse request body
    const payload: RequestPayload = await req.json();
    const { 
      pageId, 
      pageSlug, 
      productId, 
      shop, 
      accessToken, 
      forceMetaobjectCreation, 
      fallbackOnly, 
      debugMode,
      ignoreMetaobjectErrors,
      bypassConnectionCheck,
      maxRetries = 4
    } = payload;
    const requestId = payload.requestId || `publish_${Math.random().toString(36).substring(2, 8)}`;
    
    console.log(`[${requestId}] Processing shopify-publish-page request at ${new Date().toISOString()}`);
    console.log(`[${requestId}] Debug mode: ${debugMode ? 'enabled' : 'disabled'}, Fallback only: ${fallbackOnly ? 'enabled' : 'disabled'}, Ignore metaobject errors: ${ignoreMetaobjectErrors ? 'enabled' : 'disabled'}, Bypass connection check: ${bypassConnectionCheck ? 'enabled' : 'disabled'}`);

    if (!pageId || !pageSlug || !productId || !shop || !accessToken) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required parameters',
          debug: {
            missingParams: {
              pageId: !pageId,
              pageSlug: !pageSlug,
              productId: !productId,
              shop: !shop,
              accessToken: !accessToken
            }
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }
    
    // Create supabase client for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log(`[${requestId}] Linking with product: ${productId}`);
    
    // Skip connection check if requested (for high-latency environments)
    let permissionsFlag = false;
    
    if (!bypassConnectionCheck) {
      try {
        // Check permissions first with retries and longer timeout
        console.log(`[${requestId}] Checking permissions for shop: ${shop}`);
        try {
          const permissionsResponse = await fetchWithRetry(`https://${shop}/admin/oauth/access_scopes.json`, {
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': accessToken,
              'Cache-Control': 'no-store, no-cache',
            },
          }, 3, requestId);
          
          if (permissionsResponse.ok) {
            const scopesData = await permissionsResponse.json();
            const scopes = scopesData.access_scopes.map((scope: any) => scope.handle);
            permissionsFlag = scopes.includes('write_metaobject_definitions');
            console.log(`[${requestId}] Permission check: write_metaobject_definitions = ${permissionsFlag}`);
          } else {
            console.log(`[${requestId}] Could not verify permissions: ${permissionsResponse.status}`);
          }
        } catch (error) {
          console.log(`[${requestId}] Error checking permissions: ${error}`);
          if (ignoreMetaobjectErrors) {
            console.log(`[${requestId}] Continuing despite permission check error (ignoreMetaobjectErrors=true)`);
          } else {
            throw new Error(`Permission check failed: ${error.message}`);
          }
        }
        
        // Test access token validity before proceeding
        console.log(`[${requestId}] Testing access token validity for shop: ${shop}`);
        try {
          const shopResponse = await fetchWithRetry(`https://${shop}/admin/api/2023-10/shop.json`, {
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': accessToken,
              'Cache-Control': 'no-store, no-cache',
            },
          }, 3, requestId);
          
          if (!shopResponse.ok) {
            throw new Error(`Shopify API returned ${shopResponse.status}: ${await shopResponse.text()}`);
          }
          
          console.log(`[${requestId}] Access token validated successfully`);
        } catch (error) {
          console.error(`[${requestId}] Access token validation failed:`, error);
          
          if (debugMode) {
            // If in debug mode, continue despite errors but log them
            console.log(`[${requestId}] Continuing despite token validation failure (debugMode=true)`);
          } else if (fallbackOnly || ignoreMetaobjectErrors) {
            // If in fallback mode or ignoring errors, continue but log warning
            console.log(`[${requestId}] Continuing in fallback mode despite token validation issues`);
          } else {
            return new Response(
              JSON.stringify({
                success: false,
                message: `Access token validation failed: ${error.message}`,
                hasPermission: permissionsFlag,
                errorType: "token_validation_error",
                retryWithFallback: true,
                debug: debugMode ? { error: error.stack || error.message } : undefined
              }),
              {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
              }
            );
          }
        }
      } catch (connectionError) {
        console.error(`[${requestId}] Connection verification error:`, connectionError);
        
        if (fallbackOnly || ignoreMetaobjectErrors || debugMode) {
          // Continue with fallback method if in fallback mode or ignoring errors
          console.log(`[${requestId}] Continuing despite connection verification error due to fallback/ignore settings`);
        } else {
          return new Response(
            JSON.stringify({
              success: false,
              message: `Connection verification failed: ${connectionError.message}`,
              errorType: "connection_error",
              retryWithFallback: true,
              debug: debugMode ? { error: connectionError.stack || connectionError.message } : undefined
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 502, // Bad Gateway for connection issues
            }
          );
        }
      }
    } else {
      console.log(`[${requestId}] Bypassing connection check as requested`);
    }
    
    // Fetch page data from Supabase
    console.log(`[${requestId}] Fetching page content for pageId: ${pageId}`);
    try {
      const { data: pageData, error: pageError } = await supabase
        .from('landing_pages')
        .select('*, landing_page_templates(*)')
        .eq('id', pageId)
        .single();
      
      if (pageError) {
        throw new Error(`Failed to fetch page content: ${pageError.message}`);
      }
      
      if (!pageData) {
        throw new Error('Page not found');
      }
      
      const pageContent = pageData.landing_page_templates?.content || {};
      
      // 1. First get product details
      console.log(`[${requestId}] Fetching product details for ID: ${productId}`);
      
      // Parse the product ID to handle different formats
      const cleanProductId = productId.includes('/') 
        ? productId.split('/').pop() 
        : productId;
        
      console.log(`[${requestId}] Using cleaned product ID: ${cleanProductId}`);
      
      let productData;
      try {
        const productResponse = await fetchWithRetry(`https://${shop}/admin/api/2023-10/products/${cleanProductId}.json`, {
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken,
            'Cache-Control': 'no-store, no-cache',
          },
        }, maxRetries, requestId);
        
        if (!productResponse.ok) {
          throw new Error(`Failed to fetch product: ${productResponse.status} ${await productResponse.text()}`);
        }
        
        productData = await productResponse.json();
        console.log(`[${requestId}] Product fetched successfully: ${productData.product.title}`);
      } catch (productError) {
        console.error(`[${requestId}] Error fetching product:`, productError);
        
        if (fallbackOnly || ignoreMetaobjectErrors || debugMode) {
          // In fallback or debug mode, try to continue even if product fetch fails
          console.log(`[${requestId}] Continuing with limited product data due to fallback/debug settings`);
          productData = { product: { id: cleanProductId, title: "Unknown Product", handle: "unknown" } };
        } else {
          throw productError; // Re-throw to be caught by outer catch block
        }
      }
      
      // Prepare landing page link and update product description
      const landingPageUrl = `https://${shop}/pages/${pageSlug}`;
      
      // Skip metaobject creation if fallbackOnly is true or we don't have the required permission
      let metaobjectId = null;
      let metaobjectHandle = null;
      let metaobjectCreated = false;
      let metaobjectErrors = null;
      
      if (!fallbackOnly && permissionsFlag) {
        try {
          // Try to create metaobject
          const metaResult = await tryCreateMetaobject(
            shop, 
            accessToken, 
            pageSlug, 
            pageData.title, 
            pageContent, 
            forceMetaobjectCreation,
            requestId,
            maxRetries
          );
          
          metaobjectId = metaResult.metaobjectId;
          metaobjectHandle = metaResult.metaobjectHandle;
          metaobjectCreated = metaResult.success;
          metaobjectErrors = metaResult.errors;
          
          console.log(`[${requestId}] Metaobject creation result:`, metaResult);

          // If ignoreMetaobjectErrors is true and we have errors, continue with fallback approach
          if (!metaResult.success && ignoreMetaobjectErrors) {
            console.log(`[${requestId}] Ignoring metaobject errors and continuing with fallback approach`);
            // We'll set a flag so we know we ignored errors
            metaobjectErrors = { ignored: true, original: metaResult.errors };
          } else if (!metaResult.success && !ignoreMetaobjectErrors) {
            throw new Error(`Metaobject creation failed: ${JSON.stringify(metaResult.errors)}`);
          }
        } catch (metaError) {
          console.error(`[${requestId}] Error creating metaobject:`, metaError);
          
          // If ignoreMetaobjectErrors is true, continue with fallback approach
          if (!ignoreMetaobjectErrors) {
            // Only throw an error if we're not ignoring metaobject errors
            throw metaError;
          } else {
            console.log(`[${requestId}] Ignoring metaobject error and continuing with fallback approach`);
          }
        }
      }
      
      // Always update product description as fallback/additional approach
      console.log(`[${requestId}] Updating product description for product ID: ${productData.product.id}`);
      
      // Prepare landing page link
      const landingPageLink = `<p>المعلومات الكاملة متوفرة على <a href="${landingPageUrl}" target="_blank">الصفحة المخصصة</a>: اضغط هنا</p>`;
      
      // Preserve existing content but add our link
      let currentDescription = productData.product.body_html || '';
      let productUpdateSuccess = false;
      
      try {
        // Only add the link if it doesn't already exist
        if (!currentDescription.includes(landingPageUrl)) {
          const updatedDescription = currentDescription + '\n' + landingPageLink;
          
          const updateProductResponse = await fetchWithRetry(`https://${shop}/admin/api/2023-10/products/${productData.product.id}.json`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': accessToken,
              'Cache-Control': 'no-store, no-cache',
            },
            body: JSON.stringify({
              product: {
                id: productData.product.id,
                body_html: updatedDescription
              }
            })
          }, maxRetries, requestId);
          
          if (!updateProductResponse.ok) {
            console.error(`[${requestId}] Failed to update product description: ${await updateProductResponse.text()}`);
            // We'll still save the sync info even if this part fails
          } else {
            console.log(`[${requestId}] Successfully updated product description`);
            productUpdateSuccess = true;
          }
        } else {
          console.log(`[${requestId}] Landing page link already exists in product description`);
          productUpdateSuccess = true;
        }
      } catch (descriptionError) {
        console.error(`[${requestId}] Error updating product description:`, descriptionError);
        // Continue to next approach, don't throw
      }
      
      // If metaobject creation failed but product description was updated,
      // use the direct metafield approach as last resort
      let fallbackSuccess = false;
      if (!metaobjectCreated) {
        try {
          fallbackSuccess = await tryRestApiFallback(
            shop, 
            accessToken, 
            productData.product.id, 
            pageContent,
            pageSlug,
            requestId,
            maxRetries
          );
          
          console.log(`[${requestId}] Fallback metafield creation result: ${fallbackSuccess ? 'success' : 'failed'}`);
        } catch (fallbackError) {
          console.error(`[${requestId}] Fallback metafield approach failed:`, fallbackError);
          // Continue, we at least have the product description update
        }
      }
      
      // Save sync information to database
      console.log(`[${requestId}] Saving sync information to database`);
      
      try {
        // Check if a sync record already exists
        const { data: existingSyncData, error: checkError } = await supabase
          .from('shopify_page_syncs')
          .select('id')
          .eq('page_id', pageId)
          .maybeSingle();
          
        if (checkError) {
          console.error(`[${requestId}] Error checking existing sync:`, checkError);
        }
        
        const syncData = {
          page_id: pageId,
          shop_id: shop,
          synced_url: landingPageUrl,
          updated_at: new Date().toISOString()
        };
        
        // Update or insert sync record
        if (existingSyncData?.id) {
          const { error: updateError } = await supabase
            .from('shopify_page_syncs')
            .update(syncData)
            .eq('id', existingSyncData.id);
            
          if (updateError) {
            console.error(`[${requestId}] Error updating sync record:`, updateError);
          }
        } else {
          const { error: insertError } = await supabase
            .from('shopify_page_syncs')
            .insert(syncData);
            
          if (insertError) {
            console.error(`[${requestId}] Error inserting sync record:`, insertError);
          }
        }
      } catch (dbError) {
        console.error(`[${requestId}] Database error:`, dbError);
        // Continue even if database update fails
      }
      
      // Determine overall success - if ANY of the publishing methods worked
      const overallSuccess = metaobjectCreated || fallbackSuccess || productUpdateSuccess;
      
      return new Response(
        JSON.stringify({
          success: overallSuccess,
          message: overallSuccess ? 'Page published successfully' : 'Partial publishing success',
          metaobjectCreated: metaobjectCreated,
          metaobjectId,
          metaobjectHandle,
          metaobjectErrors: metaobjectErrors,
          productUrl: `https://${shop}/products/${productData.product.handle}`,
          landingPageUrl,
          fallbackUsed: !metaobjectCreated,
          fallbackSuccess: fallbackSuccess,
          productUpdateSuccess: productUpdateSuccess,
          hasMetaobjectPermission: permissionsFlag,
          ignoreMetaobjectErrorsWasActive: ignoreMetaobjectErrors,
          bypassConnectionCheckWasActive: bypassConnectionCheck,
          debugMode: debugMode ? {
            pageData: {
              id: pageData.id,
              title: pageData.title,
              slug: pageData.slug
            },
            productData: {
              id: productData.product.id,
              title: productData.product.title,
              handle: productData.product.handle
            }
          } : undefined
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (error) {
      console.error(`[${requestId}] Error updating page:`, error);
      return new Response(
        JSON.stringify({
          success: false,
          message: error.message || 'Unknown error occurred',
          hasMetaobjectPermission: permissionsFlag,
          errorType: "processing_error",
          retryWithFallback: true,
          debug: debugMode ? { error: error.stack || error.message } : undefined
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
  } catch (error) {
    console.error(`Error handling request:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'Unknown error occurred',
        errorType: "request_processing_error",
        debug: { error: error.stack || error.message }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
