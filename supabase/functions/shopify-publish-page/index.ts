
import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Generate a unique request ID for tracking
    const body = await req.json();
    const { pageId, pageSlug, shop, productId, requestId, timestamp } = body;
    
    // Use provided request ID or generate a new one
    const trackingId = requestId || Math.random().toString(36).substring(2, 10);
    const requestTime = timestamp || new Date().toISOString();
    
    console.log(`[${trackingId}] Processing shopify-publish-page request at ${requestTime}`);
    
    if (!pageId || !pageSlug || !shop) {
      throw new Error('Missing required parameters: pageId, pageSlug, or shop');
    }
    
    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create the shopify_page_syncs table if it doesn't exist
    console.log(`[${trackingId}] Creating shopify_page_syncs table if it doesn't exist`);
    try {
      await supabase.rpc('create_table_if_not_exists', {
        p_table_name: 'shopify_page_syncs',
        p_table_definition: `
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          page_id UUID NOT NULL,
          shop_id TEXT NOT NULL,
          synced_url TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          UNIQUE(page_id)
        `
      });
    } catch (tableError) {
      console.error(`[${trackingId}] Error creating table if not exists: ${tableError}`);
      // Continue execution even if this fails
    }

    // Check for product ID linking
    if (productId) {
      console.log(`[${trackingId}] Linking with product: ${productId}`);
    }

    // Fetch the landing page template content
    const { data: templateData, error: templateError } = await supabase
      .from('landing_page_templates')
      .select('content')
      .eq('page_id', pageId)
      .single();
      
    if (templateError) {
      console.error(`[${trackingId}] Error fetching template:`, templateError);
      throw new Error(`Failed to fetch landing page template: ${templateError.message}`);
    }
    
    if (!templateData || !templateData.content) {
      throw new Error('No content found for this landing page');
    }
    
    // Get template content
    const pageContent = templateData.content;

    // Fetch the shopify access token
    const { data: tokenData, error: tokenError } = await supabase
      .from('shopify_stores')
      .select('access_token')
      .eq('shop', shop)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
      
    if (tokenError || !tokenData) {
      console.error(`[${trackingId}] Error fetching access token:`, tokenError);
      throw new Error(`Failed to fetch Shopify access token: ${tokenError?.message || 'No token found'}`);
    }
    
    const accessToken = tokenData.access_token;
    if (!accessToken || accessToken === 'placeholder_token') {
      throw new Error('Invalid or missing Shopify access token. Please reconnect your store.');
    }
    
    const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;

    // Test the access token first with a simple API call
    console.log(`[${trackingId}] Testing access token validity for shop: ${shopDomain}`);
    try {
      const shopResponse = await fetch(`https://${shopDomain}/admin/api/2023-07/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': accessToken
        }
      });
      
      if (!shopResponse.ok) {
        const responseText = await shopResponse.text();
        console.error(`[${trackingId}] Token validation failed: ${shopResponse.status} ${responseText}`);
        throw new Error(`Access token is invalid or expired. Please reconnect your Shopify store. Status: ${shopResponse.status}`);
      }
      
      console.log(`[${trackingId}] Access token validated successfully`);
    } catch (tokenTestError) {
      console.error(`[${trackingId}] Error testing token:`, tokenTestError);
      throw new Error(`Failed to validate access token: ${tokenTestError instanceof Error ? tokenTestError.message : 'Unknown error'}`);
    }

    // First check if the page exists in Shopify
    console.log(`[${trackingId}] Fetching Shopify page with handle: ${pageSlug}`);
    
    try {
      const pageQuery = await fetch(`https://${shopDomain}/admin/api/2023-07/pages.json?handle=${pageSlug}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken
        }
      });
      
      if (!pageQuery.ok) {
        const errorText = await pageQuery.text();
        throw new Error(`Failed to query Shopify pages: ${pageQuery.status} ${errorText}`);
      }
      
      const pagesData = await pageQuery.json();
      
      let shopifyPageId;
      let pageUrl;
      
      // Convert page content to HTML
      const htmlContent = convertTemplateToHTML(pageContent);
      
      // First, check if our app's metaobject definition exists
      console.log(`[${trackingId}] Checking if app_dlili metaobject definition exists`);
      
      let definitionId;
      let appDefinition;
      
      try {
        // Use GraphQL for better reliability with metaobjects
        const metaobjectQuery = `
          query {
            metaobjectDefinitions(first: 10) {
              edges {
                node {
                  id
                  name
                  type
                }
              }
            }
          }
        `;
        
        const graphqlResponse = await fetch(`https://${shopDomain}/admin/api/2023-07/graphql.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken
          },
          body: JSON.stringify({ query: metaobjectQuery })
        });
        
        if (!graphqlResponse.ok) {
          const errorText = await graphqlResponse.text();
          console.error(`[${trackingId}] GraphQL query error: ${graphqlResponse.status} ${errorText}`);
          throw new Error(`GraphQL query failed: ${graphqlResponse.status}`);
        }
        
        const graphqlData = await graphqlResponse.json();
        console.log(`[${trackingId}] GraphQL response received`);
        
        if (graphqlData.data && graphqlData.data.metaobjectDefinitions) {
          const definitions = graphqlData.data.metaobjectDefinitions.edges.map((edge: any) => edge.node);
          appDefinition = definitions.find((def: any) => def.type === 'app_dlili');
          
          if (appDefinition) {
            definitionId = appDefinition.id;
            console.log(`[${trackingId}] Found existing metaobject definition with ID: ${definitionId}`);
          }
        }
      } catch (graphqlError) {
        console.error(`[${trackingId}] Error fetching metaobject definitions with GraphQL:`, graphqlError);
        console.log(`[${trackingId}] Falling back to REST API`);
        
        // Fall back to REST API if GraphQL fails
        try {
          const metaobjectDefinitionsResponse = await fetch(`https://${shopDomain}/admin/api/2023-10/metaobject_definitions.json`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': accessToken
            }
          });
          
          if (!metaobjectDefinitionsResponse.ok) {
            const errorText = await metaobjectDefinitionsResponse.text();
            throw new Error(`Failed to fetch metaobject definitions: ${metaobjectDefinitionsResponse.status} ${errorText}`);
          }
          
          const metaobjectDefinitions = await metaobjectDefinitionsResponse.json();
          appDefinition = metaobjectDefinitions.metaobject_definitions?.find((def: any) => def.type === 'app_dlili');
          
          if (appDefinition) {
            definitionId = appDefinition.id;
            console.log(`[${trackingId}] Found existing metaobject definition with REST API: ${definitionId}`);
          }
        } catch (restError) {
          console.error(`[${trackingId}] REST API also failed:`, restError);
          // We'll continue and create the definition below if needed
        }
      }
      
      // Create our metaobject definition if it doesn't exist
      if (!appDefinition) {
        console.log(`[${trackingId}] Creating app_dlili metaobject definition`);
        try {
          const createDefinitionResponse = await fetch(`https://${shopDomain}/admin/api/2023-10/metaobject_definitions.json`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': accessToken
            },
            body: JSON.stringify({
              metaobject_definition: {
                name: "App Dlili",
                type: "app_dlili",
                fieldDefinitions: [
                  {
                    name: "Page",
                    key: "page",
                    type: "json",
                    description: "The page content"
                  },
                  {
                    name: "Reviews",
                    key: "reviews",
                    type: "json",
                    description: "Product reviews"
                  },
                  {
                    name: "Upsell",
                    key: "upsell",
                    type: "json",
                    description: "Upsell products"
                  },
                  {
                    name: "Form Settings",
                    key: "form_settings",
                    type: "json",
                    description: "Form settings"
                  },
                  {
                    name: "Quantity Offers",
                    key: "quantity_offers",
                    type: "json",
                    description: "Quantity offers"
                  },
                  {
                    name: "Tracking",
                    key: "tracking",
                    type: "json",
                    description: "Tracking settings"
                  }
                ],
                access: {
                  storefront: "PUBLIC_READ"
                }
              }
            })
          });
          
          if (!createDefinitionResponse.ok) {
            const errorText = await createDefinitionResponse.text();
            console.error(`[${trackingId}] Error creating metaobject definition: ${errorText}`);
            throw new Error(`Failed to create metaobject definition: ${createDefinitionResponse.status}`);
          }
          
          const createDefinitionData = await createDefinitionResponse.json();
          definitionId = createDefinitionData.metaobject_definition.id;
          console.log(`[${trackingId}] Created metaobject definition with ID: ${definitionId}`);
        } catch (createDefinitionError) {
          console.error(`[${trackingId}] Error creating definition:`, createDefinitionError);
          // Continue execution and focus on updating the product directly
        }
      }
      
      // Create page in Shopify if it doesn't exist
      if (pagesData.pages && pagesData.pages.length > 0) {
        shopifyPageId = pagesData.pages[0].id;
        console.log(`[${trackingId}] Updating existing Shopify page: ${shopifyPageId}`);
        
        const updateResponse = await fetch(`https://${shopDomain}/admin/api/2023-07/pages/${shopifyPageId}.json`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken
          },
          body: JSON.stringify({
            page: {
              id: shopifyPageId,
              body_html: htmlContent,
              published: true
            }
          })
        });
        
        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          throw new Error(`Failed to update page: ${updateResponse.status} ${errorText}`);
        }
        
        pageUrl = `https://${shopDomain}/pages/${pageSlug}`;
        console.log(`[${trackingId}] Successfully updated page: ${pageUrl}`);
      } else {
        // Page doesn't exist, create it
        const pageTitle = pageSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        console.log(`[${trackingId}] Creating new Shopify page: ${pageTitle}`);
        
        const createResponse = await fetch(`https://${shopDomain}/admin/api/2023-07/pages.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken
          },
          body: JSON.stringify({
            page: {
              title: pageTitle,
              handle: pageSlug,
              body_html: htmlContent,
              published: true
            }
          })
        });
        
        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          throw new Error(`Failed to create page: ${createResponse.status} ${errorText}`);
        }
        
        const createdPage = await createResponse.json();
        shopifyPageId = createdPage.page.id;
        pageUrl = `https://${shopDomain}/pages/${pageSlug}`;
        console.log(`[${trackingId}] Successfully created page: ${pageUrl}`);
      }
      
      // If there's a product ID associated, create/update metaobject and link with product metafields
      if (productId) {
        // Extract Shopify product ID from GID if needed
        let shopifyProductId = productId;
        
        if (productId.startsWith('gid://shopify/Product/')) {
          console.log(`[${trackingId}] Extracting Shopify product ID from GID: ${productId}`);
          const parts = productId.split('/');
          shopifyProductId = parts[parts.length - 1];
          console.log(`[${trackingId}] Extracted Shopify product ID: ${shopifyProductId}`);
        }
        
        // Generate a handle for the metaobject
        const metaobjectHandle = `app-dlili-${pageSlug.substring(0, 10)}-${shopifyProductId.substring(0, 6)}`;
        
        // First, fetch the product to get its current data
        console.log(`[${trackingId}] Fetching product data for ID: ${shopifyProductId}`);
        const productResponse = await fetch(`https://${shopDomain}/admin/api/2023-07/products/${shopifyProductId}.json`, {
          headers: {
            'X-Shopify-Access-Token': accessToken
          }
        });
        
        if (!productResponse.ok) {
          const errorText = await productResponse.text();
          console.error(`[${trackingId}] Error fetching product data: ${errorText}`);
          throw new Error(`Failed to fetch product data: ${productResponse.status}`);
        }
        
        const productData = await productResponse.json();
        const product = productData.product;
        
        // Update the product with our custom landing page content
        console.log(`[${trackingId}] Updating product description with landing page content`);
        try {
          const updateProductResponse = await fetch(`https://${shopDomain}/admin/api/2023-07/products/${shopifyProductId}.json`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': accessToken
            },
            body: JSON.stringify({
              product: {
                id: shopifyProductId,
                body_html: htmlContent // Replace the entire product description with our landing page content
              }
            })
          });
          
          if (!updateProductResponse.ok) {
            const errorText = await updateProductResponse.text();
            console.error(`[${trackingId}] Error updating product: ${errorText}`);
            throw new Error(`Failed to update product: ${updateProductResponse.status} ${errorText}`);
          }
          
          console.log(`[${trackingId}] Successfully updated product ${shopifyProductId} with landing page content`);
        } catch (updateProductError) {
          console.error(`[${trackingId}] Error updating product HTML:`, updateProductError);
          // Continue execution and try the metaobject approach
        }
        
        // Try to create or update the metaobject if we have a definition
        if (definitionId) {
          try {
            // Check if metaobject already exists for this page
            console.log(`[${trackingId}] Checking if metaobject exists with handle: ${metaobjectHandle}`);
            try {
              const metaobjectsResponse = await fetch(`https://${shopDomain}/admin/api/2023-07/metaobjects.json?handle=${metaobjectHandle}`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Shopify-Access-Token': accessToken
                }
              });
              
              if (!metaobjectsResponse.ok) {
                const errorText = await metaobjectsResponse.text();
                console.error(`[${trackingId}] Error checking metaobject: ${errorText}`);
                throw new Error(`Failed to check metaobjects: ${metaobjectsResponse.status}`);
              }
              
              const metaobjectsData = await metaobjectsResponse.json();
              let metaobjectId;
              
              if (metaobjectsData.metaobjects && metaobjectsData.metaobjects.length > 0) {
                // Metaobject exists, update it
                metaobjectId = metaobjectsData.metaobjects[0].id;
                console.log(`[${trackingId}] Updating existing metaobject with ID: ${metaobjectId}`);
                
                const updateMetaobjectResponse = await fetch(`https://${shopDomain}/admin/api/2023-07/metaobjects/${metaobjectId}.json`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Access-Token': accessToken
                  },
                  body: JSON.stringify({
                    metaobject: {
                      id: metaobjectId,
                      fields: [
                        {
                          key: "page",
                          value: JSON.stringify({
                            "title": pageContent.title || "",
                            "meta_description": pageContent.metaDescription || "",
                            "meta_keywords": pageContent.metaKeywords || "",
                            "content": pageContent
                          })
                        }
                      ]
                    }
                  })
                });
                
                if (!updateMetaobjectResponse.ok) {
                  const errorText = await updateMetaobjectResponse.text();
                  console.error(`[${trackingId}] Error updating metaobject: ${errorText}`);
                  throw new Error(`Failed to update metaobject: ${updateMetaobjectResponse.status}`);
                }
                
                console.log(`[${trackingId}] Successfully updated metaobject with ID: ${metaobjectId}`);
              } else {
                // Create new metaobject
                console.log(`[${trackingId}] Creating new metaobject with handle: ${metaobjectHandle}`);
                
                const createMetaobjectResponse = await fetch(`https://${shopDomain}/admin/api/2023-07/metaobjects.json`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Access-Token': accessToken
                  },
                  body: JSON.stringify({
                    metaobject: {
                      type: "app_dlili",
                      handle: metaobjectHandle,
                      fields: [
                        {
                          key: "page",
                          value: JSON.stringify({
                            "title": pageContent.title || "",
                            "meta_description": pageContent.metaDescription || "",
                            "meta_keywords": pageContent.metaKeywords || "",
                            "content": pageContent
                          })
                        }
                      ]
                    }
                  })
                });
                
                if (!createMetaobjectResponse.ok) {
                  const errorText = await createMetaobjectResponse.text();
                  console.error(`[${trackingId}] Error creating metaobject: ${errorText}`);
                  throw new Error(`Failed to create metaobject: ${createMetaobjectResponse.status}`);
                }
                
                const metaobjectData = await createMetaobjectResponse.json();
                metaobjectId = metaobjectData.metaobject.id;
                console.log(`[${trackingId}] Created metaobject with ID: ${metaobjectId}`);
              }
              
              // Set metafield for product to reference our metaobject
              if (metaobjectId) {
                console.log(`[${trackingId}] Setting metafield for product to reference metaobject`);
                try {
                  // First check if the metafield already exists
                  const existingMetafieldsResponse = await fetch(`https://${shopDomain}/admin/api/2023-07/products/${shopifyProductId}/metafields.json`, {
                    headers: {
                      'X-Shopify-Access-Token': accessToken
                    }
                  });
                  
                  const existingMetafieldsData = await existingMetafieldsResponse.json();
                  const existingMetafield = existingMetafieldsData.metafields?.find(
                    (m: any) => m.namespace === "codform" && m.key === "landing_page"
                  );
                  
                  if (existingMetafield) {
                    // Update existing metafield
                    const updateMetafieldResponse = await fetch(`https://${shopDomain}/admin/api/2023-07/products/${shopifyProductId}/metafields/${existingMetafield.id}.json`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'X-Shopify-Access-Token': accessToken
                      },
                      body: JSON.stringify({
                        metafield: {
                          id: existingMetafield.id,
                          value: metaobjectId,
                          type: "metaobject_reference"
                        }
                      })
                    });
                    
                    if (!updateMetafieldResponse.ok) {
                      const errorText = await updateMetafieldResponse.text();
                      console.error(`[${trackingId}] Error updating metafield: ${errorText}`);
                    } else {
                      console.log(`[${trackingId}] Successfully updated metafield reference to metaobject`);
                    }
                  } else {
                    // Create new metafield
                    const metafieldResponse = await fetch(`https://${shopDomain}/admin/api/2023-07/products/${shopifyProductId}/metafields.json`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'X-Shopify-Access-Token': accessToken
                      },
                      body: JSON.stringify({
                        metafield: {
                          namespace: "codform",
                          key: "landing_page",
                          value: metaobjectId,
                          type: "metaobject_reference"
                        }
                      })
                    });
                    
                    if (!metafieldResponse.ok) {
                      const errorText = await metafieldResponse.text();
                      console.error(`[${trackingId}] Error setting metafield: ${errorText}`);
                    } else {
                      console.log(`[${trackingId}] Successfully linked product to metaobject via metafield`);
                    }
                  }
                } catch (metafieldError) {
                  console.error(`[${trackingId}] Error with metafield operation:`, metafieldError);
                  console.log(`[${trackingId}] Continuing despite metafield error`);
                }
              }
            } catch (metaobjectError) {
              console.error(`[${trackingId}] Error with metaobject operations:`, metaobjectError);
              // Continue execution since we already updated the product HTML directly
            }
          } catch (metaobjectFlowError) {
            console.error(`[${trackingId}] Error in metaobject flow:`, metaobjectFlowError);
            // Continue since we already updated the product HTML
          }
        }
        
        // Now fetch the product handle to generate a proper URL
        if (product && product.handle) {
          // Add the product URL to our response
          pageUrl = `https://${shopDomain}/products/${product.handle}`;
          console.log(`[${trackingId}] Generated product URL: ${pageUrl}`);
        }
      }
      
      // Save the sync information to the database
      console.log(`[${trackingId}] Saving sync information to database`);
      try {
        const { data: syncData, error: syncError } = await supabase
          .from('shopify_page_syncs')
          .upsert({
            page_id: pageId,
            shop_id: shop,
            synced_url: pageUrl
          }, { onConflict: 'page_id' })
          .select()
          .single();
          
        if (syncError) {
          console.error(`[${trackingId}] Error saving sync data: ${syncError.message}`);
          // Continue anyway as this is not critical
        } else {
          console.log(`[${trackingId}] Successfully saved sync information to database`);
        }
      } catch (saveError) {
        console.error(`[${trackingId}] Error saving sync information:`, saveError);
        // Continue as this is not critical
      }
      
      console.log(`[${trackingId}] Successfully published page to Shopify: ${pageUrl}`);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Page published to Shopify successfully',
          url: pageUrl,
          requestId: trackingId,
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    } catch (apiError) {
      console.error(`[${trackingId}] Shopify API error:`, apiError);
      throw new Error(`Shopify API error: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
    }
  } catch (error) {
    console.error('Error processing request:', error);
    
    // Format error message for better debugging
    let errorMessage = 'An unknown error occurred';
    let errorDetails = null;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack;
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = JSON.stringify(error);
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        message: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

// Helper function to convert our template object to HTML
function convertTemplateToHTML(templateContent: any): string {
  if (!templateContent || !templateContent.sections) {
    return '<p>No content available</p>';
  }
  
  let html = '';
  
  // Process each section and convert to HTML
  templateContent.sections.forEach((section: any) => {
    switch (section.type) {
      case 'header':
        html += `
          <div class="landing-section header-section" style="background-color: ${section.style?.backgroundColor || '#ffffff'}; padding: ${section.style?.padding || '2rem'};">
            <h1>${section.content?.heading || 'Header'}</h1>
            <p>${section.content?.subheading || 'Subheading'}</p>
          </div>
        `;
        break;
        
      case 'testimonials':
        html += `
          <div class="landing-section testimonials-section" style="background-color: ${section.style?.backgroundColor || '#f5f5f5'}; padding: ${section.style?.padding || '2rem'};">
            <h2>${section.content?.title || 'What Our Customers Say'}</h2>
            <div class="testimonials-grid">
        `;
        
        if (section.content?.testimonials && Array.isArray(section.content.testimonials)) {
          section.content.testimonials.forEach((testimonial: any) => {
            html += `
              <div class="testimonial-item">
                <div class="stars">★★★★★</div>
                <h4>${testimonial.name || 'Customer'}</h4>
                <p>${testimonial.text || 'Great product!'}</p>
              </div>
            `;
          });
        }
        
        html += `
            </div>
          </div>
        `;
        break;
        
      case 'hero':
        html += `
          <div class="landing-section hero-section" style="background-color: ${section.style?.backgroundColor || '#f0f0f0'}; padding: ${section.style?.padding || '3rem'}; text-align: center;">
            <h1>${section.content?.heading || 'Main Headline'}</h1>
            <p>${section.content?.subheading || 'Supporting text goes here'}</p>
            ${section.content?.buttonText ? `<a href="#" class="button">${section.content.buttonText}</a>` : ''}
            ${section.content?.imageUrl ? `<img src="${section.content.imageUrl}" alt="Hero image" style="max-width: 100%; height: auto; margin-top: 2rem;">` : ''}
          </div>
        `;
        break;
        
      default:
        html += `
          <div class="landing-section">
            <h3>${section.title || 'Section'}</h3>
            <div>${section.content?.text || ''}</div>
          </div>
        `;
    }
  });
  
  // Add some basic CSS
  const css = `
    <style>
      .landing-section {
        margin-bottom: 2rem;
      }
      .testimonials-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
      }
      .testimonial-item {
        padding: 1rem;
        border: 1px solid #eee;
        border-radius: 8px;
        background: white;
      }
      .stars {
        color: gold;
      }
      .button {
        display: inline-block;
        padding: 0.75rem 1.5rem;
        background-color: #007bff;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        font-weight: bold;
      }
    </style>
  `;
  
  return css + html;
}
