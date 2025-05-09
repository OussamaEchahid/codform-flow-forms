
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
}

interface MetaobjectDefinition {
  id: string;
  handle: string;
  displayName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Parse request body
    const payload: RequestPayload = await req.json();
    const { pageId, pageSlug, productId, shop, accessToken, forceMetaobjectCreation } = payload;
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
    
    // Create supabase table for shopify_page_syncs if it doesn't exist
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log(`[${requestId}] Creating shopify_page_syncs table if it doesn't exist`);

    console.log(`[${requestId}] Linking with product: ${productId}`);
    
    // Test access token validity before proceeding
    console.log(`[${requestId}] Testing access token validity for shop: ${shop}`);
    try {
      const shopResponse = await fetch(`https://${shop}/admin/api/2023-10/shop.json`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
          'Cache-Control': 'no-store',
        },
      });
      
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
      const productResponse = await fetch(`https://${shop}/admin/api/2023-10/products/${productId.split('Product/')[1] || productId}.json`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
          'Cache-Control': 'no-store',
        },
      });
      
      if (!productResponse.ok) {
        throw new Error(`Failed to fetch product: ${productResponse.status} ${await productResponse.text()}`);
      }
      
      const productData = await productResponse.json();
      console.log(`[${requestId}] Product fetched successfully: ${productData.product.title}`);
      
      // 2. Check if metaobject definitions exist
      console.log(`[${requestId}] Checking for existing metaobject definition`);
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
      
      const definitionsResponse = await fetch(`https://${shop}/admin/api/2023-10/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken
        },
        body: JSON.stringify({
          query: metaobjectDefinitionQuery
        }),
      });
      
      let landingPageDefinition: MetaobjectDefinition | null = null;
      
      if (definitionsResponse.ok) {
        const definitionsData = await definitionsResponse.json();
        const definitions = definitionsData.data?.metaobjectDefinitions?.edges || [];
        
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
      }
      
      // 3. Create metaobject definition if it doesn't exist
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
        
        const createDefinitionResponse = await fetch(`https://${shop}/admin/api/2023-10/graphql.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken
          },
          body: JSON.stringify({
            query: createDefinitionMutation
          }),
        });
        
        if (!createDefinitionResponse.ok) {
          throw new Error(`Failed to create metaobject definition: ${await createDefinitionResponse.text()}`);
        }
        
        const createDefinitionData = await createDefinitionResponse.json();
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
      
      // 4. Check for existing metaobject for this page
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
      
      const metaobjectsResponse = await fetch(`https://${shop}/admin/api/2023-10/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken
        },
        body: JSON.stringify({
          query: metaobjectsQuery
        }),
      });
      
      let existingMetaobject = null;
      
      if (metaobjectsResponse.ok) {
        const metaobjectsData = await metaobjectsResponse.json();
        const metaobjects = metaobjectsData.data?.metaobjects?.edges || [];
        
        // Look for page with matching handle
        for (const edge of metaobjects) {
          const urlHandleField = edge.node.fields.find(f => f.key === 'url_handle');
          if (urlHandleField && urlHandleField.value === pageSlug) {
            existingMetaobject = edge.node;
            console.log(`[${requestId}] Found existing metaobject with ID: ${existingMetaobject.id}`);
            break;
          }
        }
      }
      
      // 5. Create or update metaobject
      let metaobjectId = null;
      let metaobjectHandle = null;
      
      if (existingMetaobject) {
        // Update existing metaobject
        console.log(`[${requestId}] Updating existing metaobject: ${existingMetaobject.id}`);
        
        const updateMetaobjectMutation = `
          mutation UpdateMetaobject {
            metaobjectUpdate(
              id: "${existingMetaobject.id}"
              metaobject: {
                fields: [
                  {
                    key: "title"
                    value: "${pageData.title.replace(/"/g, '\\"')}"
                  },
                  {
                    key: "content"
                    value: ${JSON.stringify(JSON.stringify(pageContent)).replace(/\\"/g, '\\\\"')}
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
        
        const updateResponse = await fetch(`https://${shop}/admin/api/2023-10/graphql.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken
          },
          body: JSON.stringify({
            query: updateMetaobjectMutation
          }),
        });
        
        if (!updateResponse.ok) {
          throw new Error(`Failed to update metaobject: ${await updateResponse.text()}`);
        }
        
        const updateData = await updateResponse.json();
        
        if (updateData.data?.metaobjectUpdate?.userErrors?.length > 0) {
          const errors = updateData.data.metaobjectUpdate.userErrors;
          console.error(`[${requestId}] Error updating metaobject:`, errors);
          
          // Try creating a new metaobject if update fails
          if (forceMetaobjectCreation) {
            console.log(`[${requestId}] Update failed, will try to create new metaobject instead`);
            existingMetaobject = null; // Reset to try creation path
          } else {
            throw new Error(`Failed to update metaobject: ${errors[0].message}`);
          }
        } else if (updateData.data?.metaobjectUpdate?.metaobject) {
          metaobjectId = updateData.data.metaobjectUpdate.metaobject.id;
          metaobjectHandle = updateData.data.metaobjectUpdate.metaobject.handle;
          console.log(`[${requestId}] Successfully updated metaobject: ${metaobjectId}`);
        }
      }
      
      if (!existingMetaobject || !metaobjectId) {
        // Create new metaobject
        console.log(`[${requestId}] Creating new metaobject for page: ${pageSlug}`);
        
        const createMetaobjectMutation = `
          mutation CreateMetaobject {
            metaobjectCreate(
              metaobject: {
                type: "landing_page"
                handle: "${pageSlug.replace(/\s+/g, '-').toLowerCase()}"
                fields: [
                  {
                    key: "title"
                    value: "${pageData.title.replace(/"/g, '\\"')}"
                  },
                  {
                    key: "content"
                    value: ${JSON.stringify(JSON.stringify(pageContent)).replace(/\\"/g, '\\\\"')}
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
        
        const createResponse = await fetch(`https://${shop}/admin/api/2023-10/graphql.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken
          },
          body: JSON.stringify({
            query: createMetaobjectMutation
          }),
        });
        
        if (!createResponse.ok) {
          // If GraphQL fails, try the REST API fallback
          console.log(`[${requestId}] GraphQL request failed, trying REST API fallback`);
          await tryRestApiFallback(shop, accessToken, productData.product.id, pageContent, requestId);
          
          throw new Error(`Failed to create metaobject: ${await createResponse.text()}`);
        }
        
        const createData = await createResponse.json();
        
        if (createData.data?.metaobjectCreate?.userErrors?.length > 0) {
          const errors = createData.data.metaobjectCreate.userErrors;
          console.error(`[${requestId}] Error creating metaobject:`, errors);
          
          // Try REST API fallback if GraphQL fails
          console.log(`[${requestId}] GraphQL creation failed, trying REST API fallback`);
          await tryRestApiFallback(shop, accessToken, productData.product.id, pageContent, requestId);
          
          throw new Error(`Failed to create metaobject: ${errors[0].message}`);
        }
        
        if (createData.data?.metaobjectCreate?.metaobject) {
          metaobjectId = createData.data.metaobjectCreate.metaobject.id;
          metaobjectHandle = createData.data.metaobjectCreate.metaobject.handle;
          console.log(`[${requestId}] Successfully created metaobject: ${metaobjectId}`);
        }
      }
      
      // 6. Update product description to include landing page reference
      console.log(`[${requestId}] Updating product description for product ID: ${productData.product.id}`);
      
      // Prepare landing page link
      const landingPageUrl = `https://${shop}/pages/${pageSlug}`;
      const landingPageLink = `<p>المعلومات الكاملة متوفرة على <a href="${landingPageUrl}" target="_blank">الصفحة المخصصة</a>: اضغط هنا</p>`;
      
      // Preserve existing content but add our link
      let currentDescription = productData.product.body_html || '';
      
      // Only add the link if it doesn't already exist
      if (!currentDescription.includes(landingPageUrl)) {
        const updatedDescription = currentDescription + '\n' + landingPageLink;
        
        const updateProductResponse = await fetch(`https://${shop}/admin/api/2023-10/products/${productData.product.id}.json`, {
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
        });
        
        if (!updateProductResponse.ok) {
          console.error(`[${requestId}] Failed to update product description: ${await updateProductResponse.text()}`);
          // Continue even if this part fails
        } else {
          console.log(`[${requestId}] Successfully updated product description`);
        }
      } else {
        console.log(`[${requestId}] Landing page link already exists in product description`);
      }
      
      // 7. Update the database with the sync information
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
          metaobjectId,
          metaobjectHandle,
          productUrl: `https://${shop}/products/${productData.product.handle}`,
          landingPageUrl
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

// Fallback function using REST API if GraphQL approach fails
async function tryRestApiFallback(shop: string, accessToken: string, productId: string, pageContent: any, requestId: string) {
  console.log(`[${requestId}] Attempting REST API fallback for metaobject creation`);
  
  // 1. Create metafield on product directly as fallback
  try {
    const contentString = JSON.stringify(pageContent);
    
    const metafieldResponse = await fetch(`https://${shop}/admin/api/2023-10/products/${productId}/metafields.json`, {
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
    });
    
    if (!metafieldResponse.ok) {
      throw new Error(`Failed to create metafield: ${await metafieldResponse.text()}`);
    }
    
    console.log(`[${requestId}] Successfully created metafield as fallback`);
    return true;
  } catch (error) {
    console.error(`[${requestId}] REST API fallback also failed:`, error);
    return false;
  }
}
