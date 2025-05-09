
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.36.0";

// Define CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    const requestId = crypto.randomUUID().substring(0, 8);
    console.log(`[${requestId}] Processing shopify-publish-page request`);

    // Parse request data
    const { pageId, pageSlug, shop, productId } = await req.json();

    // Validate inputs
    if (!pageId || !pageSlug || !shop) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Missing required parameters: pageId, pageSlug, or shop" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    console.log(`[${requestId}] Publishing page ${pageId} with slug ${pageSlug} to shop ${shop}`);
    if (productId) {
      console.log(`[${requestId}] Linking with product: ${productId}`);
    }

    // Create Supabase client with admin rights to access the database
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Make sure shopify_page_syncs table exists
    await ensureTable(supabaseAdmin, requestId);

    // Get the active Shopify store data including the access token
    const { data: storeData, error: storeError } = await supabaseAdmin
      .from("shopify_stores")
      .select("*")
      .eq("shop", shop)
      .eq("is_active", true)
      .single();

    if (storeError || !storeData) {
      console.error(`[${requestId}] Error fetching store data:`, storeError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Could not find active Shopify store" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 404 
        }
      );
    }

    // Fetch landing page content from the database
    const { data: pageData, error: pageError } = await supabaseAdmin
      .from("landing_pages")
      .select(`
        id,
        title,
        slug,
        product_id,
        landing_page_templates (
          content
        )
      `)
      .eq("id", pageId)
      .single();

    if (pageError || !pageData) {
      console.error(`[${requestId}] Error fetching page data:`, pageError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Landing page not found" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 404 
        }
      );
    }

    // If productId is provided in the request, update the landing_pages table
    if (productId && pageData.product_id !== productId) {
      const { error: updateError } = await supabaseAdmin
        .from("landing_pages")
        .update({ product_id: productId })
        .eq("id", pageId);
        
      if (updateError) {
        console.error(`[${requestId}] Error updating product ID in landing page:`, updateError);
      } else {
        console.log(`[${requestId}] Updated product ID for landing page to: ${productId}`);
      }
    }

    // Extract the page content
    const pageTemplate = pageData.landing_page_templates?.[0]?.content;
    
    // Get the actual product ID to use (from request or from the database)
    const actualProductId = productId || pageData.product_id;
    
    // Generate the HTML content for the Shopify page
    const shopifyPageContent = generateShopifyPageContent(pageData, pageTemplate || {});

    // Set up the Shopify API call
    const accessToken = storeData.access_token;
    const shopDomain = shop.includes('myshopify.com') ? shop : `${shop}.myshopify.com`;
    const apiVersion = "2023-10"; // Use a stable API version

    // Check if a page with this slug already exists on Shopify
    const existingPage = await fetchShopifyPage(shopDomain, accessToken, apiVersion, pageSlug, requestId);
    let pageId2;
    let result;

    if (existingPage) {
      // Update the existing page
      console.log(`[${requestId}] Updating existing Shopify page with handle: ${pageSlug}`);
      result = await updateShopifyPage(shopDomain, accessToken, apiVersion, existingPage.id, pageData.title, shopifyPageContent, requestId);
      pageId2 = existingPage.id;
    } else {
      // Create a new page
      console.log(`[${requestId}] Creating new Shopify page with handle: ${pageSlug}`);
      result = await createShopifyPage(shopDomain, accessToken, apiVersion, pageData.title, pageSlug, shopifyPageContent, requestId);
      pageId2 = result?.page?.id;
    }

    if (!result || !pageId2) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Failed to create or update Shopify page" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 500 
        }
      );
    }

    // If we have a product ID, try to associate the page content with the product
    let productResult = null;
    if (actualProductId) {
      console.log(`[${requestId}] Attempting to associate page with product: ${actualProductId}`);
      
      try {
        // Fetch the Shopify product ID based on our stored product ID
        const { data: productData, error: productError } = await supabaseAdmin
          .from("shopify_product_settings")
          .select("product_id")
          .eq("id", actualProductId)
          .single();
          
        const shopifyProductId = productData?.product_id || actualProductId;
        
        if (shopifyProductId) {
          // Call the Shopify API to update the product with our custom page content
          productResult = await updateShopifyProduct(
            shopDomain, 
            accessToken, 
            apiVersion, 
            shopifyProductId, 
            pageData.title,
            shopifyPageContent, 
            requestId
          );
          
          if (productResult) {
            console.log(`[${requestId}] Successfully updated product ${shopifyProductId} with landing page content`);
          }
        }
      } catch (error) {
        console.error(`[${requestId}] Error associating page with product:`, error);
        // We don't want to fail the entire operation if just the product update fails
      }
    }

    // Save the sync record
    const syncedUrl = `https://${shopDomain}/pages/${pageSlug}`;
    
    try {
      // Because the unique constraint doesn't exist yet, do a check first
      const { data: existingSyncData } = await supabaseAdmin
        .from("shopify_page_syncs")
        .select("id")
        .eq("page_id", pageId)
        .eq("shop_id", shop);
        
      if (existingSyncData && existingSyncData.length > 0) {
        // Update existing record
        await supabaseAdmin
          .from("shopify_page_syncs")
          .update({ synced_url: syncedUrl })
          .eq("id", existingSyncData[0].id);
      } else {
        // Create new record
        await supabaseAdmin
          .from("shopify_page_syncs")
          .insert({
            page_id: pageId,
            shop_id: shop,
            synced_url: syncedUrl
          });
      }
    } catch (syncError) {
      console.error(`[${requestId}] Error saving sync record:`, syncError);
      // Don't fail the whole operation for this
    }

    // Get product URL if a product was associated
    let productUrl = null;
    if (productResult && actualProductId) {
      // Get the product handle to construct a URL
      try {
        const productHandle = await getShopifyProductHandle(
          shopDomain, 
          accessToken, 
          apiVersion, 
          actualProductId, 
          requestId
        );
        
        if (productHandle) {
          productUrl = `https://${shopDomain}/products/${productHandle}`;
        }
      } catch (error) {
        console.error(`[${requestId}] Error getting product handle:`, error);
        // Don't fail for this
      }
    }

    console.log(`[${requestId}] Successfully published page to Shopify: ${syncedUrl}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Page published successfully", 
        url: syncedUrl,
        productUrl: productUrl 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in shopify-publish-page:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || "An unknown error occurred" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 500 
      }
    );
  }
});

// Helper Functions

// Make sure the shopify_page_syncs table exists
async function ensureTable(supabaseClient, requestId) {
  try {
    // Check if the table exists
    const { data, error } = await supabaseClient
      .rpc('check_table_exists', { table_name: 'shopify_page_syncs' })
      .single();

    // If the function doesn't exist, create it first
    if (error && error.message.includes('function "check_table_exists" does not exist')) {
      console.log(`[${requestId}] Creating check_table_exists function`);
      await supabaseClient.rpc('exec_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION public.check_table_exists(table_name TEXT)
          RETURNS BOOLEAN
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            RETURN EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = table_name
            );
          END;
          $$;
        `
      });
      
      // Check again after creating the function
      const { data: recheck } = await supabaseClient
        .rpc('check_table_exists', { table_name: 'shopify_page_syncs' })
        .single();
        
      if (!recheck) {
        // Table doesn't exist, create it
        console.log(`[${requestId}] Creating shopify_page_syncs table`);
        await supabaseClient.rpc('create_table_if_not_exists', {
          p_table_name: 'shopify_page_syncs',
          p_table_definition: `
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            page_id UUID NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
            shop_id TEXT NOT NULL,
            synced_url TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          `
        });
      }
    } else if (!data) {
      // Table doesn't exist, create it
      console.log(`[${requestId}] Creating shopify_page_syncs table`);
      await supabaseClient.rpc('create_table_if_not_exists', {
        p_table_name: 'shopify_page_syncs',
        p_table_definition: `
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          page_id UUID NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
          shop_id TEXT NOT NULL,
          synced_url TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        `
      });
    }
  } catch (error) {
    console.error(`[${requestId}] Error ensuring table exists:`, error);
    // Continue anyway, the table might still exist
  }
}

