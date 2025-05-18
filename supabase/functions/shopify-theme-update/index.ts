// This function is responsible for updating the Shopify theme to insert the form

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
  formDirection?: 'ltr' | 'rtl'; 
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
    const { shop, accessToken, formId, insertionMethod = 'auto', blockId, themeId, formDirection = 'ltr' } = await req.json() as UpdateThemeRequest;

    if (!shop || !accessToken) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Missing required parameters: shop and accessToken are required'
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Updating theme for shop ${shop} with direction: ${formDirection}`);

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
      
      // Upload CSS file first regardless of theme type
      await uploadCSSFile(shop, accessToken, targetThemeId);
      console.log("Successfully uploaded codform.css stylesheet");
      
      let updateResult;
      
      if (themeType === 'OS2.0') {
        // Update OS2.0 theme
        console.log('Updating OS2.0 theme');
        updateResult = await updateOS2Theme(shop, accessToken, targetThemeId, blockId, formDirection);
      } else {
        // Update traditional theme
        console.log('Updating traditional theme');
        updateResult = await updateTraditionalTheme(shop, accessToken, targetThemeId, blockId, formDirection);
      }

      // Store insertion information in the database for reference
      const formIdShort = formId ? formId.substring(0, 8) : '';
      try {
        // Store insertion meta in a separate table for reference
        const { error: insertionError } = await supabase
          .from('shopify_form_insertion')
          .upsert({
            shop_id: shop,
            form_id: formId || null,
            theme_id: targetThemeId,
            theme_type: themeType,
            insertion_method: insertionMethod,
            block_id: blockId || `codform_${formIdShort}`,
            status: 'success',
            form_direction: formDirection,
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
        form_direction: formDirection,
        message: `Form block has been added to the theme successfully`,
        details: updateResult
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

// Upload the CSS file to the theme assets
async function uploadCSSFile(shop: string, accessToken: string, themeId: number): Promise<void> {
  // CSS content - we're embedding it here for simplicity
  const cssContent = `/* CODFORM - نماذج الدفع عند الاستلام */
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&display=swap');

/* ===== تنسيقات حقل العنوان ===== */
/* هذه الأنماط الأساسية مباشرة وبسيطة */
.form-title-field,
.codform-title-field,
div[data-field-type="title"],
div[data-field-type="form-title"],
div[data-field-type="edit-form-title"],
div[data-testid="title-field"],
div[data-testid="edit-form-title-field"],
.codform-form .space-y-2 > div:first-child {
  background-color: #9b87f5 !important;
  padding: 16px !important;
  border-radius: 8px !important;
  margin-bottom: 16px !important;
  width: 100% !important;
  display: block !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
}

.form-title-field h2,
.codform-title-field h2,
div[data-field-type="title"] h2,
div[data-field-type="form-title"] h2,
div[data-field-type="edit-form-title"] h2,
div[data-testid="title-field"] h2,
div[data-testid="edit-form-title-field"] h2,
.codform-form .space-y-2 > div:first-child h2 {
  color: #ffffff !important;
  margin: 0 !important;
  padding: 0 !important;
  font-size: 24px !important;
  font-weight: bold !important;
  text-align: center !important;
  width: 100% !important;
  display: block !important;
}

.form-title-field p,
.codform-title-field p,
div[data-field-type="title"] p,
div[data-field-type="form-title"] p,
div[data-field-type="edit-form-title"] p,
div[data-testid="title-field"] p,
div[data-testid="edit-form-title-field"] p,
.codform-form .space-y-2 > div:first-child p {
  color: rgba(255, 255, 255, 0.9) !important;
  margin-top: 6px !important;
  margin-bottom: 0 !important;
  font-size: 14px !important;
  text-align: center !important;
  width: 100% !important;
  display: block !important;
}

/* ترويسة النموذج */
.codform-header {
  margin-bottom: 20px;
  text-align: center;
  padding: 16px !important;
  border-radius: 8px !important;
  background-color: #9b87f5 !important;
  display: block !important;
}

