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

// Function to create a snippet for form inclusion
async function createFormSnippet(shop: string, accessToken: string, themeId: string, formId: string, blockId: string): Promise<string> {
  console.log(`Creating form snippet for form ID: ${formId}`);
  
  try {
    const snippetName = `codform-embed-${formId.substring(0, 8)}`;
    const snippetKey = `snippets/${snippetName}.liquid`;
    
    // Check if snippet already exists
    const checkResponse = await fetch(`https://${shop}/admin/api/2023-10/themes/${themeId}/assets.json?asset[key]=${snippetKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      }
    });
    
    // If snippet exists, just return the name
    if (checkResponse.ok) {
      console.log('Form snippet already exists');
      return snippetName;
    }
    
    // Create snippet content with direct embed approach
    const snippetContent = `
{% comment %}
  CodForm Integration Snippet
  Auto-created for form: ${formId}
{% endcomment %}

<div id="${blockId || `codform-container-${formId.substring(0, 8)}`}" class="codform-container">
  <script
    type="text/javascript"
    src="https://codform-flow-forms.lovable.app/api/shopify-form?formId=${formId}&blockId=${blockId || ''}&shop={{shop.domain}}"
    defer
  ></script>
  <div id="${blockId || `codform-container-${formId.substring(0, 8)}`}-loader" style="text-align: center; padding: 20px;">
    <p>جاري تحميل النموذج...</p>
  </div>
</div>
`;

    // Create the snippet
    const createResponse = await fetch(`https://${shop}/admin/api/2023-10/themes/${themeId}/assets.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        asset: {
          key: snippetKey,
          value: snippetContent
        }
      })
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Failed to create snippet: ${createResponse.status} ${errorText}`);
    }

    console.log(`Successfully created form snippet: ${snippetKey}`);
    return snippetName;
  } catch (error) {
    console.error('Error creating form snippet:', error);
    throw error;
  }
}

// Function to add section to JSON templates (newer themes)
async function updateJsonTemplate(shop: string, accessToken: string, themeId: string, template: any, 
  snippetName: string, position: string): Promise<boolean> {
  
  console.log(`Updating JSON template: ${template.key}`);
  
  try {
    const content = template.content;
    
    // First check if there is already a codform section
    let existingFormSectionId = null;
    const sections = content.sections || {};
    
    for (const [sectionId, section] of Object.entries(sections)) {
      if (sectionId.includes('codform') || (section as any).template?.includes('codform')) {
        existingFormSectionId = sectionId;
        break;
      }
    }
    
    if (existingFormSectionId) {
      console.log(`Found existing form section with ID: ${existingFormSectionId}, updating it`);
      
      // For existing section, we'll modify its settings but keep the same section type
      if ((sections[existingFormSectionId] as any).type) {
        // Keep the existing section type, just update the snippet reference
        (sections[existingFormSectionId] as any).settings = {
          ...(sections[existingFormSectionId] as any).settings,
          snippet: snippetName,
          heading: "اطلب المنتج الآن - الدفع عند الاستلام",
          subheading: "املأ النموذج التالي لطلب المنتج والدفع عند استلام المنتج."
        };
      } else {
        // If it doesn't have a type, it's likely our custom section format
        (sections[existingFormSectionId] as any).settings = {
          ...(sections[existingFormSectionId] as any).settings,
          snippet: snippetName
        };
      }
    } else {
      console.log('Adding new form section to template');
      
      // Find main product section to determine where to place our form
      let productSectionId = '';
      
      // First, check for the main content layout section
      for (const [sectionId, section] of Object.entries(sections)) {
        if ((section as any).type === 'main-product' || 
            (section as any).type === 'product-template' ||
            sectionId === 'main' || 
            sectionId === 'product-template') {
          productSectionId = sectionId;
          break;
        }
      }
      
      // Create a new section - using the custom snippet renderer type if available
      // This is a better approach than using "include" type
      const formSectionId = `codform-${Date.now()}`;
      
      // IMPORTANT: Fix - Use a standard section type like "custom-liquid"
      // instead of "include" which caused the error
      sections[formSectionId] = {
        type: "custom-liquid", // Using custom-liquid type which is commonly available
        settings: {
          custom_liquid: `{% include '${snippetName}' %}`,
          heading: "اطلب المنتج الآن - الدفع عند الاستلام",
          subheading: "املأ النموذج التالي لطلب المنتج والدفع عند استلام المنتج."
        }
      };
      
      // Add section to the appropriate location in the order
      if (content.order) {
        const newOrder = [...content.order];
        
        if (productSectionId && newOrder.indexOf(productSectionId) !== -1) {
          // Insert based on position preference
          const productIndex = newOrder.indexOf(productSectionId);
          
          // Determine insert position based on requested position
          let insertIndex = productIndex + 1; // default to after product section
          
          // Adjust insert position based on the position parameter
          if (position === 'before_description') {
            // Try to find the description section and insert before it
            const descIndex = newOrder.findIndex(id => 
              id.includes('description') || (sections[id] && (sections[id] as any).type?.includes('description')));
            
            if (descIndex !== -1) {
              insertIndex = descIndex;
            }
          } else if (position === 'after_description') {
            // Try to find the description section and insert after it
            const descIndex = newOrder.findIndex(id => 
              id.includes('description') || (sections[id] && (sections[id] as any).type?.includes('description')));
            
            if (descIndex !== -1) {
              insertIndex = descIndex + 1;
            }
          } else if (position === 'before_buy_buttons') {
            // Try to find buy buttons section
            const buyIndex = newOrder.findIndex(id => 
              id.includes('buy') || (sections[id] && (sections[id] as any).type?.includes('buy')));
            
            if (buyIndex !== -1) {
              insertIndex = buyIndex;
            }
          }
          // The default 'after_buy_buttons' and 'after_gallery' will just use productIndex + 1
          
          // Insert our section at the calculated position
          newOrder.splice(insertIndex, 0, formSectionId);
          content.order = newOrder;
          
          console.log(`Inserted form section at index ${insertIndex} (${position})`);
        } else {
          // If we couldn't find the right section, append to the end
          newOrder.push(formSectionId);
          content.order = newOrder;
          console.log('Could not locate specific section for positioning, appended to end');
        }
      } else if (!content.order) {
        // If there's no order array, create one
        content.order = [formSectionId];
        console.log('No order array found, created new one');
      }
    }
    
    // Update the template on Shopify
    const response = await fetch(`https://${shop}/admin/api/2023-10/themes/${themeId}/assets.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        asset: {
          key: template.key,
          value: JSON.stringify(content)
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response updating JSON template: ${errorText}`);
      
      // If there's an error with our approach, try an alternative approach
      if (errorText.includes('Section type')) {
        console.log('Attempting alternative approach for JSON template...');
        return await updateJsonTemplateAlternative(shop, accessToken, themeId, template, snippetName, position);
      }
      
      throw new Error(`Failed to update JSON template: ${response.status} ${errorText}`);
    }

    console.log(`Successfully updated JSON template: ${template.key}`);
    return true;
  } catch (error) {
    console.error('Error updating JSON template:', error);
    throw error;
  }
}

// Alternative approach for updating JSON templates
async function updateJsonTemplateAlternative(shop: string, accessToken: string, themeId: string, template: any,
  snippetName: string, position: string): Promise<boolean> {
  
  console.log(`Using alternative approach for JSON template: ${template.key}`);
  
  try {
    const content = template.content;
    
    // Create section ID
    const formSectionId = `codform-${Date.now()}`;
    
    // Use a more compatible section definition
    // For Dawn theme, "custom-liquid" is the most reliable section type
    content.sections = content.sections || {};
    content.sections[formSectionId] = {
      type: "custom-liquid",
      settings: {
        custom_liquid: `{% include '${snippetName}' %}`,
        title: "اطلب المنتج الآن - الدفع عند الاستلام",
        text: "املأ النموذج التالي لطلب المنتج والدفع عند استلام المنتج."
      }
    };
    
    // Add to order array if it exists
    if (content.order && Array.isArray(content.order)) {
      // Find a good position for insertion - after the main product section if possible
      let insertAt = content.order.length; // default to end
      
      // Look for main product section
      const mainProductIndex = content.order.findIndex(id => {
        const section = content.sections[id];
        return section && (
          section.type === 'main-product' || 
          id === 'main-product' || 
          id.includes('product')
        );
      });
      
      if (mainProductIndex !== -1) {
        // Insert after the main product section
        insertAt = mainProductIndex + 1;
      }
      
      // Insert the section ID at the determined position
      content.order.splice(insertAt, 0, formSectionId);
    } else {
      // Create order array if it doesn't exist
      content.order = [formSectionId];
    }
    
    // Update the template
    const response = await fetch(`https://${shop}/admin/api/2023-10/themes/${themeId}/assets.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        asset: {
          key: template.key,
          value: JSON.stringify(content)
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Alternative approach also failed: ${errorText}`);
      
      // Final fallback - direct template insertion of liquid
      console.log('Attempting direct liquid template insertion as final fallback');
      return await updateTemplateWithDirectLiquid(shop, accessToken, themeId, template, snippetName);
    }
    
    console.log('Alternative JSON update successful!');
    return true;
  } catch (error) {
    console.error('Error in alternative JSON update:', error);
    throw error;
  }
}

// Last resort approach - directly inject liquid include
async function updateTemplateWithDirectLiquid(shop: string, accessToken: string, themeId: string, template: any, 
  snippetName: string): Promise<boolean> {
  
  console.log('Using direct liquid insertion as fallback');
  
  try {
    // Create a new liquid section that just includes our snippet
    const sectionName = `codform-section-${Date.now()}`;
    const sectionKey = `sections/${sectionName}.liquid`;
    const sectionContent = `
