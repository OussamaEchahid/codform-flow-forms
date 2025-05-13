
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface UpdateThemeRequest {
  shop: string;
  accessToken: string;
  formId: string;
  insertionMethod?: 'auto' | 'manual';
  blockId?: string;
  themeId?: number;
  floatingButtonSettings?: any; // Add floating button settings
}

serve(async (req: Request) => {
  console.log('Theme update function started');
  
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
    const { 
      shop, 
      accessToken, 
      formId, 
      insertionMethod = 'auto', 
      blockId, 
      themeId,
      floatingButtonSettings = {} // Get floating button settings from request
    } = await req.json() as UpdateThemeRequest;

    if (!shop || !accessToken || !formId) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Missing required parameters: shop, accessToken, and formId are required'
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Updating theme for shop ${shop} with form ${formId}`);
    console.log('Floating button settings:', floatingButtonSettings);

    try {
      // First, get theme info to determine if we're dealing with OS2.0 or traditional theme
      let themeType = 'unknown';
      let targetThemeId = themeId;
      
      // If no theme ID was provided, find the main theme
      if (!targetThemeId) {
        const themes = await getShopifyThemes(shop, accessToken);
        const mainTheme = themes.find(t => t.role === 'main');
        
        if (!mainTheme) {
          throw new Error('No main theme found');
        }
        
        targetThemeId = mainTheme.id;
        console.log(`Found main theme: ${mainTheme.name} (ID: ${targetThemeId})`);
      }
      
      // Detect theme type
      themeType = await detectThemeType(shop, accessToken, targetThemeId);
      console.log(`Detected theme type: ${themeType}`);
      
      let updateResult;
      
      // Get form details to get floating button settings if not provided
      if (!floatingButtonSettings.enabled && floatingButtonSettings.enabled !== false) {
        console.log('Fetching form details to get floating button settings');
        try {
          const { data: formData, error: formError } = await supabase
            .from('forms')
            .select('*')
            .eq('id', formId)
            .single();
            
          if (!formError && formData && formData.style) {
            console.log('Found form data with style:', formData.style);
            // Extract floating button settings from form data if available
            if (formData.floating_button) {
              floatingButtonSettings = formData.floating_button;
              console.log('Using floating button settings from form data:', floatingButtonSettings);
            }
          } else {
            console.log('Form not found or no style info available');
          }
        } catch (error) {
          console.log('Error getting form details:', error);
        }
      }
      
      if (themeType === 'OS2.0') {
        // Update OS2.0 theme
        console.log('Updating OS2.0 theme');
        updateResult = await updateOS2Theme(shop, accessToken, targetThemeId, formId, blockId, floatingButtonSettings);
      } else {
        // Update traditional theme
        console.log('Updating traditional theme');
        updateResult = await updateTraditionalTheme(shop, accessToken, targetThemeId, formId, blockId, floatingButtonSettings);
      }

      // Store insertion information in the database for reference
      const formIdShort = formId.substring(0, 8);
      try {
        // Store insertion meta in a separate table for reference
        const { error: insertionError } = await supabase
          .from('shopify_form_insertion')
          .upsert({
            shop_id: shop,
            form_id: formId,
            theme_id: targetThemeId,
            theme_type: themeType,
            insertion_method: insertionMethod,
            block_id: blockId || `codform_${formIdShort}`,
            floating_button: floatingButtonSettings, // Save floating button settings
            status: 'success',
            updated_at: new Date().toISOString()
          }, { 
            onConflict: 'shop_id,form_id' 
          });
        
        if (insertionError) {
          console.error('Error saving insertion data:', insertionError);
        }
      } catch (dbError) {
        console.error('Error saving insertion data:', dbError);
      }

      // Return success
      return new Response(JSON.stringify({
        success: true,
        theme_id: targetThemeId,
        theme_type: themeType,
        message: `Form has been added to the theme successfully`,
        details: updateResult,
        floating_button: floatingButtonSettings // Return floating button settings in response
      }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error updating theme:', error);
      return new Response(JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error updating theme',
        error_details: error instanceof Error ? error.stack : undefined
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error in theme update function:', error);
    return new Response(JSON.stringify({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
      error_details: error instanceof Error ? error.stack : undefined
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper function to detect theme type
async function detectThemeType(shop: string, accessToken: string, themeId: number): Promise<string> {
  try {
    // Try to fetch product.json template file to check if it exists (OS2.0 themes have this)
    const response = await fetch(`https://${shop}/admin/api/2023-04/themes/${themeId}/assets.json?asset[key]=templates/product.json`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      }
    });
    
    const data = await response.json();
    
    // If the response has an asset and doesn't have errors, it's likely an OS2.0 theme
    if (data.asset && !data.errors) {
      console.log('Confirmed OS2.0 theme by finding templates/product.json');
      return 'OS2.0';
    }
    
    // Traditional theme
    return 'Traditional';
  } catch (error) {
    console.error('Error detecting theme type:', error);
    // Default to traditional theme if detection fails
    return 'Traditional';
  }
}

