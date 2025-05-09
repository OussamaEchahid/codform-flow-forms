
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
}

interface MetaobjectDefinition {
  id: string;
  handle: string;
  displayName: string;
}

// Helper to add retries for fetch requests
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Exponential backoff
      if (attempt > 0) {
        const delay = Math.min(100 * Math.pow(2, attempt), 2000);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries}, waiting ${delay}ms before retry`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const response = await fetch(url, options);
      
      // Retry on server errors (5xx)
      if (response.status >= 500 && response.status < 600 && attempt < maxRetries - 1) {
        console.log(`Server error: ${response.status}, will retry`);
        continue;
      }
      
      return response;
    } catch (error) {
      console.error(`Fetch attempt ${attempt + 1} failed:`, error);
      lastError = error;
      
      // Only retry on network errors
      if (error.name !== 'TypeError' && error.name !== 'NetworkError') {
        throw error;
      }
    }
  }
  
  throw lastError || new Error('All fetch attempts failed');
}

// Try REST API fallback for metafield creation
async function tryRestApiFallback(
  shop: string,
  accessToken: string,
  productId: string,
  pageContent: any,
  pageSlug: string,
  requestId: string
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
    
    const response = await fetchWithRetry(
      `https://${shop}/admin/api/2023-10/products/${numericProductId}/metafields.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken
        },
        body: JSON.stringify(metafieldData)
      },
      3
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] Failed to create metafield:`, errorText);
      return false;
    }
    
    console.log(`[${requestId}] Successfully created metafield as fallback`);
    return true;
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
  requestId: string
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
    
    const definitionsResponse = await fetchWithRetry(`https://${shop}/admin/api/2023-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        query: metaobjectDefinitionQuery
      }),
    }, 3);
    
    if (!definitionsResponse.ok) {
      console.error(`[${requestId}] GraphQL query for metaobject definitions failed: ${definitionsResponse.status}`);
      const errorText = await definitionsResponse.text();
      console.error(`[${requestId}] Error details:`, errorText);
      return { 
        success: false, 
        errors: [{ message: `GraphQL query failed with status ${definitionsResponse.status}`, details: errorText }]
      };
    }
    
    const definitionsData = await definitionsResponse.json();
    console.log(`[${requestId}] Metaobject definitions response:`, JSON.stringify(definitionsData));
    
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
      
      const createDefinitionResponse = await fetchWithRetry(`https://${shop}/admin/api/2023-10/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken
        },
        body: JSON.stringify({
          query: createDefinitionMutation,
          variables: definitionInput
        }),
      }, 2);
      
      if (!createDefinitionResponse.ok) {
        console.error(`[${requestId}] Failed to create metaobject definition: ${createDefinitionResponse.status}`);
        const errorText = await createDefinitionResponse.text();
        console.error(`[${requestId}] Error details:`, errorText);
        return { 
          success: false,
          errors: [{ message: `Failed to create metaobject definition: ${errorText}` }]
        };
      }
      
      const createDefinitionResult = await createDefinitionResponse.json();
      console.log(`[${requestId}] Metaobject definition creation response:`, JSON.stringify(createDefinitionResult));
      
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
    
    const createMetaobjectResponse = await fetchWithRetry(`https://${shop}/admin/api/2023-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        query: createMetaobjectMutation,
        variables: metaobjectInput
      }),
    }, 2);
    
    if (!createMetaobjectResponse.ok) {
      console.error(`[${requestId}] Failed to create metaobject: ${createMetaobjectResponse.status}`);
      const errorText = await createMetaobjectResponse.text();
      console.error(`[${requestId}] Error details:`, errorText);
      return { 
        success: false,
        errors: [{ message: `Failed to create metaobject: ${errorText}` }]
      };
    }
    
    const createMetaobjectResult = await createMetaobjectResponse.json();
    console.log(`[${requestId}] Metaobject creation response:`, JSON.stringify(createMetaobjectResult));
    
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
    const { pageId, pageSlug, productId, shop, accessToken, forceMetaobjectCreation, fallbackOnly, debugMode } = payload;
    const requestId = payload.requestId || `req_${Math.random().toString(36).substring(2, 8)}`;
    
    console.log(`[${requestId}] Processing shopify-publish-page request at ${new Date().toISOString()}`);

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
    
    // Check permissions first
    let permissionsFlag = false;
    
    try {
      const permissionsResponse = await fetchWithRetry(`https://${shop}/admin/oauth/access_scopes.json`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
          'Cache-Control': 'no-store',
        },
      }, 2);
      
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
    }
    
    // Test access token validity before proceeding
    console.log(`[${requestId}] Testing access token validity for shop: ${shop}`);
    try {
      const shopResponse = await fetchWithRetry(`https://${shop}/admin/api/2023-10/shop.json`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
          'Cache-Control': 'no-store',
        },
      }, 3);
      
      if (!shopResponse.ok) {
        throw new Error(`Shopify API returned ${shopResponse.status}: ${await shopResponse.text()}`);
      }
      
      console.log(`[${requestId}] Access token validated successfully`);
    } catch (error) {
      console.error(`[${requestId}] Access token validation failed:`, error);
      return new Response(
        JSON.stringify({
          success: false,
          message: `Access token validation failed: ${error.message}`,
          hasPermission: permissionsFlag
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
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
      
      const productResponse = await fetchWithRetry(`https://${shop}/admin/api/2023-10/products/${cleanProductId}.json`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
          'Cache-Control': 'no-store',
        },
      }, 3);
      
      if (!productResponse.ok) {
        throw new Error(`Failed to fetch product: ${productResponse.status} ${await productResponse.text()}`);
      }
      
      const productData = await productResponse.json();
      console.log(`[${requestId}] Product fetched successfully: ${productData.product.title}`);
      
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
            requestId
          );
          
          metaobjectId = metaResult.metaobjectId;
          metaobjectHandle = metaResult.metaobjectHandle;
          metaobjectCreated = metaResult.success;
          metaobjectErrors = metaResult.errors;
          
          console.log(`[${requestId}] Metaobject creation result:`, metaResult);
        } catch (metaError) {
          console.error(`[${requestId}] Error creating metaobject:`, metaError);
          // Continue with fallback approach - we'll just update the product
        }
      }
      
      // Always update product description as fallback/additional approach
      console.log(`[${requestId}] Updating product description for product ID: ${productData.product.id}`);
      
      // Prepare landing page link
      const landingPageLink = `<p>المعلومات الكاملة متوفرة على <a href="${landingPageUrl}" target="_blank">الصفحة المخصصة</a>: اضغط هنا</p>`;
      
      // Preserve existing content but add our link
      let currentDescription = productData.product.body_html || '';
      
      // Only add the link if it doesn't already exist
      if (!currentDescription.includes(landingPageUrl)) {
        const updatedDescription = currentDescription + '\n' + landingPageLink;
        
        const updateProductResponse = await fetchWithRetry(`https://${shop}/admin/api/2023-10/products/${productData.product.id}.json`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken
          },
          body: JSON.stringify({
            product: {
              id: productData.product.id,
              body_html: updatedDescription
            }
          })
        }, 3);
        
        if (!updateProductResponse.ok) {
          console.error(`[${requestId}] Failed to update product description: ${await updateProductResponse.text()}`);
          // We'll still save the sync info even if this part fails
        } else {
          console.log(`[${requestId}] Successfully updated product description`);
        }
      } else {
        console.log(`[${requestId}] Landing page link already exists in product description`);
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
            requestId
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
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Page published successfully',
          metaobjectCreated: metaobjectCreated,
          metaobjectId,
          metaobjectHandle,
          metaobjectErrors: metaobjectErrors,
          productUrl: `https://${shop}/products/${productData.product.handle}`,
          landingPageUrl,
          fallbackUsed: !metaobjectCreated,
          fallbackSuccess: fallbackSuccess,
          hasMetaobjectPermission: permissionsFlag,
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
        debug: { error: error.stack || error.message }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