// Generate HTML content for the Shopify page from the landing page template
function generateShopifyPageContent(pageData, pageTemplate) {
  // A very basic HTML template for now
  // In a real application, you would generate this based on the page template data
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${pageData.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    .header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .content {
      margin-bottom: 2rem;
    }
    .footer {
      text-align: center;
      margin-top: 3rem;
      padding-top: 1rem;
      border-top: 1px solid #eee;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${pageData.title}</h1>
    </div>
    <div class="content">
      <!-- Here you would render the actual content based on the page template -->
      <p>This is a landing page generated by the Customizable Online Store app.</p>
      ${generateContentFromTemplate(pageTemplate)}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} - Generated by Customizable Online Store</p>
    </div>
  </div>
  
  <!-- Add a script to potentially communicate with the parent Shopify store -->
  <script>
    // Here you could add any client-side JavaScript needed
    document.addEventListener('DOMContentLoaded', function() {
      console.log('Landing page loaded successfully');
    });
  </script>
</body>
</html>
  `;
  
  return html;
}

// Generate content from the template object
function generateContentFromTemplate(template) {
  if (!template || typeof template !== 'object') {
    return '<p>No content available</p>';
  }
  
  // Extract sections from the template and render them
  let content = '';
  
  try {
    // Handle template as JSON object
    // This is a simplified example - in reality, you would traverse the template
    // structure and render each section according to its type
    if (template.sections) {
      content += '<div class="sections">';
      for (const section of template.sections || []) {
        content += `<div class="section section-${section.type || 'default'}">`;
        
        if (section.title) {
          content += `<h2>${section.title}</h2>`;
        }
        
        if (section.content) {
          if (typeof section.content === 'object') {
            if (section.content.heading) {
              content += `<h3>${section.content.heading}</h3>`;
            }
            if (section.content.subheading) {
              content += `<p class="subheading">${section.content.subheading}</p>`;
            }
            // Add more content types as needed
          } else {
            content += `<div>${section.content}</div>`;
          }
        }
        
        // Handle elements within the section
        if (section.elements && Array.isArray(section.elements)) {
          for (const element of section.elements) {
            content += `<div class="element element-${element.type || 'default'}">`;
            
            if (element.title) {
              content += `<h3>${element.title}</h3>`;
            }
            
            if (element.content) {
              content += `<p>${element.content}</p>`;
            }
            
            if (element.image) {
              content += `<img src="${element.image}" alt="${element.alt || element.title || 'Image'}" />`;
            }
            
            content += '</div>';
          }
        }
        
        content += '</div>';
      }
      content += '</div>';
    } else {
      // Fallback if no sections are defined
      content = '<p>This landing page has no content sections defined.</p>';
    }
  } catch (error) {
    console.error('Error generating content from template:', error);
    content = '<p>Error generating content from template</p>';
  }
  
  return content;
}

// Fetch a page from Shopify by handle (slug)
async function fetchShopifyPage(shopDomain, accessToken, apiVersion, handle, requestId) {
  console.log(`[${requestId}] Fetching Shopify page with handle: ${handle}`);
  
  try {
    const response = await fetch(`https://${shopDomain}/admin/api/${apiVersion}/pages.json?handle=${handle}`, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json"
      }
    });
    
    if (!response.ok) {
      console.error(`[${requestId}] Error fetching Shopify page: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    // Return the first page with matching handle, or null if none found
    return data.pages && data.pages.length > 0 ? data.pages[0] : null;
  } catch (error) {
    console.error(`[${requestId}] Error fetching Shopify page:`, error);
    return null;
  }
}

// Create a new page in Shopify
async function createShopifyPage(shopDomain, accessToken, apiVersion, title, handle, html, requestId) {
  console.log(`[${requestId}] Creating new Shopify page: ${title}`);
  
  try {
    const pageData = {
      page: {
        title: title,
        handle: handle,
        body_html: html,
        published: true
      }
    };
    
    const response = await fetch(`https://${shopDomain}/admin/api/${apiVersion}/pages.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(pageData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] Error creating Shopify page: ${response.status} ${response.statusText}`);
      console.error(`[${requestId}] Response body: ${errorText}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`[${requestId}] Error creating Shopify page:`, error);
    return null;
  }
}

// Update an existing page in Shopify
async function updateShopifyPage(shopDomain, accessToken, apiVersion, pageId, title, html, requestId) {
  console.log(`[${requestId}] Updating existing Shopify page: ${pageId}`);
  
  try {
    const pageData = {
      page: {
        id: pageId,
        title: title,
        body_html: html,
        published: true
      }
    };
    
    const response = await fetch(`https://${shopDomain}/admin/api/${apiVersion}/pages/${pageId}.json`, {
      method: "PUT",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(pageData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] Error updating Shopify page: ${response.status} ${response.statusText}`);
      console.error(`[${requestId}] Response body: ${errorText}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`[${requestId}] Error updating Shopify page:`, error);
    return null;
  }
}