.codform-header h3 {
  font-size: 24px !important;
  font-weight: 700 !important;
  margin-bottom: 6px !important;
  color: #ffffff !important;
  line-height: 1.3 !important;
  margin-top: 0 !important;
  display: block !important;
}

.codform-header p {
  color: rgba(255, 255, 255, 0.9) !important;
  font-size: 14px !important;
  line-height: 1.5 !important;
  margin: 0 !important;
}

/* حاوية النموذج الرئيسية */
.codform-form {
  margin-top: 14px;
  background-color: transparent !important;
  border-radius: 8px;
  padding: 16px;
  box-shadow: none !important;
  border: none !important;
}

/* تنسيق الحقول */
.codform-field {
  margin-bottom: 16px !important;
  display: block !important;
  position: relative !important;
  background-color: transparent !important;
}

.codform-field label {
  display: block !important;
  margin-bottom: 8px !important;
  font-weight: 500 !important;
  color: #374151 !important;
  font-size: 16px !important;
}

/* محاذاة للغة العربية */
[dir="rtl"] .codform-field label,
.rtl .codform-field label {
  text-align: right !important;
}

[dir="ltr"] .codform-field label,
.ltr .codform-field label {
  text-align: left !important;
}

.codform-field input[type="text"],
.codform-field input[type="email"],
.codform-field input[type="tel"],
.codform-field input[type="number"],
.codform-field textarea,
.codform-field select {
  width: 100% !important;
  padding: 10px 12px !important;
  border: 1px solid #d1d5db !important;
  border-radius: 8px !important;
  font-size: 16px !important;
  transition: all 0.2s ease-in-out !important;
  font-family: 'Cairo', sans-serif !important;
  background-color: #ffffff !important;
  color: #1f2937 !important;
  box-sizing: border-box !important;
  height: auto !important;
  line-height: 1.5 !important;
  margin: 0 !important;
}

/* أزرار الإرسال */
.codform-submit-button,
.codform-next-button,
.codform-prev-button,
.codform-submit-btn {
  background-color: #9b87f5 !important;
  color: white !important;
  border: none !important;
  padding: 14px 24px !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  font-size: 18px !important;
  cursor: pointer !important;
  transition: all 0.2s ease-in-out !important;
  width: 100% !important;
  margin-top: 14px !important;
  font-family: 'Cairo', sans-serif !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
  position: relative !important;
  overflow: hidden !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  text-align: center !important;
}

/* Animation */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.pulse-animation {
  animation: pulse 2s infinite !important;
}

/* تحسينات للتوافق مع RTL */
[dir="rtl"] .codform-field label,
[dir="rtl"] .codform-help-text,
[dir="rtl"] .codform-title-description {
  text-align: right;
}

[dir="ltr"] .codform-field label,
[dir="ltr"] .codform-help-text,
[dir="ltr"] .codform-title-description {
  text-align: left;
}

/* محاذاة لRTL و LTR */
.codform-form.rtl,
.codform-form-container[dir="rtl"],
.codform-form[dir="rtl"] {
  direction: rtl !important;
}

