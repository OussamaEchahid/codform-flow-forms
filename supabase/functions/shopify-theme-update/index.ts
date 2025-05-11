
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ThemeUpdateRequest {
  shop: string;
  accessToken: string;
  formId: string;
  blockId?: string;
  position?: 'product-page' | 'cart-page' | 'checkout';
  themeType?: 'os2' | 'traditional' | 'auto-detect';
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { shop, accessToken, formId, blockId, position, themeType } = await req.json() as ThemeUpdateRequest;

    if (!shop || !accessToken) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Missing required parameters: shop and accessToken'
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Updating theme for shop ${shop} with form ${formId}`);
    
    // First, detect the current theme ID and type
    const themeResponse = await fetch(`https://${shop}/admin/api/2023-10/themes.json`, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (!themeResponse.ok) {
      const error = await themeResponse.text();
      console.error(`Error fetching themes: ${error}`);
      return new Response(JSON.stringify({
        success: false,
        message: 'Error fetching themes',
        error
      }), { 
        status: themeResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const themesData = await themeResponse.json();
    const mainTheme = themesData.themes.find((theme: any) => theme.role === 'main');
    
    if (!mainTheme) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No main theme found'
      }), { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Log theme details
    console.log(`Found main theme: ${mainTheme.name} (ID: ${mainTheme.id})`);
    
    // Determine theme type based on theme name or provided type
    let detectedThemeType = themeType;
    
    if (themeType === 'auto-detect' || !themeType) {
      // Try to detect theme type based on theme name
      const themeName = mainTheme.name.toLowerCase();
      if (themeName.includes('dawn') || themeName.includes('os2') || themeName.includes('online store 2')) {
        detectedThemeType = 'os2';
        console.log('Detected theme type: OS2.0');
      } else {
        detectedThemeType = 'traditional';
        console.log('Detected theme type: Traditional');
      }
    }
    
    // Now, let's get the theme's sections first
    const assetResponse = await fetch(`https://${shop}/admin/api/2023-10/themes/${mainTheme.id}/assets.json?asset[key]=config/settings_data.json`, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (!assetResponse.ok) {
      const error = await assetResponse.text();
      console.error(`Error fetching settings data: ${error}`);
      return new Response(JSON.stringify({
        success: false,
        message: 'Error fetching theme settings',
        error
      }), { 
        status: assetResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // For OS2.0 themes, update the product template
    if (detectedThemeType === 'os2') {
      try {
        // Get the product template
        const templateResponse = await fetch(`https://${shop}/admin/api/2023-10/themes/${mainTheme.id}/assets.json?asset[key]=templates/product.json`, {
          method: 'GET',
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          }
        });

        if (!templateResponse.ok) {
          console.error(`Error fetching product template: ${await templateResponse.text()}`);
          throw new Error('Could not fetch product template');
        }

        const templateAsset = await templateResponse.json();
        if (!templateAsset.asset || !templateAsset.asset.value) {
          throw new Error('Invalid product template format');
        }

        // Parse the template JSON
        const templateData = JSON.parse(templateAsset.asset.value);
        
        // Find the main product section
        const mainSection = templateData.sections && 
                          Object.keys(templateData.sections).find(key => 
                            templateData.sections[key].type && 
                            templateData.sections[key].type.includes('product'));
        
        if (!mainSection) {
          throw new Error('Could not find main product section');
        }
        
        console.log(`Found main product section: ${mainSection}`);
        
        // Generate a unique block ID if not provided
        const actualBlockId = blockId || `codform_${formId.substring(0, 8)}`;
        
        // Create the form block
        const formBlock = {
          type: "shopify://apps/codform-flow-forms/blocks/codform_form/theme-extension-codform",
          settings: {
            form_id: formId
          }
        };
        
        // Add our block to the section
        const sectionData = templateData.sections[mainSection];
        
        if (!sectionData.blocks) {
          sectionData.blocks = {};
        }
        
        // Add our block with a unique key
        sectionData.blocks[actualBlockId] = formBlock;
        
        // Add our block to the block_order array, usually after variant_picker or buy_buttons
        if (!sectionData.block_order || !Array.isArray(sectionData.block_order)) {
          sectionData.block_order = [];
        }
        
        // Check if our block is already in the order
        if (!sectionData.block_order.includes(actualBlockId)) {
          // Find the position where we want to insert our block
          const buyButtonsIndex = sectionData.block_order.findIndex(block => 
            block === 'buy_buttons' || block.includes('buy_buttons'));
          
          const variantPickerIndex = sectionData.block_order.findIndex(block => 
            block === 'variant_picker' || block.includes('variant_picker'));
          
          let insertIndex = -1;
          
          if (buyButtonsIndex !== -1) {
            insertIndex = buyButtonsIndex; // Insert before buy buttons
          } else if (variantPickerIndex !== -1) {
            insertIndex = variantPickerIndex + 1; // Insert after variant picker
          } else {
            // If neither found, insert near the middle of the array
            insertIndex = Math.floor(sectionData.block_order.length / 2);
          }
          
          // Insert our block at the determined position
          if (insertIndex >= 0) {
            sectionData.block_order.splice(insertIndex, 0, actualBlockId);
          } else {
            // If something went wrong, just append to the end
            sectionData.block_order.push(actualBlockId);
          }
        }
        
        // Update the template
        const updateResponse = await fetch(`https://${shop}/admin/api/2023-10/themes/${mainTheme.id}/assets.json`, {
          method: 'PUT',
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            asset: {
              key: 'templates/product.json',
              value: JSON.stringify(templateData)
            }
          })
        });

        if (!updateResponse.ok) {
          const error = await updateResponse.text();
          console.error(`Error updating product template: ${error}`);
          throw new Error(`Failed to update template: ${error}`);
        }
        
        console.log('Successfully updated OS2.0 product template');
        
        // Save the block ID in the database
        try {
          const { error: insertError } = await supabase
            .from('shopify_form_insertion')
            .upsert({
              form_id: formId,
              shop_id: shop,
              block_id: actualBlockId,
              theme_id: mainTheme.id,
              theme_type: detectedThemeType,
              insertion_method: 'auto',
              position: position || 'product-page',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, { onConflict: 'form_id,shop_id' });
            
          if (insertError) {
            console.error("Error saving insertion data:", insertError);
          }
        } catch (dbError) {
          console.error("Database error:", dbError);
        }

        return new Response(JSON.stringify({
          success: true,
          message: 'Successfully updated OS2.0 theme',
          theme_type: detectedThemeType,
          block_id: actualBlockId
        }), { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (os2Error) {
        console.error('Error updating OS2.0 theme:', os2Error);
        return new Response(JSON.stringify({
          success: false,
          message: 'Error updating OS2.0 theme',
          error: os2Error.message
        }), { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else {
      // Traditional theme update logic
      try {
        // For traditional themes, we need to modify the product-template.liquid file
        const templateResponse = await fetch(`https://${shop}/admin/api/2023-10/themes/${mainTheme.id}/assets.json?asset[key]=templates/product.liquid`, {
          method: 'GET',
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          }
        });

        if (!templateResponse.ok) {
          console.error(`Error fetching traditional product template: ${await templateResponse.text()}`);
          throw new Error('Could not fetch traditional product template');
        }

        const templateAsset = await templateResponse.json();
        if (!templateAsset.asset || !templateAsset.asset.value) {
          throw new Error('Invalid traditional product template format');
        }

        // Get the template content
        let templateContent = templateAsset.asset.value;
        
        // Generate a unique block ID if not provided
        const actualBlockId = blockId || `codform_${formId.substring(0, 8)}`;
        
        // Create the form snippet to inject
        const formSnippet = `
{% comment %}COD Form Auto-Inserted{% endcomment %}
{% render 'codform-form-renderer', form_id: '${formId}', block_id: '${actualBlockId}' %}
`;

        // Find a suitable insertion point in the template
        // Usually after the add to cart button or before the product description
        const insertionPoints = [
          '<div class="product-form__buttons">',
          '{% form \'product\'',
          '<div class="product-form">',
          '<div class="product__description">',
          '<div class="product__info-wrapper">'
        ];
        
        let inserted = false;
        for (const point of insertionPoints) {
          if (templateContent.includes(point)) {
            // Insert our form after this point
            const index = templateContent.indexOf(point) + point.length;
            templateContent = 
              templateContent.substring(0, index) + 
              formSnippet + 
              templateContent.substring(index);
            inserted = true;
            console.log(`Inserted form at position with marker: ${point}`);
            break;
          }
        }
        
        if (!inserted) {
          // If no known insertion points are found, try to insert before the end of the main content
          const endPoints = [
            '</main>',
            '</div>{% endunless %}',
            '{% section'
          ];
          
          for (const point of endPoints) {
            if (templateContent.includes(point)) {
              const index = templateContent.indexOf(point);
              templateContent = 
                templateContent.substring(0, index) + 
                formSnippet + 
                templateContent.substring(index);
              inserted = true;
              console.log(`Inserted form before end marker: ${point}`);
              break;
            }
          }
        }
        
        if (!inserted) {
          throw new Error('Could not find suitable insertion point in template');
        }
        
        // Now create the form renderer snippet if it doesn't exist
        const formRendererContent = `{% comment %}
  CODFORM - نماذج الدفع عند الاستلام - Form Renderer
  
  هذا الملف يقوم بعرض نموذج الدفع عند الاستلام
{% endcomment %}

{% if form_id %}
<div id="codform-container-{{ block_id | default: 'default' }}" class="codform-container" data-product-id="{{ product.id }}" data-form-id="{{ form_id }}">
  <div class="codform-header">
    <h3>{{ block.settings.title | default: "اطلب المنتج الآن - الدفع عند الاستلام" }}</h3>
    {% if block.settings.description != blank %}
      <p>{{ block.settings.description | default: "املأ النموذج التالي لطلب المنتج والدفع عند استلام المنتج." }}</p>
    {% endif %}
  </div>

  <div class="codform-form-container">
    <div id="codform-form-loader-{{ block_id | default: 'default' }}" class="codform-loader">
      <div class="codform-spinner"></div>
      <p>{{ block.settings.loading_text | default: 'جاري تحميل النموذج...' }}</p>
    </div>

    <div id="codform-form-{{ block_id | default: 'default' }}" class="codform-form" style="display: none;">
      <!-- النموذج سيتم تحميله ديناميكيًا هنا -->
    </div>

    <div id="codform-success-{{ block_id | default: 'default' }}" class="codform-success" style="display: none;">
      <div class="codform-success-icon">✓</div>
      <h4>{{ block.settings.success_title | default: 'تم إرسال الطلب بنجاح' }}</h4>
      <p>{{ block.settings.success_message | default: 'شكرًا لك، سنتواصل معك في أقرب وقت لإتمام عملية الدفع عند الاستلام.' }}</p>
    </div>

    <div id="codform-error-{{ block_id | default: 'default' }}" class="codform-error" style="display: none;">
      <div class="codform-error-icon">!</div>
      <h4>{{ block.settings.error_title | default: 'حدث خطأ' }}</h4>
      <p>{{ block.settings.error_message | default: 'حدث خطأ أثناء تحميل النموذج، يرجى المحاولة مرة أخرى.' }}</p>
      <button id="codform-retry-{{ block_id | default: 'default' }}" class="codform-button">{{ block.settings.retry_button | default: 'إعادة المحاولة' }}</button>
    </div>
  </div>
</div>
{% endif %}`;

        // Create or update the snippet
        const snippetResponse = await fetch(`https://${shop}/admin/api/2023-10/themes/${mainTheme.id}/assets.json`, {
          method: 'PUT',
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            asset: {
              key: 'snippets/codform-form-renderer.liquid',
              value: formRendererContent
            }
          })
        });

        if (!snippetResponse.ok) {
          const error = await snippetResponse.text();
          console.error(`Error creating form renderer snippet: ${error}`);
        } else {
          console.log('Successfully created form renderer snippet');
        }

        // Update the template
        const updateResponse = await fetch(`https://${shop}/admin/api/2023-10/themes/${mainTheme.id}/assets.json`, {
          method: 'PUT',
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            asset: {
              key: 'templates/product.liquid',
              value: templateContent
            }
          })
        });

        if (!updateResponse.ok) {
          const error = await updateResponse.text();
          console.error(`Error updating traditional product template: ${error}`);
          throw new Error(`Failed to update traditional template: ${error}`);
        }
        
        console.log('Successfully updated traditional product template');

        // Save the block ID in the database
        try {
          const { error: insertError } = await supabase
            .from('shopify_form_insertion')
            .upsert({
              form_id: formId,
              shop_id: shop,
              block_id: actualBlockId,
              theme_id: mainTheme.id,
              theme_type: detectedThemeType,
              insertion_method: 'auto',
              position: position || 'product-page',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, { onConflict: 'form_id,shop_id' });
            
          if (insertError) {
            console.error("Error saving insertion data:", insertError);
          }
        } catch (dbError) {
          console.error("Database error:", dbError);
        }

        return new Response(JSON.stringify({
          success: true,
          message: 'Successfully updated traditional theme',
          theme_type: detectedThemeType,
          block_id: actualBlockId
        }), { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (traditionalError) {
        console.error('Error updating traditional theme:', traditionalError);
        return new Response(JSON.stringify({
          success: false,
          message: 'Error updating traditional theme',
          error: traditionalError.message
        }), { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
  } catch (error) {
    console.error('Error in theme update function:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Internal server error',
      error: error.message
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
