
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface PublishPageRequest {
  pageId: string;
  pageSlug: string;
  shop: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { pageId, pageSlug, shop } = await req.json() as PublishPageRequest;

    if (!pageId || !pageSlug || !shop) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Missing required parameters: pageId, pageSlug, and shop are required'
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Publishing page ${pageId} with slug ${pageSlug} to shop ${shop}`);

    // Get the page content
    const { data: pageData, error: pageError } = await supabase
      .from('landing_pages')
      .select(`
        *,
        landing_page_templates (content)
      `)
      .eq('id', pageId)
      .single();
    
    if (pageError || !pageData) {
      console.error("Error fetching page data:", pageError);
      return new Response(JSON.stringify({
        success: false,
        message: 'Page not found in database'
      }), { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get the shop's access token
    const { data: shopData, error: shopError } = await supabase
      .from('shopify_stores')
      .select('access_token')
      .eq('shop', shop)
      .single();
      
    if (shopError || !shopData || !shopData.access_token) {
      console.error("Error fetching shop access token:", shopError);
      return new Response(JSON.stringify({
        success: false,
        message: 'Shop access token not found'
      }), { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Normalize shop domain
    const normalizedShop = shop.includes('myshopify.com') 
      ? shop 
      : `${shop}.myshopify.com`;
      
    // Get page template content
    const templateContent = pageData.landing_page_templates?.[0]?.content;
    
    if (!templateContent || !templateContent.sections) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Page content not found'
      }), { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate HTML content for the page
    const htmlContent = generateShopifyPageHtml(pageData.title, templateContent);

    // Create or update page in Shopify using GraphQL API
    const graphqlEndpoint = `https://${normalizedShop}/admin/api/2023-04/graphql.json`;
    const accessToken = shopData.access_token;

    // First check if page exists
    const checkPageQuery = `
      query {
        pages(first: 1, query: "handle:${pageSlug}") {
          edges {
            node {
              id
              title
            }
          }
        }
      }
    `;

    const checkResponse = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({ query: checkPageQuery })
    });

    if (!checkResponse.ok) {
      const errorText = await checkResponse.text();
      console.error("Error checking if page exists:", errorText);
      return new Response(JSON.stringify({
        success: false,
        message: 'Error checking if page exists in Shopify'
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const checkData = await checkResponse.json();
    const existingPage = checkData?.data?.pages?.edges?.[0]?.node;
    
    let mutation;
    if (existingPage) {
      // Update existing page
      mutation = `
        mutation {
          pageUpdate(
            input: {
              id: "${existingPage.id}",
              title: "${pageData.title}",
              body: ${JSON.stringify(htmlContent)},
              isPublished: true
            }
          ) {
            page {
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
    } else {
      // Create new page
      mutation = `
        mutation {
          pageCreate(
            input: {
              title: "${pageData.title}",
              handle: "${pageSlug}",
              body: ${JSON.stringify(htmlContent)},
              isPublished: true
            }
          ) {
            page {
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
    }

    const response = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({ query: mutation })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error creating/updating Shopify page:", errorText);
      return new Response(JSON.stringify({
        success: false,
        message: 'Error publishing to Shopify'
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const responseData = await response.json();
    
    // Check if there were any errors
    const pageResponse = existingPage 
      ? responseData?.data?.pageUpdate
      : responseData?.data?.pageCreate;
      
    if (pageResponse?.userErrors?.length > 0) {
      console.error("Errors from Shopify:", pageResponse.userErrors);
      return new Response(JSON.stringify({
        success: false,
        message: pageResponse.userErrors[0].message
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Save sync record in database
    const pageUrl = `https://${normalizedShop}/pages/${pageSlug}`;
    
    // Try to create the shopify_page_syncs table if it doesn't exist
    try {
      await supabase.rpc('create_table_if_not_exists', {
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
    } catch (err) {
      console.log("Table may already exist or couldn't be created:", err);
    }
    
    // Check if sync record already exists
    try {
      const { data: existingSyncData, error: existingSyncError } = await supabase
        .from('shopify_page_syncs')
        .select('id')
        .eq('page_id', pageId)
        .limit(1);
        
      if (existingSyncError) {
        console.error("Error checking existing sync record:", existingSyncError);
      }
      
      if (existingSyncData && existingSyncData.length > 0) {
        // Update existing record
        await supabase
          .from('shopify_page_syncs')
          .update({
            synced_url: pageUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSyncData[0].id);
      } else {
        // Create new record
        await supabase
          .from('shopify_page_syncs')
          .insert({
            page_id: pageId,
            shop_id: shop,
            synced_url: pageUrl
          });
      }
    } catch (e) {
      console.error("Error handling sync record:", e);
      // Continue despite error, as this is not critical
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Page published to Shopify successfully',
      pageUrl
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error("Error in shopify-publish-page:", error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Internal server error',
      error: error.message
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper function to generate HTML content from page sections
function generateShopifyPageHtml(title: string, templateContent: any): string {
  const sections = templateContent.sections || [];
  
  let html = `
    <div class="codform-landing-page">
      <h1>${title}</h1>
  `;
  
  sections.forEach((section: any) => {
    switch (section.type) {
      case 'hero':
        html += `
          <div class="section hero-section">
            <h2>${section.title || ''}</h2>
            <p>${section.subtitle || ''}</p>
            ${section.image ? `<img src="${section.image}" alt="${section.title || ''}" />` : ''}
            ${section.cta ? `<a href="${section.ctaLink || '#'}" class="cta-button">${section.cta}</a>` : ''}
          </div>
        `;
        break;
        
      case 'text':
        html += `
          <div class="section text-section">
            ${section.content || ''}
          </div>
        `;
        break;
        
      case 'image':
        html += `
          <div class="section image-section">
            ${section.image ? `<img src="${section.image}" alt="${section.alt || ''}" />` : ''}
            ${section.caption ? `<p class="caption">${section.caption}</p>` : ''}
          </div>
        `;
        break;
        
      case 'products':
        html += `
          <div class="section products-section">
            <h2>${section.title || 'Products'}</h2>
            <!-- Products will be loaded dynamically on the Shopify page -->
          </div>
        `;
        break;
        
      default:
        html += `
          <div class="section">
            <!-- Unknown section type: ${section.type} -->
          </div>
        `;
    }
  });
  
  html += `
    </div>
    <style>
      .codform-landing-page {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .section {
        margin-bottom: 40px;
      }
      .hero-section {
        text-align: center;
        padding: 40px 20px;
      }
      .hero-section img {
        max-width: 100%;
        height: auto;
        margin: 20px 0;
      }
      .cta-button {
        display: inline-block;
        padding: 10px 20px;
        background-color: #4F46E5;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        font-weight: 500;
      }
      .image-section img {
        max-width: 100%;
        height: auto;
      }
      .caption {
        font-size: 0.9em;
        color: #666;
        text-align: center;
        margin-top: 10px;
      }
    </style>
  `;
  
  return html;
}