.codform-form.ltr,
.codform-form-container[dir="ltr"],
.codform-form[dir="ltr"] {
  direction: ltr !important;
}`;

  const response = await fetch(`https://${shop}/admin/api/2023-07/themes/${themeId}/assets.json`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    },
    body: JSON.stringify({
      asset: {
        key: "assets/codform.css",
        value: cssContent
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to upload CSS file: ${response.status} - ${errorData}`);
  }
}

// Helper function to detect theme type
async function detectThemeType(shop: string, accessToken: string, themeId: number): Promise<string> {
  try {
    // Try to fetch product.json template file to check if it exists (OS2.0 themes have this)
    const response = await fetch(`https://${shop}/admin/api/2023-07/themes/${themeId}/assets.json?asset[key]=templates/product.json`, {
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
  const response = await fetch(`https://${shop}/admin/api/2023-07/themes.json`, {
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
async function updateOS2Theme(shop: string, accessToken: string, themeId: number, blockId?: string, formDirection: string = 'ltr'): Promise<any> {
  // For OS2.0 themes, we need to update the product.json template to insert our app block
  // First, get the template
  const response = await fetch(`https://${shop}/admin/api/2023-07/themes/${themeId}/assets.json?asset[key]=templates/product.json`, {
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
  
  // Generate a unique block ID if not provided
  const actualBlockId = blockId || `codform_${Date.now()}`;
  
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
  
  // Block definition with form direction
  productSection.blocks[actualBlockId] = {
    type: appBlockType,
    settings: {
      is_rtl: formDirection === 'rtl'
    }
  };
  
  // Update the template
  const updateResponse = await fetch(`https://${shop}/admin/api/2023-07/themes/${themeId}/assets.json`, {
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
    form_direction: formDirection
  };
}

// Traditional Theme update function
async function updateTraditionalTheme(shop: string, accessToken: string, themeId: number, blockId?: string, formDirection: string = 'ltr'): Promise<any> {
  // For traditional themes, we need to update the product template to include our snippet
  
  // First, get the product template
  const response = await fetch(`https://${shop}/admin/api/2023-07/themes/${themeId}/assets.json?asset[key]=templates/product.liquid`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    }
  });
  
  if (!response.ok) {
    // Try alternative product template
    const altResponse = await fetch(`https://${shop}/admin/api/2023-07/themes/${themeId}/assets.json?asset[key]=templates/product.liquid`, {
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
    return await processTraditionalTemplate(shop, accessToken, themeId, blockId || '', 'templates/product.liquid', altData.asset.value, formDirection);
  }
  
  const data = await response.json();
  if (!data.asset || !data.asset.value) {
    throw new Error('Product template not found or empty');
  }
  
  // Process the template
  return await processTraditionalTemplate(shop, accessToken, themeId, blockId || '', 'templates/product.liquid', data.asset.value, formDirection);
}

// Helper function to process the traditional liquid template
async function processTraditionalTemplate(shop: string, accessToken: string, themeId: number, blockId: string, templateKey: string, templateContent: string, formDirection: string = 'ltr'): Promise<any> {
  // Generate a block ID if not provided
  const actualBlockId = blockId || `codform_${Date.now()}`;
  
  // Include formDirection in the snippet render call
  const isRtl = formDirection === 'rtl';
  const snippetIncludeString = `{% render 'codform', product: product, block_id: '${actualBlockId}', is_rtl: ${isRtl} %}`;
  
  // Check if our snippet is already included
  const oldSnippetRegex = new RegExp(`\\{\\%\\s*render\\s+['"]codform['"]\\s*,\\s*product\\s*:\\s*product\\s*,\\s*block_id\\s*:\\s*['"]${actualBlockId}['"]\\s*\\%\\}`, 'i');
  
  if (templateContent.includes(snippetIncludeString)) {
    console.log('Snippet with current direction already included in template');
    return {
      block_id: actualBlockId,
      template: templateKey,
      status: 'already_exists',
      form_direction: formDirection
    };
  } else if (oldSnippetRegex.test(templateContent)) {
    // If the snippet exists but without form direction, update it
    templateContent = templateContent.replace(
      oldSnippetRegex,
      snippetIncludeString
    );
    
    console.log('Updated existing snippet with direction parameter');
  } else {
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
    
    // Update templateContent for the next step
    templateContent = modifiedContent;
  }
  
  // Create a simpler snippet with direct inline styles for the title
  const snippetContent = `{% comment %}
  CODFORM - نماذج الدفع عند الاستلام
  
  هذا المقتطف يضيف نموذج الدفع عند الاستلام إلى صفحة المنتج
{% endcomment %}

{% if product %}
<div id="codform-container-{{ block_id }}" class="codform-container" data-product-id="{{ product.id }}" data-hide-header="true" data-direction="{% if is_rtl %}rtl{% else %}ltr{% endif %}">
  <div class="codform-form-container" dir="{% if is_rtl %}rtl{% else %}ltr{% endif %}">
    <div id="codform-form-loader-{{ block_id }}" class="codform-loader">
      <div class="codform-spinner"></div>
      <p style="direction: {% if is_rtl %}rtl{% else %}ltr{% endif %}; text-align: {% if is_rtl %}right{% else %}left{% endif %};">{{ block.settings.loading_text | default: 'جاري تحميل النموذج...' }}</p>
    </div>

    <div id="codform-form-{{ block_id }}" class="codform-form" style="display: none;" dir="{% if is_rtl %}rtl{% else %}ltr{% endif %}">
      <!-- سيتم إضافة عنوان النموذج هنا يدوياً بأنماط مباشرة -->
      <div class="form-title-field codform-title-field" style="background-color: #9b87f5 !important; padding: 16px !important; border-radius: 8px !important; margin-bottom: 16px !important; width: 100% !important; display: block !important; box-sizing: border-box !important; overflow: hidden !important;">
        <h2 style="color: #ffffff !important; font-size: 24px !important; font-weight: bold !important; margin: 0 !important; padding: 0 !important; text-align: center !important; width: 100% !important; display: block !important;">
          <!-- سيتم استبدال هذا النص بعنوان النموذج -->
        </h2>
        <p style="color: rgba(255, 255, 255, 0.9) !important; font-size: 14px !important; margin-top: 6px !important; margin-bottom: 0 !important; text-align: center !important; width: 100% !important; display: block !important;">
          <!-- سيتم استبدال هذا النص بوصف النموذج -->
        </p>
      </div>
      <!-- بقية النموذج سيتم تحميلها ديناميكيًا -->
    </div>

    <div id="codform-success-{{ block_id }}" class="codform-success" style="display: none;" dir="{% if is_rtl %}rtl{% else %}ltr{% endif %}">
      <div class="codform-success-icon">✓</div>
      <h4 style="text-align: center;">{{ block.settings.success_title | default: 'تم إرسال الطلب بنجاح' }}</h4>
      <p style="text-align: {% if is_rtl %}right{% else %}left{% endif %};">{{ block.settings.success_message | default: 'شكرًا لك، سنتواصل معك في أقرب وقت لإتمام عملية الدفع عند الاستلام.' }}</p>
    </div>

    <div id="codform-error-{{ block_id }}" class="codform-error" style="display: none;" dir="{% if is_rtl %}rtl{% else %}ltr{% endif %}">
      <div class="codform-error-icon">!</div>
      <h4 style="text-align: center;">{{ block.settings.error_title | default: 'حدث خطأ' }}</h4>
      <p style="text-align: {% if is_rtl %}right{% else %}left{% endif %};">{{ block.settings.error_message | default: 'حدث خطأ أثناء تحميل النموذج، يرجى المحاولة مرة أخرى.' }}</p>
      <button id="codform-retry-{{ block_id }}" class="codform-button">{{ block.settings.retry_button | default: 'إعادة المحاولة' }}</button>
    </div>
  </div>
</div>

{% if block.settings.enable_floating_button %}
<div id="codform-floating-button-{{ block_id }}" class="codform-floating-button-container">
  <button
    class="codform-floating-button {% if block.settings.floating_animation != 'none' %}{{ block.settings.floating_animation }}-animation{% endif %}"
    style="
      background-color: {{ block.settings.floating_bg_color | default: '#000000' }};
      color: {{ block.settings.floating_text_color | default: '#ffffff' }};
      border-radius: {{ block.settings.floating_border_radius | default: '4px' }};
      padding: {{ block.settings.floating_padding_y | default: '10px' }} 20px;
      font-size: {{ block.settings.floating_font_size | default: '16px' }};
      font-weight: {{ block.settings.floating_font_weight | default: '500' }};
      margin-bottom: {{ block.settings.floating_margin_bottom | default: '20px' }};
      direction: {% if is_rtl %}rtl{% else %}ltr{% endif %};
      {% if block.settings.floating_border_width != '0px' %}
      border: {{ block.settings.floating_border_width | default: '1px' }} solid {{ block.settings.floating_border_color | default: '#000000' }};
      {% else %}
      border: none;
      {% endif %}
    "
    onclick="document.querySelector('#codform-container-{{ block_id }}').scrollIntoView({behavior: 'smooth'});"
  >
    {% if is_rtl or block.settings.floating_show_icon == false %}
      <span>{{ block.settings.floating_button_text | default: 'اطلب الآن' }}</span>
    {% endif %}
    
    {% if block.settings.floating_show_icon %}
      <span class="codform-floating-button-icon">
        {% case block.settings.floating_icon %}
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
    
    {% unless is_rtl or block.settings.floating_show_icon == false %}
      <span>{{ block.settings.floating_button_text | default: 'Order Now' }}</span>
    {% endunless %}
  </button>
</div>
{% endif %}

<!-- External CSS -->
{{ 'codform.css' | asset_url | stylesheet_tag }}

<style>
  /* أنماط أساسية للعنوان تعمل دائمًا */
  .form-title-field,
  .codform-title-field,
  div[data-field-type="title"],
  div[data-field-type="form-title"],
  div[data-field-type="edit-form-title"],
  div[data-testid="title-field"],
  div[data-testid="edit-form-title-field"],
  .codform-form .space-y-2 > div:first-child {
    background-color: #9b87f5 !important;
    padding: 16px !important;
    border-radius: 8px !important;
    margin-bottom: 16px !important;
    width: 100% !important;
    display: block !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  }

  .form-title-field h2,
  .codform-title-field h2,
  div[data-field-type="title"] h2,
  div[data-field-type="form-title"] h2,
  div[data-field-type="edit-form-title"] h2,
  div[data-testid="title-field"] h2,
  div[data-testid="edit-form-title-field"] h2,
  .codform-form .space-y-2 > div:first-child h2 {
    color: #ffffff !important;
    margin: 0 !important;
    padding: 0 !important;
    font-size: 24px !important;
    font-weight: bold !important;
    text-align: center !important;
    width: 100% !important;
    display: block !important;
  }

  .form-title-field p,
  .codform-title-field p,
  div[data-field-type="title"] p,
  div[data-field-type="form-title"] p,
  div[data-field-type="edit-form-title"] p,
  div[data-testid="title-field"] p,
  div[data-testid="edit-form-title-field"] p,
  .codform-form .space-y-2 > div:first-child p {
    color: rgba(255, 255, 255, 0.9) !important;
    margin-top: 6px !important;
    margin-bottom: 0 !important;
    font-size: 14px !important;
    text-align: center !important;
    width: 100% !important;
    display: block !important;
  }
  
  /* Basic styles for the loader */
  .codform-container {
    margin: 2rem 0;
    padding: 1.5rem;
    border: 1px solid #e5e5e5;
    border-radius: 0.5rem;
    background-color: #f9f9f9;
  }
  
  .codform-loader {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 0;
  }
  
  .codform-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #9b87f5;
    border-radius: 50%;
    animation: codform-spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  @keyframes codform-spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>

<script>
  document.addEventListener('DOMContentLoaded', function() {
    console.log('CODFORM element found with ID: {{ block_id }}');
    console.log('Direction: {% if is_rtl %}rtl{% else %}ltr{% endif %}');
  });
</script>
{% endif %}`;
  
  // Upload the snippet with the updated style fixes
  const snippetResponse = await fetch(`https://${shop}/admin/api/2023-07/themes/${themeId}/assets.json`, {
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
  
  if (!snippetResponse.ok) {
    const errorData = await snippetResponse.text();
    throw new Error(`Failed to create snippet: ${snippetResponse.status} - ${errorData}`);
  }
  
  console.log('Successfully created codform snippet');
  
  // Upload the modified template
  const templateResponse = await fetch(`https://${shop}/admin/api/2023-07/themes/${themeId}/assets.json`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    },
    body: JSON.stringify({
      asset: {
        key: templateKey,
        value: templateContent
      }
    })
  });
  
  if (!templateResponse.ok) {
    const errorData = await templateResponse.text();
    throw new Error(`Failed to update template: ${templateResponse.status} - ${errorData}`);
  }
  
  console.log(`Successfully updated traditional product template with direction: ${formDirection}`);
  
  return {
    block_id: actualBlockId,
    template: templateKey,
    form_direction: formDirection,
    snippet: 'codform.liquid',
    css: 'codform.css'
  };
}