// Helper function to get shop themes
async function getShopifyThemes(shop: string, accessToken: string): Promise<any[]> {
  const response = await fetch(`https://${shop}/admin/api/2023-04/themes.json`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    }
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to get themes: ${response.status} - ${errorData}`);
  }
  
  const data = await response.json();
  return data.themes || [];
}

// OS2.0 Theme update function
async function updateOS2Theme(
  shop: string, 
  accessToken: string, 
  themeId: number, 
  formId: string, 
  blockId?: string,
  floatingButtonSettings?: any // Add floating button settings parameter
): Promise<any> {
  // For OS2.0 themes, we need to update the product.json template to insert our app block
  // First, get the template
  const response = await fetch(`https://${shop}/admin/api/2023-04/themes/${themeId}/assets.json?asset[key]=templates/product.json`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    }
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to get product template: ${response.status} - ${errorData}`);
  }
  
  const data = await response.json();
  if (!data.asset || !data.asset.value) {
    throw new Error('Product template not found or empty');
  }
  
  // Parse the template
  const template = JSON.parse(data.asset.value);
  
  // Find the main product section
  const productSection = template.sections.main;
  if (!productSection) {
    throw new Error('Main product section not found in template');
  }
  
  console.log('Found main product section: main');
  
  // Form block ID (ensure it's unique)
  const formIdShort = formId.substring(0, 8);
  const actualBlockId = blockId || `codform_${formIdShort}`;
  
  // For OS2.0 themes, the block type should be the extension handle followed by the block handle
  // This is the correct format for theme app extensions with the branding domain prefix
  const appBlockType = "theme-extension-codform.codform_form";
  
  // Add our app block - first check if it's already there
  let blockOrder = productSection.blocks_order || [];
  
  // If the block isn't already in the order, add it before the description
  if (!blockOrder.includes(actualBlockId)) {
    const descIdx = blockOrder.indexOf('description');
    if (descIdx !== -1) {
      // Add before description
      blockOrder.splice(descIdx, 0, actualBlockId);
    } else {
      // Add to the end
      blockOrder.push(actualBlockId);
    }
    
    // Update blocks_order
    productSection.blocks_order = blockOrder;
  }
  
  console.log('Block order after update:', JSON.stringify(blockOrder, null, 2));
  
  // Add block definition if it doesn't exist
  if (!productSection.blocks) {
    productSection.blocks = {};
  }
  
  // Settings with floating button properties
  const blockSettings = {
    form_id: formId,
    // Include floating button settings if provided
    enable_floating_button: floatingButtonSettings?.enabled === true,
    floating_button_text: floatingButtonSettings?.text || 'Order Now',
    floating_text_color: floatingButtonSettings?.textColor || '#ffffff',
    floating_bg_color: floatingButtonSettings?.backgroundColor || '#000000',
    floating_border_radius: floatingButtonSettings?.borderRadius || '4px',
    floating_show_icon: floatingButtonSettings?.showIcon === true,
    floating_icon: floatingButtonSettings?.icon || 'shopping-cart',
    floating_animation: floatingButtonSettings?.animation || 'none',
    is_rtl: false // Default to LTR
  };
  
  // Update the block with form ID and floating button settings
  productSection.blocks[actualBlockId] = {
    type: appBlockType,
    settings: blockSettings
  };
  
  // Update the template
  const updateResponse = await fetch(`https://${shop}/admin/api/2023-04/themes/${themeId}/assets.json`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    },
    body: JSON.stringify({
      asset: {
        key: "templates/product.json",
        value: JSON.stringify(template, null, 2)
      }
    })
  });
  
  if (!updateResponse.ok) {
    const errorData = await updateResponse.text();
    throw new Error(`Failed to update template: ${updateResponse.status} - ${errorData}`);
  }
  
  console.log('Successfully updated OS2.0 product template');
  
  return {
    block_id: actualBlockId,
    template: 'product.json',
    section: 'main',
    block_type: appBlockType,
    settings: blockSettings
  };
}

