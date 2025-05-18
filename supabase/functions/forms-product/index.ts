
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request for CORS preflight");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log request details for debugging
    const url = new URL(req.url);
    const shop = url.searchParams.get('shop');
    const productId = url.searchParams.get('productId');
    const blockId = url.searchParams.get('blockId'); // Get blockId from URL params
    const requestId = `req_${Math.random().toString(36).substring(2, 10)}`;
    const debugMode = url.searchParams.get('debug') === 'true';
    
    console.log(`[${requestId}] Product form request received - shop: ${shop}, product: ${productId}, blockId: ${blockId}, debug: ${debugMode}`);

    if (!shop || !productId) {
      console.error(`[${requestId}] Missing required parameters: shop=${shop}, productId=${productId}`);
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: shop or productId' }),
        { 
          headers: {...corsHeaders, 'Content-Type': 'application/json'},
          status: 400 
        }
      );
    }

    // Create Supabase client - with PUBLIC ANON KEY
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      console.error(`[${requestId}] Missing Supabase configuration`);
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          headers: corsHeaders, 
          status: 500 
        }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[${requestId}] Fetching form for shop ${shop}, product ${productId}`);

    // First, check if there's a specific form for this product
    const { data: productSettings, error: settingsError } = await supabase
      .from('shopify_product_settings')
      .select('form_id, block_id, enabled')
      .eq('shop_id', shop)
      .eq('product_id', productId)
      .eq('enabled', true)
      .maybeSingle();

    if (settingsError && settingsError.code !== 'PGRST116') {
      // Real error, not just "no rows returned"
      console.error(`[${requestId}] Error fetching product settings:`, settingsError);
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve product settings', details: settingsError }),
        { 
          headers: corsHeaders, 
          status: 500 
        }
      );
    }

    // If we have product-specific settings, get that form
    let form = null;
    let formSource = 'none';
    let actualBlockId = blockId || ''; // Use provided blockId or empty string
    
    if (productSettings && productSettings.form_id) {
      console.log(`[${requestId}] Found product-specific form ID: ${productSettings.form_id}`);
      formSource = 'product-specific';
      
      // Use the product settings block_id if available and no blockId was provided
      if (productSettings.block_id && !actualBlockId) {
        actualBlockId = productSettings.block_id;
      }
      
      // استرداد بيانات النموذج (فقط الحقول الأساسية والبيانات) - بدون عمود settings
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('id, title, description, data, style, is_published')
        .eq('id', productSettings.form_id)
        .eq('is_published', true)
        .limit(1);
        
      if (!formError && formData && formData.length > 0) {
        form = formData[0];
        // إضافة كائن إعدادات افتراضي إذا لم يكن موجودًا
        form.settings = form.settings || { enableIcons: true };
        console.log(`[${requestId}] Successfully fetched product-specific form with ID: ${form.id}`);
      } else if (formError) {
        console.log(`[${requestId}] Error fetching product-specific form: ${formError.message}. Will try default form.`);
      } else {
        console.log(`[${requestId}] No product-specific form found with ID: ${productSettings.form_id}. Will try default form.`);
      }
    } else {
      console.log(`[${requestId}] No product-specific settings found for product ${productId}`);
    }

    // If no product-specific form was found, get the default form
    if (!form) {
      console.log(`[${requestId}] Trying default form for shop ${shop}`);
      formSource = 'default';
      
      // استرداد بيانات النموذج الافتراضي - بدون عمود settings
      const { data: defaultForms, error: defaultError } = await supabase
        .from('forms')
        .select('id, title, description, data, style, is_published')
        .eq('shop_id', shop)
        .eq('is_published', true)
        .order('updated_at', { ascending: false })
        .limit(1);
      
      if (!defaultError && defaultForms && defaultForms.length > 0) {
        form = defaultForms[0];
        // إضافة كائن إعدادات افتراضي إذا لم يكن موجودًا
        form.settings = form.settings || { enableIcons: true };
        console.log(`[${requestId}] Using default form: ${form.id}`);
      } else if (defaultError) {
        console.error(`[${requestId}] Error fetching default form:`, defaultError);
      } else {
        console.log(`[${requestId}] No default form found for shop ${shop}`);
      }
    }

    // If we still don't have a blockId, generate one
    if (!actualBlockId) {
      actualBlockId = `codform_${Date.now().toString(36)}`;
      console.log(`[${requestId}] Generated new blockId: ${actualBlockId}`);
    }

    // تحسين: استخراج الحقول من بنية data
    if (form && form.data) {
      console.log(`[${requestId}] Extracting fields from form data structure`);
      
      // Initialize fields array
      let extractedFields = [];
      
      try {
        // Check if data is an array (steps format)
        if (Array.isArray(form.data)) {
          console.log(`[${requestId}] Form data is in steps format with ${form.data.length} steps`);
          // Extract fields from all steps
          for (const step of form.data) {
            if (step && step.fields && Array.isArray(step.fields)) {
              extractedFields = [...extractedFields, ...step.fields];
            }
          }
        } else if (typeof form.data === 'object' && form.data !== null) {
          // Try to find fields in other data structures
          if (form.data.fields && Array.isArray(form.data.fields)) {
            extractedFields = form.data.fields;
          } else if (form.data.steps && Array.isArray(form.data.steps)) {
            // Extract from steps if available
            for (const step of form.data.steps) {
              if (step && step.fields && Array.isArray(step.fields)) {
                extractedFields = [...extractedFields, ...step.fields];
              }
            }
          }
        }
        
        console.log(`[${requestId}] Successfully extracted ${extractedFields.length} fields from form.data`);
        form.fields = extractedFields;
      } catch (err) {
        console.error(`[${requestId}] Error extracting fields from data:`, err);
        // Initialize as empty array if extraction fails
        form.fields = [];
      }
    }

    // 4. إنشاء حقول افتراضية إذا لم تكن موجودة
    if (form && (!form.fields || !Array.isArray(form.fields) || form.fields.length === 0)) {
      console.log(`[${requestId}] Creating default fields for form`);
      
      const language = form.style?.direction === 'rtl' ? 'ar' : 'en';
      
      // إنشاء حقول افتراضية
      form.fields = [
        {
          type: 'form-title',
          id: `title-${Date.now()}`,
          label: language === 'ar' ? 'نموذج جديد' : 'New Form',
          helpText: language === 'ar' ? 'نموذج جديد للطلب' : 'New order form',
          style: {
            color: '#ffffff',
            textAlign: language === 'ar' ? 'right' : 'left',
            fontWeight: 'bold',
            fontSize: '24px',
            descriptionColor: '#ffffff',
            descriptionFontSize: '14px',
            backgroundColor: form.style?.primaryColor || '#9b87f5',
          }
        },
        {
          type: 'text',
          id: `name-${Date.now()}`,
          label: language === 'ar' ? 'الاسم الكامل' : 'Full name',
          placeholder: language === 'ar' ? 'أدخل الاسم الكامل' : 'Enter full name',
          required: true,
          icon: 'user',
          style: { showIcon: true }
        },
        {
          type: 'phone',
          id: `phone-${Date.now()}`,
          label: language === 'ar' ? 'رقم الهاتف' : 'Phone number',
          placeholder: language === 'ar' ? 'أدخل رقم الهاتف' : 'Enter phone number',
          required: true,
          icon: 'phone',
          style: { showIcon: true }
        },
        {
          type: 'textarea',
          id: `address-${Date.now()}`,
          label: language === 'ar' ? 'العنوان' : 'Address',
          placeholder: language === 'ar' ? 'أدخل العنوان الكامل' : 'Enter full address',
          required: true,
        },
        {
          type: 'submit',
          id: `submit-${Date.now()}`,
          label: language === 'ar' ? 'إرسال الطلب' : 'Submit Order',
          style: {
            backgroundColor: form.style?.primaryColor || '#9b87f5',
            color: '#ffffff',
            fontSize: '18px',
            animation: true,
            animationType: 'pulse',
          },
        }
      ];
      
      console.log(`[${requestId}] Created ${form.fields.length} default fields for the form`);
    }

    // Ensure the settings object exists and process field data
    if (form) {
      // Make sure form has a settings object
      if (!form.settings) {
        form.settings = { enableIcons: true };
        console.log(`[${requestId}] Created default settings object for form`);
      }
      
      // Make sure enableIcons is set (default to true if not specified)
      form.settings.enableIcons = form.settings.enableIcons !== false;
      
      // Add block_id to the form for reference
      form.block_id = actualBlockId;
      
      // Process form fields to ensure icons are correctly formatted
      if (form.fields && Array.isArray(form.fields)) {
        form.fields = form.fields.map(field => {
          if (!field) return field;
          
          // Make a copy of the field to avoid modifying the original
          const processedField = { ...field };
          
          // Make sure icon is properly defined and not empty string
          if (processedField.icon === undefined || processedField.icon === '') {
            processedField.icon = 'none';
          }
          
          // Ensure style object exists
          if (!processedField.style) {
            processedField.style = {};
          }
          
          // Make sure showIcon is properly defined if an icon exists
          if (processedField.icon && processedField.icon !== 'none') {
            processedField.style.showIcon = processedField.style.showIcon !== undefined ? 
              processedField.style.showIcon : true;
          }

          // Special handling for submit buttons to ensure they have the right style
          if (processedField.type === 'submit') {
            if (!processedField.style) processedField.style = {};
            // Ensure animation settings are properly transferred
            if (processedField.style.animation) {
              processedField.style.animationType = processedField.style.animationType || 'pulse';
            }
            // Ensure consistent colors
            processedField.style.backgroundColor = processedField.style.backgroundColor || '#9b87f5';
            processedField.style.color = processedField.style.color || '#ffffff';
            processedField.style.fontSize = processedField.style.fontSize || '18px';
          }
          
          // Special handling for text inputs to ensure icon display is correct
          if (processedField.type === 'text' || processedField.type === 'phone' || processedField.type === 'email') {
            if (processedField.icon && processedField.icon !== 'none') {
              if (!processedField.style) processedField.style = {};
              processedField.style.showIcon = true;
            }
          }
          
          return processedField;
        });

        // Log all form fields with icon information for debugging
        if (debugMode || (form.fields && form.fields.some(f => f && f.icon && f.icon !== 'none'))) {
          console.log(`[${requestId}] Form fields with icon information:`);
          form.fields.forEach(field => {
            if (field && field.icon && field.icon !== 'none') {
              console.log(`[${requestId}] Field ${field.id} (${field.type}) has icon: ${field.icon}, showIcon: ${field.style?.showIcon !== false}`);
            }
          });
        }
      } else {
        console.error(`[${requestId}] Form fields are missing or not an array`);
        form.fields = [];
      }

      // Verify that form style object exists
      if (!form.style) {
        form.style = {
          primaryColor: '#9b87f5',
          borderRadius: '8px',
          fontSize: '16px',
          direction: 'rtl'
        };
      }
    }

    // Add debug information if requested
    const debugInfo = debugMode ? {
      requestId,
      timestamp: new Date().toISOString(),
      formSource,
      shopId: shop,
      productId,
      blockId: actualBlockId,
      hasForm: !!form,
      formId: form?.id || null,
      fieldsCount: form?.fields?.length || 0,
      fieldsWithIcons: form?.fields?.filter(f => f && f.icon && f.icon !== 'none').length || 0,
      iconsEnabled: form?.settings?.enableIcons !== false,
      style: form?.style || null
    } : undefined;

    // Return form data
    if (form) {
      const fieldsWithIcons = form.fields?.filter(field => field && field.icon && field.icon !== 'none') || [];
      console.log(`[${requestId}] Successfully sending form data to client. Form has ${form.fields?.length || 0} fields, ${fieldsWithIcons.length} with icons`);
      
      if (fieldsWithIcons.length > 0) {
        console.log(`[${requestId}] Icon types used: ${fieldsWithIcons.map(f => f.icon).join(', ')}`);
      }
      
      return new Response(
        JSON.stringify({ 
          form,
          block_id: actualBlockId,
          debug: debugInfo 
        }),
        { 
          headers: {
            ...corsHeaders,
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Content-Type': 'application/json'
          },
          status: 200 
        }
      );
    } else {
      // No form found at all
      console.log(`[${requestId}] No form found for shop ${shop}`);
      return new Response(
        JSON.stringify({ 
          message: 'No form found for this shop',
          block_id: actualBlockId,
          debug: debugInfo
        }),
        { 
          headers: {...corsHeaders, 'Content-Type': 'application/json'}, 
          status: 404 
        }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        headers: {...corsHeaders, 'Content-Type': 'application/json'}, 
        status: 500 
      }
    );
  }
});