<div class="page-width">
  <div class="section-{{ section.id }}-padding">
    <h2>{{ section.settings.heading }}</h2>
    <div>{{ section.settings.text }}</div>
    {% include '${snippetName}' %}
  </div>
</div>

{% schema %}
{
  "name": "CodForm Embed",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "default": "اطلب المنتج الآن - الدفع عند الاستلام",
      "label": "عنوان النموذج"
    },
    {
      "type": "richtext",
      "id": "text",
      "default": "<p>املأ النموذج التالي لطلب المنتج والدفع عند استلام المنتج.</p>",
      "label": "وصف النموذج"
    }
  ],
  "presets": [
    {
      "name": "CodForm Embed",
      "category": "Custom"
    }
  ]
}
{% endschema %}
`;

    // Create the section
    const createResponse = await fetch(`https://${shop}/admin/api/2023-10/themes/${themeId}/assets.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        asset: {
          key: sectionKey,
          value: sectionContent
        }
      })
    });
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error(`Failed to create liquid section: ${errorText}`);
      return false;
    }
    
    console.log('Created custom section for form embed');
    
    // Now update the template to use our new section
    if (template.isJson) {
      const content = template.content;
      
      // Add our section to the template
      content.sections = content.sections || {};
      content.sections[sectionName] = {
        type: sectionName,
        settings: {
          heading: "اطلب المنتج الآن - الدفع عند الاستلام",
          text: "<p>املأ النموذج التالي لطلب المنتج والدفع عند استلام المنتج.</p>"
        }
      };
      
      // Add to order array
      if (content.order && Array.isArray(content.order)) {
        content.order.push(sectionName);
      } else {
        content.order = [sectionName];
      }
      
      // Update the template
      const updateResponse = await fetch(`https://${shop}/admin/api/2023-10/themes/${themeId}/assets.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken
        },
        body: JSON.stringify({
          asset: {
            key: template.key,
            value: JSON.stringify(content)
          }
        })
      });
      
      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error(`Failed with final fallback approach: ${errorText}`);
        return false;
      }
      
      console.log('Final fallback approach successful!');
      return true;
    } else {
      // For liquid templates, call updateLiquidTemplate
      return await updateLiquidTemplate(shop, accessToken, themeId, template, snippetName, 'after_buy_buttons');
    }
  } catch (error) {
    console.error('Error in direct liquid insertion fallback:', error);
    return false;
  }
}

// Function to update Liquid template (older themes)
async function updateLiquidTemplate(shop: string, accessToken: string, themeId: string, template: any, 
  snippetName: string, position: string): Promise<boolean> {
  
  console.log(`Updating Liquid template: ${template.key}`);
  
  try {
    let liquidContent = template.content;
    
    // Check if our snippet is already included
    if (liquidContent.includes(`{% include '${snippetName}'`) || 
        liquidContent.includes(`{% include "${snippetName}"`)) {
      console.log('Snippet already included in Liquid template');
      return true;
    }
    
    // Define the include statement to insert
    const includeStatement = `\n{% include '${snippetName}' %}\n`;
    
    // Determine where to insert the snippet based on position
    let inserted = false;
    
    // Define potential insertion points based on position
    const positionMarkers: Record<string, string[]> = {
      'after_gallery': [
        '{% endfor %}', // After image gallery loop
        'product-gallery',
        'product-images',
        'class="product-single__photos"'
      ],
      'before_description': [
        '<div class="product-single__description',
        'id="ProductDescription"',
        'class="product__description"'
      ],
      'after_description': [
        '</div><!-- /.product-single__description',
        '</div><!-- /.product-description',
        '</div><!-- /product-description' 
      ],
      'before_buy_buttons': [
        '<form action="/cart/add"',
        'class="product-form',
        'id="AddToCartForm"'
      ],
      'after_buy_buttons': [
        '</form><!-- /.product-form -->',
        '</form><!-- /product-form -->',
        '<div class="product__policies',
        'class="additional-checkout-buttons'
      ]
    };
    
    // Get markers for the requested position
    const markers = positionMarkers[position] || positionMarkers['after_buy_buttons'];
    
    // Try to insert at the first matching marker
    for (const marker of markers) {
      if (liquidContent.includes(marker)) {
        const index = liquidContent.indexOf(marker) + marker.length;
        liquidContent = liquidContent.substring(0, index) + includeStatement + liquidContent.substring(index);
        inserted = true;
        console.log(`Inserted at marker: ${marker}`);
        break;
      }
    }
    
    // If we couldn't find a specific marker, try to insert in a reasonable location
    if (!inserted) {
      // Fall back to common structural markers
      const fallbackMarkers = [
        'id="shopify-section-product-template"',
        'class="product-template',
        'class="product-section',
        'id="ProductSection',
        '<form action="/cart/add"'
      ];
      
      for (const marker of fallbackMarkers) {
        if (liquidContent.includes(marker)) {
          const index = liquidContent.indexOf(marker);
          const closingTagIndex = liquidContent.indexOf('>', index);
          
          if (closingTagIndex !== -1) {
            // Insert after the closing tag
            liquidContent = liquidContent.substring(0, closingTagIndex + 1) + includeStatement + liquidContent.substring(closingTagIndex + 1);
            inserted = true;
            console.log(`Inserted at fallback marker: ${marker}`);
            break;
          }
        }
      }
    }
    
    // Last resort - add near the end of the file
    if (!inserted) {
      liquidContent = liquidContent + includeStatement;
      console.log('Could not find specific insertion point, added to end of file');
    }
    
    // Update the template on Shopify
    const response = await fetch(`https://${shop}/admin/api/2023-10/themes/${themeId}/assets.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        asset: {
          key: template.key,
          value: liquidContent
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response updating Liquid template: ${errorText}`);
      throw new Error(`Failed to update Liquid template: ${response.status} ${errorText}`);
    }

    console.log(`Successfully updated Liquid template: ${template.key}`);
    return true;
  } catch (error) {
    console.error('Error updating Liquid template:', error);
    throw error;
  }
}

// Main function to update product template
async function updateProductTemplate(shop: string, accessToken: string, themeId: string, 
  template: any, formId: string, blockId: string, position: string): Promise<boolean> {
  
  console.log(`Updating product template ${template.key} with form ID: ${formId}, position: ${position}`);
  
  try {
    const blockIdToUse = blockId || `codform-container-${formId.substring(0, 8)}`;
    
    // First create a snippet that includes our form
    const snippetName = await createFormSnippet(shop, accessToken, themeId, formId, blockIdToUse);

    // Update template based on its type
    if (template.isJson) {
      // Handle modern JSON template update
      return await updateJsonTemplate(shop, accessToken, themeId, template, snippetName, position);
    } else {
      // Handle traditional Liquid template update
      return await updateLiquidTemplate(shop, accessToken, themeId, template, snippetName, position);
    }
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

    console.log(`[${requestId}] Processing request for shop: ${shop}, formId: ${formId}, position: ${sectionPosition || 'after_buy_buttons'}`);

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
        },
        snippetCreated: true
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
        error: error instanceof Error ? error.message : 'Unknown error',
        errorDetails: error instanceof Error ? error.stack : null
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