// Traditional Theme update function
async function updateTraditionalTheme(
  shop: string, 
  accessToken: string, 
  themeId: number, 
  formId: string, 
  blockId?: string,
  floatingButtonSettings?: any // Add floating button settings parameter
): Promise<any> {
  // For traditional themes, we need to update the product template to include our snippet
  
  // First, get the product template
  const response = await fetch(`https://${shop}/admin/api/2023-04/themes/${themeId}/assets.json?asset[key]=templates/product.liquid`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    }
  });
  
  if (!response.ok) {
    // Try alternative product template
    const altResponse = await fetch(`https://${shop}/admin/api/2023-04/themes/${themeId}/assets.json?asset[key]=templates/product.liquid`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      }
    });
    
    if (!altResponse.ok) {
      throw new Error('Could not find product template');
    }
    
    const altData = await altResponse.json();
    if (!altData.asset || !altData.asset.value) {
      throw new Error('Product template not found or empty');
    }
    
    // Continue with the alternative template
    return await processTraditionalTemplate(shop, accessToken, themeId, formId, blockId || '', 'templates/product.liquid', altData.asset.value, floatingButtonSettings);
  }
  
  const data = await response.json();
  if (!data.asset || !data.asset.value) {
    throw new Error('Product template not found or empty');
  }
  
  // Process the template
  return await processTraditionalTemplate(shop, accessToken, themeId, formId, blockId || '', 'templates/product.liquid', data.asset.value, floatingButtonSettings);
}