// Get the handle (slug) of a Shopify product
async function getShopifyProductHandle(shopDomain, accessToken, apiVersion, productId, requestId) {
  console.log(`[${requestId}] Fetching product handle for ID: ${productId}`);
  
  try {
    const response = await fetch(`https://${shopDomain}/admin/api/${apiVersion}/products/${productId}.json`, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json"
      }
    });
    
    if (!response.ok) {
      console.error(`[${requestId}] Error fetching product: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.product && data.product.handle) {
      return data.product.handle;
    }
    
    return null;
  } catch (error) {
    console.error(`[${requestId}] Error fetching product handle:`, error);
    return null;
  }
}

// Update a Shopify product with custom content
async function updateShopifyProduct(shopDomain, accessToken, apiVersion, productId, title, html, requestId) {
  console.log(`[${requestId}] Updating product ${productId} with landing page content`);
  
  try {
    // Get the current product data first
    const getResponse = await fetch(`https://${shopDomain}/admin/api/${apiVersion}/products/${productId}.json`, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json"
      }
    });
    
    if (!getResponse.ok) {
      console.error(`[${requestId}] Error fetching product for update: ${getResponse.status} ${getResponse.statusText}`);
      return null;
    }
    
    const productData = await getResponse.json();
    const product = productData.product;
    
    if (!product) {
      console.error(`[${requestId}] Product not found: ${productId}`);
      return null;
    }
    
    // Update the product description with our custom HTML
    // We'll append to the existing description
    const updatedProduct = {
      product: {
        id: productId,
        body_html: html // Replace the product description with our custom HTML
        // Alternatively, we could append: product.body_html + html
      }
    };
    
    const updateResponse = await fetch(`https://${shopDomain}/admin/api/${apiVersion}/products/${productId}.json`, {
      method: "PUT",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updatedProduct)
    });
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error(`[${requestId}] Error updating product: ${updateResponse.status} ${updateResponse.statusText}`);
      console.error(`[${requestId}] Response body: ${errorText}`);
      return null;
    }
    
    return await updateResponse.json();
  } catch (error) {
    console.error(`[${requestId}] Error updating product:`, error);
    return null;
  }
}
