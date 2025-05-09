// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestId = `req_${Math.random().toString(36).substring(2, 10)}`;
    console.log(`[${requestId}] Processing shopify-publish-page request at ${new Date().toISOString()}`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const payload: RequestPayload = await req.json();
    const { pageId, pageSlug, productId, shop, accessToken, forceMetaobjectCreation = false } = payload;
    const clientRequestId = payload.requestId || 'none';
    
    if (!pageId || !pageSlug || !productId || !shop || !accessToken) {
      console.log(`[${requestId}] Missing required fields in request`);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required fields',
          requestId,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // First, create a table to store sync information if it doesn't exist
    console.log(`[${requestId}] Creating shopify_page_syncs table if it doesn't exist`);
    await supabase.rpc('create_table_if_not_exists', {
      p_table_name: 'shopify_page_syncs',
      p_table_definition: `
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        page_id UUID NOT NULL,
        product_id TEXT NOT NULL,
        shop_id TEXT NOT NULL, 
        synced_url TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      `
    });
    
    // Extract product ID from GraphQL ID if needed
    console.log(`[${requestId}] Linking with product: ${productId}`);
    
    // Test access token validity before proceeding
    console.log(`[${requestId}] Testing access token validity for shop: ${shop}`);
    const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;

    // Test token with shop endpoint first
    try {
      const shopResponse = await fetch(`https://${shopDomain}/admin/api/2023-10/shop.json`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
      });
      
      if (!shopResponse.ok) {
        throw new Error(`Shop endpoint returned ${shopResponse.status}`);
      }
      
      console.log(`[${requestId}] Access token validated successfully`);
    } catch (error) {
      console.error(`[${requestId}] Access token validation failed:`, error);
      return new Response(
        JSON.stringify({
          success: false,
          message: `Invalid or expired access token: ${error.message}`,
          requestId
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    // Fetch Shopify page content by handle
    console.log(`[${requestId}] Fetching Shopify page with handle: ${pageSlug}`);
    let pageResponse;
    let pageObject = null;
    let pageId_shopify = '';
    
    try {
      // Try to get page using REST API first
      const response = await fetch(`https://${shopDomain}/admin/api/2023-10/pages.json?handle=${pageSlug}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status}`);
      }
      
      pageResponse = await response.json();
      
      if (pageResponse.pages && pageResponse.pages.length > 0) {
        pageObject = pageResponse.pages[0];
        pageId_shopify = pageObject.id.toString();
        console.log(`[${requestId}] Found existing page with ID: ${pageId_shopify}`);
      }
    } catch (error) {
      console.error(`[${requestId}] Error fetching page:`, error);
      // We'll create a new page so continue
    }
    
    // If page doesn't exist, create it
    if (!pageObject) {
      try {
        // Get page content from database
        const { data: pageData, error: pageError } = await supabase
          .from('landing_page_templates')
          .select('content')
          .eq('page_id', pageId)
          .single();
          
        if (pageError) {
          throw new Error(`Failed to fetch page content: ${pageError.message}`);
        }
        
        // Get page title
        const { data: pageTitleData, error: pageTitleError } = await supabase
          .from('landing_pages')
          .select('title')
          .eq('id', pageId)
          .single();
          
        if (pageTitleError) {
          throw new Error(`Failed to fetch page title: ${pageTitleError.message}`);
        }
        
        // Create a simplified HTML version of the page content
        const pageContent = pageData.content;
        let htmlContent = `<div data-codform-landing-page="${pageId}">`;
        if (pageContent && pageContent.sections) {
          pageContent.sections.forEach((section: any) => {
            htmlContent += `<div class="section section-${section.type || 'basic'}">`;
            if (section.content) {
              if (section.content.heading) {
                htmlContent += `<h2>${section.content.heading}</h2>`;
              }
              if (section.content.subheading) {
                htmlContent += `<p>${section.content.subheading}</p>`;
              }
              if (section.content.text) {
                htmlContent += `<p>${section.content.text}</p>`;
              }
            }
            htmlContent += '</div>';
          });
        }
        htmlContent += '</div>';
        
        // Create page in Shopify
        const createPageResponse = await fetch(`https://${shopDomain}/admin/api/2023-10/pages.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken
          },
          body: JSON.stringify({
            page: {
              title: pageTitleData.title,
              handle: pageSlug,
              body_html: htmlContent,
              published: true
            }
          })
        });
        
        if (!createPageResponse.ok) {
          const errorText = await createPageResponse.text();
          throw new Error(`Failed to create page: ${createPageResponse.status} - ${errorText}`);
        }
        
        const createPageResponseJson = await createPageResponse.json();
        pageObject = createPageResponseJson.page;
        pageId_shopify = pageObject.id.toString();
        console.log(`[${requestId}] Created new page with ID: ${pageId_shopify}`);
      } catch (error) {
        console.error(`[${requestId}] Error creating page:`, error);
        return new Response(
          JSON.stringify({
            success: false,
            message: `Failed to create Shopify page: ${error.message}`,
            requestId
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
          }
        );
      }
    } else {
      // Update existing page
      console.log(`[${requestId}] Updating existing Shopify page: ${pageId_shopify}`);
      
      try {
        // Get page content from database
        const { data: pageData, error: pageError } = await supabase
          .from('landing_page_templates')
          .select('content')
          .eq('page_id', pageId)
          .single();
          
        if (pageError) {
          throw new Error(`Failed to fetch page content: ${pageError.message}`);
        }
        
        // Create a simplified HTML version of the page content for update
        const pageContent = pageData.content;
        let htmlContent = `<div data-codform-landing-page="${pageId}">`;
        if (pageContent && pageContent.sections) {
          pageContent.sections.forEach((section: any) => {
            htmlContent += `<div class="section section-${section.type || 'basic'}">`;
            if (section.content) {
              if (section.content.heading) {
                htmlContent += `<h2>${section.content.heading}</h2>`;
              }
              if (section.content.subheading) {
                htmlContent += `<p>${section.content.subheading}</p>`;
              }
              if (section.content.text) {
                htmlContent += `<p>${section.content.text}</p>`;
              }
            }
            htmlContent += '</div>';
          });
        }
        htmlContent += '</div>';
        
        // Update page in Shopify
        const updatePageResponse = await fetch(`https://${shopDomain}/admin/api/2023-10/pages/${pageId_shopify}.json`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken
          },
          body: JSON.stringify({
            page: {
              body_html: htmlContent,
              published: true
            }
          })
        });
        
        if (!updatePageResponse.ok) {
          const errorText = await updatePageResponse.text();
          throw new Error(`Failed to update page: ${updatePageResponse.status} - ${errorText}`);
        }
        
        console.log(`[${requestId}] Successfully updated page: https://${shopDomain}/pages/${pageSlug}`);
      } catch (error) {
        console.error(`[${requestId}] Error updating page:`, error);
        return new Response(
          JSON.stringify({
            success: false,
            message: `Failed to update Shopify page: ${error.message}`,
            requestId
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
          }
        );
      }
    }
    
    // Now attempt to create metaobject definition
    try {
      // Check if metaobject definition exists for app_dlili
      console.log(`[${requestId}] Checking if app_dlili metaobject definition exists`);
      
      const metaobjectDefinitionQuery = `
        query {
          metaobjectDefinitions(first: 10) {
            edges {
              node {
                name
                type
              }
            }
          }
        }
      `;
      
      const definitionResponse = await fetch(`https://${shopDomain}/admin/api/2023-10/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken
        },
        body: JSON.stringify({
          query: metaobjectDefinitionQuery
        })
      });
      
      if (!definitionResponse.ok) {
        throw new Error(`Failed to query metaobject definitions: ${definitionResponse.status}`);
      }
      
      console.log(`[${requestId}] GraphQL response received for metaobject definition`);
      const definitionResponseJson = await definitionResponse.json();
      
      // Check if app_dlili definition exists
      let definitionExists = false;
      if (definitionResponseJson.data && 
          definitionResponseJson.data.metaobjectDefinitions && 
          definitionResponseJson.data.metaobjectDefinitions.edges) {
        const definitions = definitionResponseJson.data.metaobjectDefinitions.edges;
        for (const edge of definitions) {
          if (edge.node.type === 'app_dlili') {
            definitionExists = true;
            break;
          }
        }
      } else {
        console.log(`[${requestId}] No metaobject definitions found or unexpected GraphQL response structure`);
      }
      
      // If definition doesn't exist or force creation is enabled, create it
      if (!definitionExists || forceMetaobjectCreation) {
        console.log(`[${requestId}] Creating app_dlili metaobject definition (forced recreation)`);
        
        const createDefinitionMutation = `
          mutation CreateMetaobjectDefinition {
            metaobjectDefinitionCreate(
              definition: {
                name: "Dlili Landing Page",
                type: "app_dlili",
                fieldDefinitions: [
                  {
                    name: "landing_page_id",
                    type: "single_line_text_field",
                    key: "landing_page_id",
                    required: true
                  },
                  {
                    name: "landing_page_slug",
                    type: "single_line_text_field",
                    key: "landing_page_slug",
                    required: true
                  },
                  {
                    name: "landing_page_url",
                    type: "single_line_text_field",
                    key: "landing_page_url",
                    required: true
                  }
                ]
              }
            ) {
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
        
        try {
          const createDefinitionResponse = await fetch(`https://${shopDomain}/admin/api/2023-10/graphql.json`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': accessToken
            },
            body: JSON.stringify({
              query: createDefinitionMutation
            })
          });
          
          if (!createDefinitionResponse.ok) {
            console.error(`[${requestId}] Error creating metaobject definition: ${createDefinitionResponse.status} `);
            // Continue anyway as the definition might already exist but not be returned by the query
          } else {
            const createDefinitionResponseJson = await createDefinitionResponse.json();
            
            if (createDefinitionResponseJson.data && 
                createDefinitionResponseJson.data.metaobjectDefinitionCreate && 
                createDefinitionResponseJson.data.metaobjectDefinitionCreate.userErrors && 
                createDefinitionResponseJson.data.metaobjectDefinitionCreate.userErrors.length > 0) {
              throw new Error(`Failed to create metaobject definition: ${createDefinitionResponseJson.data.metaobjectDefinitionCreate.userErrors[0].message}`);
            }
          }
        } catch (error) {
          console.error(`[${requestId}] Error with metaobject definition:`, error);
          // Continue anyway as we'll try to create the metaobject
        }
      }
    } catch (error) {
      console.error(`[${requestId}] Error with metaobject definition:`, error);
      // Continue anyway as we'll try to create the metaobject
    }
    
    // Now, let's extract the numeric product ID from the GraphQL ID
    console.log(`[${requestId}] Extracting Shopify product ID from GID: ${productId}`);
    // Handle both formats: gid://shopify/Product/1234567890 or just 1234567890
    const productIdNumeric = productId.includes('gid://shopify/Product/') 
      ? productId.split('/').pop() 
      : productId;
    
    console.log(`[${requestId}] Extracted Shopify product ID: ${productIdNumeric}`);
    
    // Fetch product data
    console.log(`[${requestId}] Fetching product data for ID: ${productIdNumeric}`);
    let productData;
    try {
      const productResponse = await fetch(`https://${shopDomain}/admin/api/2023-10/products/${productIdNumeric}.json`, {
        headers: {
          'X-Shopify-Access-Token': accessToken
        }
      });
      
      if (!productResponse.ok) {
        throw new Error(`Failed to fetch product: ${productResponse.status}`);
      }
      
      const productResponseJson = await productResponse.json();
      productData = productResponseJson.product;
    } catch (error) {
      console.error(`[${requestId}] Error fetching product:`, error);
      return new Response(
        JSON.stringify({
          success: false,
          message: `Failed to fetch product: ${error.message}`,
          requestId
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }
    
    // Update product description with landing page content
    console.log(`[${requestId}] Updating product description with landing page content`);
    try {
      // Get page content from database
      const { data: pageData, error: pageError } = await supabase
        .from('landing_page_templates')
        .select('content')
        .eq('page_id', pageId)
        .single();
        
      if (pageError) {
        throw new Error(`Failed to fetch page content: ${pageError.message}`);
      }
      
      // Create a simplified HTML version of the page content
      const pageContent = pageData.content;
      let htmlContent = `<div data-codform-landing-page="${pageId}">`;
      htmlContent += `<p><strong>المعلومات الكاملة متوفرة على الصفحة المخصصة: <a href="https://${shopDomain}/pages/${pageSlug}" target="_blank">اضغط هنا</a></strong></p>`;
      
      if (pageContent && pageContent.sections) {
        pageContent.sections.forEach((section: any, index: number) => {
          // Only include first 2 sections to keep description manageable
          if (index < 2) {
            htmlContent += `<div class="section section-${section.type || 'basic'}">`;
            if (section.content) {
              if (section.content.heading) {
                htmlContent += `<h3>${section.content.heading}</h3>`;
              }
              if (section.content.subheading) {
                htmlContent += `<p>${section.content.subheading}</p>`;
              }
            }
            htmlContent += '</div>';
          }
        });
      }
      htmlContent += `<p><a href="https://${shopDomain}/pages/${pageSlug}" target="_blank">عرض الصفحة الكاملة</a></p>`;
      htmlContent += '</div>';
      
      // Update product
      const updateProductResponse = await fetch(`https://${shopDomain}/admin/api/2023-10/products/${productIdNumeric}.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken
        },
        body: JSON.stringify({
          product: {
            id: productIdNumeric,
            body_html: htmlContent
          }
        })
      });
      
      if (!updateProductResponse.ok) {
        throw new Error(`Failed to update product: ${updateProductResponse.status}`);
      }
      
      console.log(`[${requestId}] Successfully updated product ${productIdNumeric} with landing page content`);
    } catch (error) {
      console.error(`[${requestId}] Error updating product:`, error);
      return new Response(
        JSON.stringify({
          success: false, 
          message: `Failed to update product: ${error.message}`,
          requestId
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }
    
    // Generate the product URL
    const productHandle = productData.handle;
    const productUrl = `https://${shopDomain}/products/${productHandle}`;
    console.log(`[${requestId}] Generated product URL: ${productUrl}`);
    
    // Now create a metaobject for the landing page
    try {
      // Create metaobject using GraphQL (will succeed even if definition wasn't created)
      const createMetaobjectMutation = `
        mutation CreateMetaobject {
          metaobjectCreate(
            metaobject: {
              type: "app_dlili",
              capabilities: { publishable: { status: ACTIVE } },
              fields: [
                {
                  key: "landing_page_id",
                  value: "${pageId}"
                },
                {
                  key: "landing_page_slug",
                  value: "${pageSlug}"
                },
                {
                  key: "landing_page_url",
                  value: "https://${shopDomain}/pages/${pageSlug}"
                }
              ]
            }
          ) {
            metaobject {
              id
              handle
              type
            }
            userErrors {
              field
              message
            }
          }
        }
      `;
      
      // We'll use REST API to create metaobjects as a fallback
      const restCreateMetaobject = async () => {
        const metaobjectResponse = await fetch(`https://${shopDomain}/admin/api/2023-10/metaobjects.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken
          },
          body: JSON.stringify({
            metaobject: {
              type: "app_dlili",
              fields: [
                {
                  key: "landing_page_id",
                  type: "single_line_text_field",
                  value: pageId
                },
                {
                  key: "landing_page_slug",
                  type: "single_line_text_field",
                  value: pageSlug
                },
                {
                  key: "landing_page_url",
                  type: "single_line_text_field",
                  value: `https://${shopDomain}/pages/${pageSlug}`
                }
              ]
            }
          })
        });
        
        if (!metaobjectResponse.ok) {
          return null;
        }
        
        return await metaobjectResponse.json();
      };
      
      // First try GraphQL, then REST API if that fails
      let metaobjectId = null;
      try {
        const createMetaobjectResponse = await fetch(`https://${shopDomain}/admin/api/2023-10/graphql.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken
          },
          body: JSON.stringify({
            query: createMetaobjectMutation
          })
        });
        
        if (!createMetaobjectResponse.ok) {
          throw new Error(`GraphQL metaobject creation failed: ${createMetaobjectResponse.status}`);
        }
        
        const createMetaobjectResponseJson = await createMetaobjectResponse.json();
        
        if (createMetaobjectResponseJson.data && 
            createMetaobjectResponseJson.data.metaobjectCreate && 
            createMetaobjectResponseJson.data.metaobjectCreate.metaobject) {
          metaobjectId = createMetaobjectResponseJson.data.metaobjectCreate.metaobject.id;
        } else if (createMetaobjectResponseJson.data?.metaobjectCreate?.userErrors?.length > 0) {
          throw new Error(`GraphQL metaobject creation errors: ${JSON.stringify(createMetaobjectResponseJson.data.metaobjectCreate.userErrors)}`);
        }
      } catch (graphqlError) {
        console.error(`[${requestId}] GraphQL metaobject creation failed, trying REST:`, graphqlError);
        
        // Try REST API as fallback
        const restResult = await restCreateMetaobject();
        if (restResult?.metaobject?.id) {
          metaobjectId = restResult.metaobject.id;
        }
      }
      
      if (metaobjectId) {
        console.log(`[${requestId}] Successfully created metaobject with ID: ${metaobjectId}`);
      } else {
        console.log(`[${requestId}] Could not create metaobject, but continuing with product updates`);
      }
    } catch (metaobjectError) {
      console.error(`[${requestId}] Error creating metaobject:`, metaobjectError);
      // Continue anyway since we've already updated the product description
    }
    
    // Save sync information to database
    console.log(`[${requestId}] Saving sync information to database`);
    try {
      const { data, error } = await supabase
        .from('shopify_page_syncs')
        .upsert(
          {
            page_id: pageId,
            product_id: productId,
            shop_id: shop,
            synced_url: productUrl
          },
          { 
            onConflict: 'page_id',
            ignoreDuplicates: false
          }
        );
        
      if (error) {
        console.error(`[${requestId}] Error saving sync data:`, error);
      }
    } catch (saveError) {
      console.error(`[${requestId}] Error saving sync data:`, saveError);
      // Continue anyway
    }
    
    console.log(`[${requestId}] Successfully published page to Shopify: ${productUrl}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        pageId: pageId,
        productId: productId,
        productUrl: productUrl,
        pageUrl: `https://${shopDomain}/pages/${pageSlug}`,
        requestId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
    
  } catch (error) {
    console.error('Unhandled error in shopify-publish-page:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: `Unhandled server error: ${error.message || 'Unknown error'}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
})

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/shopify-publish-page' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"pageId":"123","productId":"456","pageSlug":"test-page","shop":"test-shop","accessToken":"shppa_..."}'
