
// Shopify Theme Updater Edge Function
// Updates product template to automatically insert form block
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { corsHeaders } from '../_shared/cors.ts'

// Define interface for request body
interface ThemeUpdaterRequestBody {
  shop: string;
  accessToken: string;
  formId: string;
  blockId?: string;
  sectionPosition?: 'after_gallery' | 'before_description' | 'after_description' | 'before_buy_buttons' | 'after_buy_buttons';
}

// Function to fetch the main theme ID
async function getMainThemeId(shop: string, accessToken: string): Promise<string> {
  console.log('Fetching main theme ID for shop:', shop);
  
  try {
    const response = await fetch(`https://${shop}/admin/api/2023-10/themes.json`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch themes: ${response.status} ${errorText}`);
    }

    const { themes } = await response.json();
    const mainTheme = themes.find((theme: any) => theme.role === 'main');
    
    if (!mainTheme) {
      throw new Error('No main theme found');
    }

    console.log('Found main theme:', mainTheme.name, 'ID:', mainTheme.id);
    return mainTheme.id;
  } catch (error) {
    console.error('Error fetching main theme ID:', error);
    throw error;
  }
}

// Function to fetch product template JSON
async function getProductTemplate(shop: string, accessToken: string, themeId: string): Promise<any> {
  console.log(`Fetching product template for theme ID: ${themeId}`);
  
  try {
    // First check for sections/product-template.json (newer themes)
    let response = await fetch(`https://${shop}/admin/api/2023-10/themes/${themeId}/assets.json?asset[key]=sections/product-template.json`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      }
    });

    // If not found, try templates/product.json (newer themes using JSON templates)
    if (!response.ok) {
      response = await fetch(`https://${shop}/admin/api/2023-10/themes/${themeId}/assets.json?asset[key]=templates/product.json`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken
        }
      });
    }

    // If still not found, try sections/product.liquid (older themes)
    if (!response.ok) {
      response = await fetch(`https://${shop}/admin/api/2023-10/themes/${themeId}/assets.json?asset[key]=sections/product.liquid`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken
        }
      });
    }

    if (!response.ok) {
      // Last attempt - try the default template (Dawn theme)
      response = await fetch(`https://${shop}/admin/api/2023-10/themes/${themeId}/assets.json?asset[key]=templates/product.json`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch product template: ${response.status} ${errorText}`);
      }
    }

    const { asset } = await response.json();
    console.log(`Successfully fetched product template: ${asset.key}`);
    
    const isJson = asset.key.endsWith('.json');
    if (isJson) {
      // For JSON templates, parse the content
      const content = JSON.parse(asset.value);
      return {
        key: asset.key,
        content,
        isJson: true
      };
    } else {
      // For liquid templates, return as is
      return {
        key: asset.key,
        content: asset.value,
        isJson: false
      };
    }
  } catch (error) {
    console.error('Error fetching product template:', error);
    throw error;
  }
}

// Function to update product template to include our form block
async function updateProductTemplate(shop: string, accessToken: string, themeId: string, 
  template: any, formId: string, blockId: string, position: string): Promise<boolean> {
  
  console.log(`Updating product template ${template.key} with form ID: ${formId}`);
  
  try {
    let updatedContent;
    const blockIdToUse = blockId || `codform-container-${formId.substring(0, 8)}`;
    
    if (template.isJson) {
      // Handle JSON template (modern themes)
      const content = template.content;
      
      // Check if our block is already in the template
      const sections = content.sections || {};
      const alreadyExists = Object.values(sections).some((section: any) => {
        return section.type === 'theme-extension-codform.codform_form';
      });
      
      if (alreadyExists) {
        console.log('Form block already exists in template, updating settings');
        
        // Update existing block
        for (const [sectionId, section] of Object.entries(sections)) {
          if ((section as any).type === 'theme-extension-codform.codform_form') {
            (section as any).settings = {
              ...(section as any).settings || {},
              form_id: formId,
              block_id: blockIdToUse
            };
          }
        }
      } else {
        console.log('Adding new form block to template');
        
        // Find main product section - usually has product reference
        let productSectionId = '';
        let mainContentSectionOrder = [];
        
        // First, check for the main content layout section
        for (const [sectionId, section] of Object.entries(sections)) {
          if ((section as any).type === 'main-product') {
            productSectionId = sectionId;
            break;
          }
          
          // For Dawn theme structure
          if ((section as any).type === 'main-product' || 
              (section as any).type === 'product-template' ||
              sectionId === 'main' || 
              sectionId === 'product-template') {
            productSectionId = sectionId;
            break;
          }
        }
        
        // If we found a main product section
        if (productSectionId) {
          // Create a new unique section ID for our form
          const formSectionId = `codform-${Date.now()}`;
          
          // Add our form section to the sections object
          sections[formSectionId] = {
            type: 'theme-extension-codform.codform_form',
            settings: {
              form_id: formId,
              block_id: blockIdToUse,
              title: 'اطلب المنتج الآن - الدفع عند الاستلام',
              description: 'املأ النموذج التالي لطلب المنتج والدفع عند استلام المنتج.'
            }
          };
          
          // Get the order array to determine where to place our section
          if (content.order) {
            // Clone the order array
            const newOrder = [...content.order];
            
            // Find where to insert our section
            const productSectionIndex = newOrder.indexOf(productSectionId);
            if (productSectionIndex !== -1) {
              // Insert after the product section
              newOrder.splice(productSectionIndex + 1, 0, formSectionId);
              content.order = newOrder;
            } else {
              // If we couldn't find it, just append to the end
              content.order.push(formSectionId);
            }
          }
        } else {
          // If we couldn't find a product section, add to a reasonable location
          const formSectionId = `codform-${Date.now()}`;
          sections[formSectionId] = {
            type: 'theme-extension-codform.codform_form',
            settings: {
              form_id: formId,
              block_id: blockIdToUse,
              title: 'اطلب المنتج الآن - الدفع عند الاستلام',
              description: 'املأ النموذج التالي لطلب المنتج والدفع عند استلام المنتج.'
            }
          };
          
          // Add to order if it exists
          if (content.order) {
            content.order.push(formSectionId);
          }
        }
      }
      
      // Prepare the updated content
      updatedContent = JSON.stringify(content);
      
    } else {
      // Handle Liquid template (older themes)
      let liquidContent = template.content;
      
      // Check if our block is already in the template
      if (liquidContent.includes('codform_form')) {
        console.log('Form block already exists in Liquid template, not modifying');
        return true;
      }
      
      // Define the block to insert
      const formBlock = `
{% section 'theme-extension-codform.codform_form' %}
`;
      
      // Look for common insertion points
      const insertionPoints = [
        'id="shopify-section-product-template"',
        'class="product-template',
        'class="product-section',
        'id="ProductSection',
        '<form action="/cart/add"'
      ];
      
      let inserted = false;
      for (const point of insertionPoints) {
        if (liquidContent.includes(point)) {
          const index = liquidContent.indexOf(point);
          const closingTagIndex = liquidContent.indexOf('>', index);
          
          if (closingTagIndex !== -1) {
            // Insert after the closing tag
            liquidContent = liquidContent.substring(0, closingTagIndex + 1) + 
                          formBlock + 
                          liquidContent.substring(closingTagIndex + 1);
            inserted = true;
            break;
          }
        }
      }
      
      if (!inserted) {
        // If we couldn't find a good insertion point, add near the end of the file
        liquidContent = liquidContent + '\n' + formBlock;
      }
      
      updatedContent = liquidContent;
    }
    
    // Update the template asset
    const response = await fetch(`https://${shop}/admin/api/2023-10/themes/${themeId}/assets.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        asset: {
          key: template.key,
          value: updatedContent
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update template: ${response.status} ${errorText}`);
    }

    console.log(`Successfully updated product template: ${template.key}`);
    return true;
  } catch (error) {
    console.error('Error updating product template:', error);
    throw error;
  }
}

// Main handler function
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestId = `edge_${Math.random().toString(36).substring(2, 8)}`;
    console.log(`[${requestId}] Received theme updater request`);

    // Parse request body
    const { shop, accessToken, formId, blockId, sectionPosition } = await req.json() as ThemeUpdaterRequestBody;

    if (!shop || !accessToken || !formId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters' 
        }),
        { 
          status: 400,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    console.log(`[${requestId}] Processing request for shop: ${shop}, formId: ${formId}`);

    // Step 1: Get the main theme ID
    const themeId = await getMainThemeId(shop, accessToken);
    
    // Step 2: Get the product template
    const template = await getProductTemplate(shop, accessToken, themeId);
    
    // Step 3: Update the template to include our form block
    const position = sectionPosition || 'after_buy_buttons';
    const success = await updateProductTemplate(
      shop, 
      accessToken, 
      themeId, 
      template, 
      formId, 
      blockId || '', 
      position
    );

    console.log(`[${requestId}] Template update completed successfully: ${success}`);

    return new Response(
      JSON.stringify({ 
        success,
        theme: {
          id: themeId,
          template: template.key
        }
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error in theme updater function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
