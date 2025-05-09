
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Parse request body
    const payload: RequestPayload = await req.json();
    const { pageId, pageSlug, productId, shop, accessToken, forceMetaobjectCreation, fallbackOnly } = payload;
    const requestId = payload.requestId || `req_${Math.random().toString(36).substring(2, 8)}`;
    
    console.log(`[${requestId}] Processing shopify-publish-page request at ${new Date().toISOString()}`);

    if (!pageId || !productId || !shop || !accessToken) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required parameters',
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
      
      // Skip metaobject creation if fallbackOnly is true
      let metaobjectId = null;
      let metaobjectHandle = null;
      let metaobjectCreated = false;
      
      if (!fallbackOnly) {
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
      if (!metaobjectCreated) {
        try {
          const fallbackResult = await tryRestApiFallback(
            shop, 
            accessToken, 
            productData.product.id, 
            pageContent, 
            requestId
          );
          
          console.log(`[${requestId}] Fallback metafield creation result: ${fallbackResult ? 'success' : 'failed'}`);
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
          product_id: productId,
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
          productUrl: `https://${shop}/products/${productData.product.handle}`,
          landingPageUrl,
          fallbackUsed: !metaobjectCreated
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
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Try to create metaobject using GraphQL
async function tryCreateMetaobject(
  shop: string, 
  accessToken: string, 
  pageSlug: string,
  pageTitle: string,
  pageContent: any,
  forceMetaobjectCreation: boolean = false,
  requestId: string
): Promise<{success: boolean, metaobjectId?: string, metaobjectHandle?: string}> {
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
      throw new Error(`GraphQL query failed with status ${definitionsResponse.status}`);
    }
    
    const definitionsData = await definitionsResponse.json();
    console.log(`[${requestId}] Metaobject definitions response:`, JSON.stringify(definitionsData));
    
    let landingPageDefinition: MetaobjectDefinition | null = null;
    
    if (definitionsData.data?.metaobjectDefinitions?.edges) {
      const definitions = definitionsData.data.metaobjectDefinitions.edges || [];
      
      // Look for landing_page definition
      for (const edge of definitions) {
        if (edge.node.type === 'landing_page') {
          landingPageDefinition = {
            id: edge.node.id,
            handle: 'landing_page',
            displayName: edge.node.name
          };
          console.log(`[${requestId}] Found existing metaobject definition: ${landingPageDefinition.displayName}`);
          break;
        }
      }
    } else {
      console.warn(`[${requestId}] No metaobjectDefinitions data returned from GraphQL`);
    }
    
    // Create the metaobject definition if it doesn't exist
    if (!landingPageDefinition) {
      console.log(`[${requestId}] Creating new metaobject definition for landing pages`);
      
      const createDefinitionMutation = `
        mutation CreateMetaobjectDefinition {
          metaobjectDefinitionCreate(
            definition: {
              name: "Landing Page"
              type: "landing_page"
              fieldDefinitions: [
                {
                  key: "title"
                  name: "Title"
                  type: "single_line_text_field"
                  required: true
                },
                {
                  key: "content"
                  name: "Content"
                  type: "json"
                  required: false
                },
                {
                  key: "url_handle"
                  name: "URL Handle"
                  type: "single_line_text_field"
                  required: true
                }
              ]
            }
          ) {
            metaobjectDefinition {
              id
              name
              type
            }
            userErrors {
              field
              message
            }
          }
        }
      `;
      
      const createDefinitionResponse = await fetchWithRetry(`https://${shop}/admin/api/2023-10/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken
        },
        body: JSON.stringify({
          query: createDefinitionMutation
        }),
      }, 3);
      
      if (!createDefinitionResponse.ok) {
        const errorText = await createDefinitionResponse.text();
        console.error(`[${requestId}] Failed to create metaobject definition: ${errorText}`);
        throw new Error(`Failed to create metaobject definition: ${createDefinitionResponse.status}`);
      }
      
      const createDefinitionData = await createDefinitionResponse.json();
      console.log(`[${requestId}] Metaobject definition creation response:`, JSON.stringify(createDefinitionData));
      
      if (createDefinitionData.data?.metaobjectDefinitionCreate?.userErrors?.length > 0) {
        const errors = createDefinitionData.data.metaobjectDefinitionCreate.userErrors;
        console.error(`[${requestId}] Error creating metaobject definition:`, errors);
        throw new Error(`Failed to create metaobject definition: ${errors[0].message}`);
      }
      
      if (createDefinitionData.data?.metaobjectDefinitionCreate?.metaobjectDefinition) {
        landingPageDefinition = {
          id: createDefinitionData.data.metaobjectDefinitionCreate.metaobjectDefinition.id,
          handle: 'landing_page',
          displayName: 'Landing Page'
        };
        console.log(`[${requestId}] Successfully created metaobject definition: ${landingPageDefinition.displayName}`);
      }
    }
    
    if (!landingPageDefinition) {
      throw new Error('Failed to find or create metaobject definition for landing pages');
    }
    
    // Check for existing metaobject for this page
    console.log(`[${requestId}] Checking for existing metaobject for page: ${pageSlug}`);
    
    const metaobjectsQuery = `
      query {
        metaobjects(first: 10, type: "landing_page") {
          edges {
            node {
              id
              handle
              fields {
                key
                value
              }
            }
          }
        }
      }
    `;
    
    const metaobjectsResponse = await fetchWithRetry(`https://${shop}/admin/api/2023-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        query: metaobjectsQuery
      }),
    }, 3);
    
    let existingMetaobject = null;
    let metaobjectId = null;
    let metaobjectHandle = null;
    
    if (metaobjectsResponse.ok) {
      const metaobjectsData = await metaobjectsResponse.json();
      
      if (metaobjectsData.data?.metaobjects?.edges) {
        const metaobjects = metaobjectsData.data.metaobjects.edges || [];
        
        // Look for page with matching handle
        for (const edge of metaobjects) {
          const urlHandleField = edge.node.fields.find(f => f.key === 'url_handle');
          if (urlHandleField && urlHandleField.value === pageSlug) {
            existingMetaobject = edge.node;
            console.log(`[${requestId}] Found existing metaobject with ID: ${existingMetaobject.id}`);
            break;
          }
        }
      } else {
        console.warn(`[${requestId}] No metaobjects data returned from GraphQL`);
      }
    } else {
      console.error(`[${requestId}] Error fetching metaobjects: ${await metaobjectsResponse.text()}`);
    }
    
    // Update or create metaobject
    if (existingMetaobject && !forceMetaobjectCreation) {
      // Update existing metaobject
      console.log(`[${requestId}] Updating existing metaobject: ${existingMetaobject.id}`);
      
      try {
        const escapedTitle = pageTitle.replace(/"/g, '\\"');
        const escapedContent = JSON.stringify(JSON.stringify(pageContent)).replace(/\\"/g, '\\\\"');
        
        const updateMetaobjectMutation = `
          mutation UpdateMetaobject {
            metaobjectUpdate(
              id: "${existingMetaobject.id}"
              metaobject: {
                fields: [
                  {
                    key: "title"
                    value: "${escapedTitle}"
                  },
                  {
                    key: "content"
                    value: ${escapedContent}
                  },
                  {
                    key: "url_handle"
                    value: "${pageSlug}"
                  }
                ]
              }
            ) {
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
        
        const updateResponse = await fetchWithRetry(`https://${shop}/admin/api/2023-10/graphql.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken
          },
          body: JSON.stringify({
            query: updateMetaobjectMutation
          }),
        }, 3);
        
        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          console.error(`[${requestId}] Failed to update metaobject: ${errorText}`);
          throw new Error(`Failed to update metaobject: ${updateResponse.status}`);
        }
        
        const updateData = await updateResponse.json();
        
        if (updateData.data?.metaobjectUpdate?.userErrors?.length > 0) {
          const errors = updateData.data.metaobjectUpdate.userErrors;
          console.error(`[${requestId}] Error updating metaobject:`, errors);
          throw new Error(`Failed to update metaobject: ${errors[0].message}`);
        }
        
        if (updateData.data?.metaobjectUpdate?.metaobject) {
          metaobjectId = updateData.data.metaobjectUpdate.metaobject.id;
          metaobjectHandle = updateData.data.metaobjectUpdate.metaobject.handle;
          console.log(`[${requestId}] Successfully updated metaobject: ${metaobjectId}`);
        } else {
          console.error(`[${requestId}] Unexpected response format from metaobject update:`, updateData);
          throw new Error('Unexpected response format from metaobject update');
        }
      } catch (updateError) {
        console.error(`[${requestId}] Error during metaobject update:`, updateError);
        
        if (forceMetaobjectCreation) {
          console.log(`[${requestId}] Update failed, trying to create new metaobject instead`);
          existingMetaobject = null; // Reset to try creation path
        } else {
          throw updateError;
        }
      }
    }
    
    if (!existingMetaobject || forceMetaobjectCreation) {
      // Create new metaobject
      console.log(`[${requestId}] Creating new metaobject for page: ${pageSlug}`);
      
      try {
        const safeHandle = pageSlug.replace(/\s+/g, '-').toLowerCase().substring(0, 30);
        const escapedTitle = pageTitle.replace(/"/g, '\\"');
        const escapedContent = JSON.stringify(JSON.stringify(pageContent)).replace(/\\"/g, '\\\\"');
        
        const createMetaobjectMutation = `
          mutation CreateMetaobject {
            metaobjectCreate(
              metaobject: {
                type: "landing_page"
                handle: "${safeHandle}"
                fields: [
                  {
                    key: "title"
                    value: "${escapedTitle}"
                  },
                  {
                    key: "content"
                    value: ${escapedContent}
                  },
                  {
                    key: "url_handle"
                    value: "${pageSlug}"
                  }
                ]
              }
            ) {
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
        
        const createResponse = await fetchWithRetry(`https://${shop}/admin/api/2023-10/graphql.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken
          },
          body: JSON.stringify({
            query: createMetaobjectMutation
          }),
        }, 3);
        
        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          console.error(`[${requestId}] GraphQL request failed: ${errorText}`);
          throw new Error(`Failed to create metaobject: ${createResponse.status}`);
        }
        
        const createData = await createResponse.json();
        console.log(`[${requestId}] Metaobject creation response:`, JSON.stringify(createData));
        
        if (createData.data?.metaobjectCreate?.userErrors?.length > 0) {
          const errors = createData.data.metaobjectCreate.userErrors;
          console.error(`[${requestId}] Error creating metaobject:`, errors);
          throw new Error(`Failed to create metaobject: ${errors[0].message}`);
        }
        
        if (createData.data?.metaobjectCreate?.metaobject) {
          metaobjectId = createData.data.metaobjectCreate.metaobject.id;
          metaobjectHandle = createData.data.metaobjectCreate.metaobject.handle;
          console.log(`[${requestId}] Successfully created metaobject: ${metaobjectId}`);
        } else {
          console.error(`[${requestId}] Unexpected response format from metaobject creation:`, createData);
          throw new Error('Unexpected response format from metaobject creation');
        }
      } catch (createError) {
        console.error(`[${requestId}] Error during metaobject creation:`, createError);
        throw createError;
      }
    }
    
    return {
      success: true,
      metaobjectId,
      metaobjectHandle
    };
  } catch (error) {
    console.error(`[${requestId}] Error in tryCreateMetaobject:`, error);
    return { success: false };
  }
}

// Fallback function using REST API if GraphQL approach fails
async function tryRestApiFallback(shop: string, accessToken: string, productId: string, pageContent: any, requestId: string): Promise<boolean> {
  console.log(`[${requestId}] Attempting REST API fallback for metafield creation`);
  
  try {
    const contentString = JSON.stringify(pageContent);
    
    const metafieldResponse = await fetchWithRetry(`https://${shop}/admin/api/2023-10/products/${productId}/metafields.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        metafield: {
          namespace: 'landing_page',
          key: 'content',
          value: contentString,
          type: 'json_string'
        }
      })
    }, 3);
    
    if (!metafieldResponse.ok) {
      const errorText = await metafieldResponse.text();
      console.error(`[${requestId}] Failed to create metafield: ${errorText}`);
      throw new Error(`Failed to create metafield: ${metafieldResponse.status}`);
    }
    
    console.log(`[${requestId}] Successfully created metafield as fallback`);
    return true;
  } catch (error) {
    console.error(`[${requestId}] REST API fallback also failed:`, error);
    return false;
  }
}
