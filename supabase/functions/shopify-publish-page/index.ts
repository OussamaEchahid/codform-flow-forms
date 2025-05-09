
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
    console.log(`[${requestId}] Creating shopify_page_syncs table`);
    await supabase.rpc('create_table_if_not_exists', {
      p_table_name: 'shopify_page_syncs',
      p_table_definition: `
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        page_id UUID NOT NULL,
        shop_id TEXT NOT NULL,
        synced_url TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
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
      throw new Error(`Failed to fetch Shopify access token: ${tokenError?.message || 'No token found'}`);
    }
    
    const accessToken = tokenData.access_token;
    const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;

    // First check if the page exists in Shopify
    console.log(`[${requestId}] Fetching Shopify page with handle: ${pageSlug}`);
    
    const pageQuery = await fetch(`https://${shopDomain}/admin/api/2021-07/pages.json?handle=${pageSlug}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      }
    });
    
    const pagesData = await pageQuery.json();
    
    let shopifyPageId;
    let pageUrl;
    
    // Convert page content to HTML
    const htmlContent = convertTemplateToHTML(pageContent);
    
    if (pagesData.pages && pagesData.pages.length > 0) {
      // Page exists, update it
      shopifyPageId = pagesData.pages[0].id;
      console.log(`[${requestId}] Updating existing Shopify page with handle: ${pageSlug}`);
      console.log(`[${requestId}] Updating existing Shopify page: ${shopifyPageId}`);
      
      const updateResponse = await fetch(`https://${shopDomain}/admin/api/2021-07/pages/${shopifyPageId}.json`, {
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
      
      const updatedPage = await updateResponse.json();
      pageUrl = `https://${shopDomain}/pages/${pageSlug}`;
      
    } else {
      // Page doesn't exist, create it
      const pageTitle = pageSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      console.log(`[${requestId}] Creating new Shopify page with handle: ${pageSlug}`);
      console.log(`[${requestId}] Creating new Shopify page: ${pageTitle}`);
      
      const createResponse = await fetch(`https://${shopDomain}/admin/api/2021-07/pages.json`, {
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
    }
    
    // If there's a product ID associated, update the product as well
    if (productId) {
      // Handle the case where productId is a Shopify GID
      let shopifyProductId = productId;
      
      if (productId.startsWith('gid://shopify/Product/')) {
        console.log(`[${requestId}] Extracting Shopify product ID from GID: ${productId}`);
        const parts = productId.split('/');
        shopifyProductId = parts[parts.length - 1];
        console.log(`[${requestId}] Extracted Shopify product ID from GID: ${shopifyProductId}`);
      }
      
      // Now update the product with our landing page content
      console.log(`[${requestId}] Updating product ${shopifyProductId} with landing page content`);
      
      // First, fetch the product to get its current data
      const productResponse = await fetch(`https://${shopDomain}/admin/api/2023-04/products/${shopifyProductId}.json`, {
        headers: {
          'X-Shopify-Access-Token': accessToken
        }
      });
      
      if (!productResponse.ok) {
        const errorText = await productResponse.text();
        console.error(`Error fetching product data: ${errorText}`);
        throw new Error(`Failed to fetch product data: ${productResponse.status}`);
      }
      
      const productData = await productResponse.json();
      
      // Update the product with our custom landing page content
      const updateProductResponse = await fetch(`https://${shopDomain}/admin/api/2023-04/products/${shopifyProductId}.json`, {
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
        throw new Error(`Failed to update product: ${updateProductResponse.status} ${errorText}`);
      }
      
      console.log(`[${requestId}] Successfully updated product ${shopifyProductId} with landing page content`);
      
      // Now fetch the product handle to generate a proper URL
      console.log(`[${requestId}] Fetching product handle for ID: ${shopifyProductId}`);
      const { product } = await productData;
      if (product && product.handle) {
        // Add the product URL to our response
        pageUrl = `https://${shopDomain}/products/${product.handle}`;
      }
    }
    
    // Save the sync information to the database
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
      console.error(`Error saving sync data: ${syncError.message}`);
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
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'An error occurred while publishing the page'
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
