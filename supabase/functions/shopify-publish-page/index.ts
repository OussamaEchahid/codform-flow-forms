
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
    const requestId = Math.random().toString(36).substring(2, 10);
    console.log(`[${requestId}] Processing shopify-publish-page request`);
    
    const { pageId, pageSlug, shop, productId } = await req.json();
    
    if (!pageId || !pageSlug || !shop) {
      throw new Error('Missing required parameters: pageId, pageSlug, or shop');
    }
    
    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create the shopify_page_syncs table if it doesn't exist
    console.log(`[${requestId}] Creating shopify_page_syncs table if it doesn't exist`);
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

    // Check for product ID linking
    if (productId) {
      console.log(`[${requestId}] Linking with product: ${productId}`);
    }

    // Fetch the landing page template content
    const { data: templateData, error: templateError } = await supabase
      .from('landing_page_templates')
      .select('content')
      .eq('page_id', pageId)
      .single();
      
    if (templateError) {
      console.error(`[${requestId}] Error fetching template:`, templateError);
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
      console.error(`[${requestId}] Error fetching access token:`, tokenError);
      throw new Error(`Failed to fetch Shopify access token: ${tokenError?.message || 'No token found'}`);
    }
    
    const accessToken = tokenData.access_token;
    if (!accessToken || accessToken === 'placeholder_token') {
      throw new Error('Invalid or missing Shopify access token. Please reconnect your store.');
    }
    
    const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;

    // First check if the page exists in Shopify
    console.log(`[${requestId}] Fetching Shopify page with handle: ${pageSlug}`);
    
    try {
      const pageQuery = await fetch(`https://${shopDomain}/admin/api/2023-07/pages.json?handle=${pageSlug}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken
        }
      });
      
      if (!pageQuery.ok) {
        throw new Error(`Failed to query Shopify pages: ${pageQuery.status} ${await pageQuery.text()}`);
      }
      
      const pagesData = await pageQuery.json();
      
      let shopifyPageId;
      let pageUrl;
      
      // Convert page content to HTML
      const htmlContent = convertTemplateToHTML(pageContent);
      
      // First, check if our app's metaobject definition exists
      console.log(`[${requestId}] Checking if app_dlili metaobject definition exists`);
      const metaobjectDefinitionsResponse = await fetch(`https://${shopDomain}/admin/api/2023-07/metaobject_definitions.json`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken
        }
      });
      
      if (!metaobjectDefinitionsResponse.ok) {
        throw new Error(`Failed to fetch metaobject definitions: ${metaobjectDefinitionsResponse.status} ${await metaobjectDefinitionsResponse.text()}`);
      }
      
      const metaobjectDefinitions = await metaobjectDefinitionsResponse.json();
      let appDefinition = metaobjectDefinitions.metaobject_definitions?.find((def: any) => def.type === 'app_dlili');
      let definitionId;
      
      // Create our metaobject definition if it doesn't exist
      if (!appDefinition) {
        console.log(`[${requestId}] Creating app_dlili metaobject definition`);
        const createDefinitionResponse = await fetch(`https://${shopDomain}/admin/api/2023-07/metaobject_definitions.json`, {
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
          console.error(`[${requestId}] Error creating metaobject definition: ${errorText}`);
          throw new Error(`Failed to create metaobject definition: ${createDefinitionResponse.status}`);
        }
        
        const createDefinitionData = await createDefinitionResponse.json();
        definitionId = createDefinitionData.metaobject_definition.id;
        console.log(`[${requestId}] Created metaobject definition with ID: ${definitionId}`);
      } else {
        definitionId = appDefinition.id;
        console.log(`[${requestId}] Found existing metaobject definition with ID: ${definitionId}`);
      }
      
      // Create page in Shopify if it doesn't exist
      if (pagesData.pages && pagesData.pages.length > 0) {
        shopifyPageId = pagesData.pages[0].id;
        console.log(`[${requestId}] Updating existing Shopify page: ${shopifyPageId}`);
        
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
        console.log(`[${requestId}] Successfully updated page: ${pageUrl}`);
      } else {
        // Page doesn't exist, create it
        const pageTitle = pageSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        console.log(`[${requestId}] Creating new Shopify page: ${pageTitle}`);
        
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
        console.log(`[${requestId}] Successfully created page: ${pageUrl}`);
      }
      
      // If there's a product ID associated, create/update metaobject and link with product metafields
      if (productId) {
        // Extract Shopify product ID from GID if needed
        let shopifyProductId = productId;
        
        if (productId.startsWith('gid://shopify/Product/')) {
          console.log(`[${requestId}] Extracting Shopify product ID from GID: ${productId}`);
          const parts = productId.split('/');
          shopifyProductId = parts[parts.length - 1];
          console.log(`[${requestId}] Extracted Shopify product ID: ${shopifyProductId}`);
        }
        
        // Generate a handle for the metaobject
        const metaobjectHandle = `app-dlili-${pageSlug.substring(0, 10)}-${shopifyProductId.substring(0, 6)}`;
        
        // Check if metaobject already exists for this page
        console.log(`[${requestId}] Checking if metaobject exists with handle: ${metaobjectHandle}`);
        const metaobjectsResponse = await fetch(`https://${shopDomain}/admin/api/2023-07/metaobjects.json?handle=${metaobjectHandle}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken
          }
        });
        
        if (!metaobjectsResponse.ok) {
          const errorText = await metaobjectsResponse.text();
          console.error(`[${requestId}] Error checking metaobject: ${errorText}`);
          throw new Error(`Failed to check metaobjects: ${metaobjectsResponse.status}`);
        }
        
        const metaobjectsData = await metaobjectsResponse.json();
        let metaobjectId;
        
        if (metaobjectsData.metaobjects && metaobjectsData.metaobjects.length > 0) {
          // Metaobject exists, update it
          metaobjectId = metaobjectsData.metaobjects[0].id;
          console.log(`[${requestId}] Updating existing metaobject with ID: ${metaobjectId}`);
          
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
            console.error(`[${requestId}] Error updating metaobject: ${errorText}`);
            throw new Error(`Failed to update metaobject: ${updateMetaobjectResponse.status}`);
          }
          
          console.log(`[${requestId}] Successfully updated metaobject with ID: ${metaobjectId}`);
        } else {
          // Create new metaobject
          console.log(`[${requestId}] Creating new metaobject with handle: ${metaobjectHandle}`);
          
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
            console.error(`[${requestId}] Error creating metaobject: ${errorText}`);
            throw new Error(`Failed to create metaobject: ${createMetaobjectResponse.status}`);
          }
          
          const metaobjectData = await createMetaobjectResponse.json();
          metaobjectId = metaobjectData.metaobject.id;
          console.log(`[${requestId}] Created metaobject with ID: ${metaobjectId}`);
        }
        
        // Now update the product with the metaobject reference and our landing page content
        console.log(`[${requestId}] Updating product ${shopifyProductId} with metaobject reference and landing page content`);
        
        // First, fetch the product to get its current data
        const productResponse = await fetch(`https://${shopDomain}/admin/api/2023-07/products/${shopifyProductId}.json`, {
          headers: {
            'X-Shopify-Access-Token': accessToken
          }
        });
        
        if (!productResponse.ok) {
          const errorText = await productResponse.text();
          console.error(`[${requestId}] Error fetching product data: ${errorText}`);
          throw new Error(`Failed to fetch product data: ${productResponse.status}`);
        }
        
        const productData = await productResponse.json();
        
        // Set metafield for product to reference our metaobject
        console.log(`[${requestId}] Setting metafield for product to reference metaobject`);
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
          console.error(`[${requestId}] Error setting metafield: ${errorText}`);
          console.log(`[${requestId}] Continuing despite metafield error`);
        } else {
          console.log(`[${requestId}] Successfully linked product to metaobject via metafield`);
        }
        
        // Update the product with our custom landing page content
        console.log(`[${requestId}] Updating product description with landing page content`);
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
          console.error(`[${requestId}] Error updating product: ${errorText}`);
          throw new Error(`Failed to update product: ${updateProductResponse.status} ${errorText}`);
        }
        
        console.log(`[${requestId}] Successfully updated product ${shopifyProductId} with landing page content`);
        
        // Now fetch the product handle to generate a proper URL
        console.log(`[${requestId}] Fetching product handle for ID: ${shopifyProductId}`);
        const { product } = productData;
        if (product && product.handle) {
          // Add the product URL to our response
          pageUrl = `https://${shopDomain}/products/${product.handle}`;
          console.log(`[${requestId}] Generated product URL: ${pageUrl}`);
        }
      }
      
      // Save the sync information to the database
      console.log(`[${requestId}] Saving sync information to database`);
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
        console.error(`[${requestId}] Error saving sync data: ${syncError.message}`);
        // Continue anyway as this is not critical
      }
      
      console.log(`[${requestId}] Successfully published page to Shopify: ${pageUrl}`);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Page published to Shopify successfully',
          url: pageUrl
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    } catch (apiError) {
      console.error(`[${requestId}] Shopify API error:`, apiError);
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