// Helper function to process the traditional liquid template
async function processTraditionalTemplate(
  shop: string, 
  accessToken: string, 
  themeId: number, 
  formId: string, 
  blockId: string, 
  templateKey: string, 
  templateContent: string,
  floatingButtonSettings?: any // Add floating button settings parameter
): Promise<any> {
  // Generate a block ID if not provided
  const formIdShort = formId.substring(0, 8);
  const actualBlockId = blockId || `codform_${formIdShort}`;
  
  // Create snippet parameters with floating button settings
  const floatingBtnEnabled = floatingButtonSettings?.enabled === true;
  const floatingBtnText = floatingButtonSettings?.text || 'Order Now';
  const floatingBtnTextColor = floatingButtonSettings?.textColor || '#ffffff';
  const floatingBtnBgColor = floatingButtonSettings?.backgroundColor || '#000000';
  const floatingBtnRadius = floatingButtonSettings?.borderRadius || '4px';
  const floatingBtnShowIcon = floatingButtonSettings?.showIcon === true;
  const floatingBtnIcon = floatingButtonSettings?.icon || 'shopping-cart';
  const floatingBtnAnimation = floatingButtonSettings?.animation || 'none';
  const isRTL = false; // Default to LTR
  
  // Create snippet include string with additional parameters for floating button
  const snippetIncludeString = `{% render 'codform', product: product, form_id: '${formId}', block_id: '${actualBlockId}', enable_floating_button: ${floatingBtnEnabled}, floating_button_text: '${floatingBtnText}', floating_text_color: '${floatingBtnTextColor}', floating_bg_color: '${floatingBtnBgColor}', floating_border_radius: '${floatingBtnRadius}', floating_show_icon: ${floatingBtnShowIcon}, floating_icon: '${floatingBtnIcon}', floating_animation: '${floatingBtnAnimation}', is_rtl: ${isRTL} %}`;
  
  // Check if our snippet is already included - if so, we need to replace it with updated parameters
  const snippetRegex = /\{\%\s*render\s+['"]codform['"].*?\%\}/;
  
  if (snippetRegex.test(templateContent)) {
    console.log('Snippet already included in template, updating with new parameters');
    const modifiedContent = templateContent.replace(snippetRegex, snippetIncludeString);
    
    // Upload the modified template
    const updateResponse = await fetch(`https://${shop}/admin/api/2023-04/themes/${themeId}/assets.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({
        asset: {
          key: templateKey,
          value: modifiedContent
        }
      })
    });
    
    if (!updateResponse.ok) {
      const errorData = await updateResponse.text();
      throw new Error(`Failed to update template: ${updateResponse.status} - ${errorData}`);
    }
    
    console.log('Successfully updated snippet include in template');
    
    // Update the snippet itself
    await updateCodformSnippet(shop, accessToken, themeId);
    
    return {
      block_id: actualBlockId,
      template: templateKey,
      status: 'updated',
      floating_button: floatingBtnEnabled
    };
  }

  // Look for common insertion points
  const addToCartButtonRegex = /<form.*?product-form.*?>|<form.*?action="\/cart\/add".*?>|<form.*?add-to-cart.*?>|\{\%\s*form.*?cart\/add.*?\%\}/i;
  const priceRegex = /<div.*?product(\-|\s+|\_)price.*?>|\{\{.*?product\.price.*?\}\}|\{\{.*?current\_variant\.price.*?\}\}/i;
  const variantSelectorRegex = /<select.*?id="product(\-|\s+|\_)select.*?>|<div.*?product(\-|\s+|\_)variant.*?>/i;
  
  // Try to insert it before the add to cart button
  let modifiedContent = '';
  let insertionPoint = '';
  
  if (addToCartButtonRegex.test(templateContent)) {
    insertionPoint = 'add to cart button';
    modifiedContent = templateContent.replace(addToCartButtonRegex, match => {
      return `${snippetIncludeString}\n\n${match}`;
    });
  } else if (priceRegex.test(templateContent)) {
    insertionPoint = 'price element';
    modifiedContent = templateContent.replace(priceRegex, match => {
      return `${match}\n\n${snippetIncludeString}`;
    });
  } else if (variantSelectorRegex.test(templateContent)) {
    insertionPoint = 'variant selector';
    modifiedContent = templateContent.replace(variantSelectorRegex, match => {
      return `${match}\n\n${snippetIncludeString}`;
    });
  } else {
    // If we couldn't find a good insertion point, add it to the end of the main content area 
    // which often has a class like "product" or "product-content"
    const productContainerRegex = /<div.*?class=".*?product.*?".*?>.*?<\/div>/s;
    
    if (productContainerRegex.test(templateContent)) {
      insertionPoint = 'product container';
      modifiedContent = templateContent.replace(productContainerRegex, match => {
        // Insert before the closing div
        const lastDivIndex = match.lastIndexOf('</div>');
        const start = match.substring(0, lastDivIndex);
        const end = match.substring(lastDivIndex);
        return `${start}\n${snippetIncludeString}\n${end}`;
      });
    } else {
      // Last resort - just append to the template
      modifiedContent = `${templateContent}\n\n${snippetIncludeString}`;
      insertionPoint = 'end of template';
    }
  }
  
  // Update the snippet
  await updateCodformSnippet(shop, accessToken, themeId);
  
  // Upload the modified template
  const updateResponse = await fetch(`https://${shop}/admin/api/2023-04/themes/${themeId}/assets.json`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    },
    body: JSON.stringify({
      asset: {
        key: templateKey,
        value: modifiedContent
      }
    })
  });
  
  if (!updateResponse.ok) {
    const errorData = await updateResponse.text();
    throw new Error(`Failed to update template: ${updateResponse.status} - ${errorData}`);
  }
  
  console.log(`Successfully updated traditional product template, inserted codform snippet near ${insertionPoint}`);
  
  return {
    block_id: actualBlockId,
    template: templateKey,
    insertion_point: insertionPoint,
    snippet: 'codform.liquid',
    floating_button: floatingBtnEnabled
  };
}

// Function to update the codform snippet with the latest version
async function updateCodformSnippet(shop: string, accessToken: string, themeId: number): Promise<void> {
  // The snippet content with updated floating button support
  const snippetContent = `{% comment %}
  CODFORM - نماذج الدفع عند الاستلام
  
  هذا المقتطف يضيف نموذج الدفع عند الاستلام إلى صفحة المنتج
{% endcomment %}

{% if product %}
<div id="codform-container-{{ block_id }}" class="codform-container" data-product-id="{{ product.id }}" data-form-id="{{ form_id }}">
  <div class="codform-header">
    <h3>{{ block.settings.title | default: "اطلب المنتج الآن - الدفع عند الاستلام" }}</h3>
    {% if block.settings.description != blank %}
      <p>{{ block.settings.description }}</p>
    {% else %}
      <p>املأ النموذج التالي لطلب المنتج والدفع عند استلام المنتج.</p>
    {% endif %}
  </div>

  <div class="codform-form-container">
    <div id="codform-form-loader-{{ block_id }}" class="codform-loader">
      <div class="codform-spinner"></div>
      <p>{{ block.settings.loading_text | default: 'جاري تحميل النموذج...' }}</p>
    </div>

    <div id="codform-form-{{ block_id }}" class="codform-form" style="display: none;">
      <!-- النموذج سيتم تحميله ديناميكيًا هنا -->
    </div>

    <div id="codform-success-{{ block_id }}" class="codform-success" style="display: none;">
      <div class="codform-success-icon">✓</div>
      <h4>{{ block.settings.success_title | default: 'تم إرسال الطلب بنجاح' }}</h4>
      <p>{{ block.settings.success_message | default: 'شكرًا لك، سنتواصل معك في أقرب وقت لإتمام عملية الدفع عند الاستلام.' }}</p>
    </div>

    <div id="codform-error-{{ block_id }}" class="codform-error" style="display: none;">
      <div class="codform-error-icon">!</div>
      <h4>{{ block.settings.error_title | default: 'حدث خطأ' }}</h4>
      <p>{{ block.settings.error_message | default: 'حدث خطأ أثناء تحميل النموذج، يرجى المحاولة مرة أخرى.' }}</p>
      <button id="codform-retry-{{ block_id }}" class="codform-button">{{ block.settings.retry_button | default: 'إعادة المحاولة' }}</button>
    </div>
  </div>
</div>

{% comment %} FLOATING BUTTON - Add explicitly from parameters instead of relying on block settings {% endcomment %}
{% if enable_floating_button %}
<div id="codform-floating-button-{{ block_id }}" class="codform-floating-button-container">
  <button
    class="codform-floating-button {% if floating_animation != 'none' %}{{ floating_animation }}-animation{% endif %}"
    style="
      background-color: {{ floating_bg_color | default: '#000000' }};
      color: {{ floating_text_color | default: '#ffffff' }};
      border-radius: {{ floating_border_radius | default: '4px' }};
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 20px;
      direction: {% if is_rtl %}rtl{% else %}ltr{% endif %};
      border: none;
      min-width: 250px;
    "
    onclick="document.querySelector('#codform-container-{{ block_id }}').scrollIntoView({behavior: 'smooth'});"
  >
    {% if is_rtl or floating_show_icon == false %}
      <span>{{ floating_button_text | default: 'اطلب الآن' }}</span>
    {% endif %}
    
    {% if floating_show_icon %}
      <span class="codform-floating-button-icon">
        {% case floating_icon %}
          {% when 'shopping-cart' %}
            <!-- Shopping cart icon SVG -->
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          {% when 'package' %}
            <!-- Package icon SVG -->
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.89 1.45l8 4A2 2 0 0 1 22 7.24v9.53a2 2 0 0 1-1.11 1.79l-8 4a2 2 0 0 1-1.79 0l-8-4a2 2 0 0 1-1.1-1.8V7.24a2 2 0 0 1 1.11-1.79l8-4a2 2 0 0 1 1.78 0z"/><polyline points="2.32 6.16 12 11 21.68 6.16"/><line x1="12" y1="22.76" x2="12" y2="11"/><line x1="7" y1="3.5" x2="17" y2="8.5"/></svg>
          {% when 'truck' %}
            <!-- Truck icon SVG -->
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          {% when 'send' %}
            <!-- Send icon SVG -->
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          {% else %}
            <!-- Default: Shopping cart icon SVG -->
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
        {% endcase %}
      </span>
    {% endif %}
    
    {% unless is_rtl or floating_show_icon == false %}
      <span>{{ floating_button_text | default: 'Order Now' }}</span>
    {% endunless %}
  </button>
</div>
{% endif %}

<style>
  /* Basic container configuration */
  .codform-container {
    margin: 20px 0;
    padding: 15px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background-color: #f9fafb;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
    box-sizing: border-box;
    width: 100%;
  }

  /* Form header */
  .codform-header {
    margin-bottom: 20px;
    text-align: right;
    padding: 15px;
    border-radius: 8px;
  }

  .codform-header h3 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 8px;
    color: #374151;
    line-height: 1.3;
  }

  .codform-header p {
    color: #6b7280;
    font-size: 1rem;
    line-height: 1.5;
    margin: 0;
  }
  
  /* Rest of the CSS styles... */

  /* Floating button container styles - Important for visibility */
  .codform-floating-button-container {
    position: fixed !important;
    bottom: 20px !important;
    left: 0 !important;
    right: 0 !important;
    display: flex !important;
    justify-content: center !important;
    z-index: 999999 !important; /* Very high z-index to ensure visibility */
    pointer-events: auto !important;
    visibility: visible !important;
    opacity: 1 !important;
    transition: opacity 0.3s ease !important;
  }
  
  .codform-floating-button-container.hidden {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
  }
  
  /* Floating button styles - Updated to be wider and better for scrolling */
  .codform-floating-button {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    cursor: pointer !important;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important;
    transition: transform 0.2s ease, box-shadow 0.2s ease !important;
    min-width: 250px !important; /* Made wider for better visibility */
    padding: 12px 24px !important;
    justify-content: center !important; /* Center the content */
    font-weight: 600 !important; /* Make text bolder */
    margin: 0 auto !important;
    position: relative !important;
    visibility: visible !important;
    opacity: 1 !important;
  }
  
  .codform-floating-button:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2) !important;
  }
  
  .codform-floating-button-icon {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  
  /* Animation styles */
  /* Animation Effects - Improve animation definitions */
  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
    }
  }

  .pulse-animation {
    animation: pulse 2s infinite !important;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 90% { transform: translateX(-2px); }
    20%, 80% { transform: translateX(4px); }
    30%, 50%, 70% { transform: translateX(-6px); }
    40%, 60% { transform: translateX(6px); }
  }

  .shake-animation {
    animation: shake 0.8s infinite !important;
  }

  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
    60% { transform: translateY(-5px); }
  }

  .bounce-animation {
    animation: bounce 2s infinite !important;
  }

  @keyframes wiggle {
    0%, 100% { transform: rotate(0); }
    25% { transform: rotate(-5deg); }
    50% { transform: rotate(0); }
    75% { transform: rotate(5deg); }
  }

  .wiggle-animation {
    animation: wiggle 0.7s ease-in-out infinite !important;
  }

  @keyframes flash {
    0%, 50%, 100% {
      opacity: 1;
    }
    25%, 75% {
      opacity: 0.7;
    }
  }

  .flash-animation {
    animation: flash 3s infinite !important;
  }
</style>

<script>
  // Initialize the form data with floating button settings
  document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('codform-container-{{ block_id }}');
    if (container) {
      const formId = container.getAttribute('data-form-id');
      const productId = container.getAttribute('data-product-id');
      
      // Check if floating button is enabled from parameters
      const floatingButtonEnabled = {% if enable_floating_button %}true{% else %}false{% endif %};
      const floatingButtonEl = document.getElementById('codform-floating-button-{{ block_id }}');
      
      // Initialize form loader
      initCodForm(formId, '{{ block_id }}', productId);
      
      // Make sure floating button is visible if enabled
      if (floatingButtonEl && floatingButtonEnabled) {
        floatingButtonEl.classList.remove('hidden');
        floatingButtonEl.style.display = 'flex';
        floatingButtonEl.style.visibility = 'visible';
        floatingButtonEl.style.opacity = '1';
      } else if (floatingButtonEl && !floatingButtonEnabled) {
        floatingButtonEl.classList.add('hidden');
        floatingButtonEl.style.display = 'none';
      }
    }
  });

  function initCodForm(formId, blockId, productId) {
    // Rest of form initialization code...
    // This will be filled in by the separate codform.js file
  }
</script>
{% endif %}`;
  
  // Upload the snippet
  const response = await fetch(`https://${shop}/admin/api/2023-04/themes/${themeId}/assets.json`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    },
    body: JSON.stringify({
      asset: {
        key: "snippets/codform.liquid",
        value: snippetContent
      }
    })
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to update codform snippet: ${response.status} - ${errorData}`);
  }
  
  console.log('Successfully updated codform snippet');
}

