
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// Add retry mechanism for database operations
async function queryWithRetry(queryFn, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error) {
      console.warn(`Database query attempt ${attempt + 1}/${maxRetries} failed:`, error);
      lastError = error;
      
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }
  }
  
  throw lastError;
}

serve(async (req: Request) => {
  const responseHeaders = {
    ...corsHeaders,
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request for CORS preflight");
    return new Response(null, { headers: responseHeaders });
  }

  try {
    const url = new URL(req.url);
    const shop = url.searchParams.get('shop');
    const productId = url.searchParams.get('productId');
    const blockId = url.searchParams.get('blockId');
    const requestId = `req_${Math.random().toString(36).substring(2, 10)}`;
    const debugMode = url.searchParams.get('debug') === 'true';
    
    console.log(`[${requestId}] 🎯 COMPREHENSIVE FIX - Product form request received`);
    console.log(`[${requestId}] Parameters: shop=${shop}, product=${productId}, blockId=${blockId}, debug=${debugMode}`);

    if (!shop || !productId) {
      console.error(`[${requestId}] ❌ Missing required parameters`);
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters: shop or productId',
          success: false,
          message: 'Shop and productId parameters are required',
          requestId,
          timestamp: new Date().toISOString()
        }),
        { headers: responseHeaders, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      console.error(`[${requestId}] ❌ Missing Supabase configuration`);
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          success: false,
          requestId,
          timestamp: new Date().toISOString()
        }),
        { headers: responseHeaders, status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[${requestId}] 🔍 Fetching form for shop ${shop}, product ${productId}`);

    // First, check if there's a specific form for this product
    let productSettings, settingsError;
    
    try {
      console.log(`[${requestId}] 🔎 Checking product-specific settings...`);
      const queryResult = await queryWithRetry(async () => {
        return await supabase
          .from('shopify_product_settings')
          .select('form_id, block_id, enabled')
          .eq('shop_id', shop)
          .eq('product_id', productId)
          .eq('enabled', true)
          .maybeSingle();
      });
      
      productSettings = queryResult.data;
      settingsError = queryResult.error;
      
      console.log(`[${requestId}] 📋 Product settings result:`, { 
        found: !!productSettings, 
        formId: productSettings?.form_id,
        error: settingsError?.message 
      });
      
    } catch (error) {
      console.error(`[${requestId}] ❌ Error fetching product settings:`, error);
      settingsError = {
        message: error.message || 'Database query failed after multiple attempts',
        details: error.toString()
      };
    }

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error(`[${requestId}] ❌ Real error in product settings:`, settingsError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to retrieve product settings', 
          details: settingsError,
          success: false,
          requestId,
          timestamp: new Date().toISOString()
        }),
        { headers: responseHeaders, status: 500 }
      );
    }

    let form = null;
    let formSource = 'none';
    let actualBlockId = blockId || '';
    
    // Try to get product-specific form first
    if (productSettings && productSettings.form_id) {
      console.log(`[${requestId}] 🎯 Found product-specific form ID: ${productSettings.form_id}`);
      formSource = 'product-specific';
      
      if (productSettings.block_id && !actualBlockId) {
        actualBlockId = productSettings.block_id;
      }
      
      try {
        console.log(`[${requestId}] 🔄 Fetching product-specific form data...`);
        const queryResult = await queryWithRetry(async () => {
          return await supabase
            .from('forms')
            .select('id, title, description, data, style, is_published')
            .eq('id', productSettings.form_id)
            .eq('is_published', true)
            .maybeSingle();
        });
        
        const formData = queryResult.data;
        const formError = queryResult.error;
        
        console.log(`[${requestId}] 📄 Form data result:`, { 
          found: !!formData, 
          formId: formData?.id,
          error: formError?.message 
        });
        
        if (!formError && formData) {
          form = formData;
          form.settings = form.settings || { enableIcons: true };
          console.log(`[${requestId}] ✅ Successfully fetched product-specific form`);
        } else if (formError) {
          console.log(`[${requestId}] ⚠️ Error fetching product-specific form: ${formError.message}. Will try default form.`);
        } else {
          console.log(`[${requestId}] ⚠️ No product-specific form found. Will try default form.`);
        }
        
      } catch (error) {
        console.error(`[${requestId}] ❌ Error in product-specific form query:`, error);
      }
    } else {
      console.log(`[${requestId}] ℹ️ No product-specific settings found`);
    }

    // If no product-specific form was found, get the default form
    if (!form) {
      console.log(`[${requestId}] 🔄 Trying default form for shop ${shop}`);
      formSource = 'default';
      
      try {
        const queryResult = await queryWithRetry(async () => {
          return await supabase
            .from('forms')
            .select('id, title, description, data, style, is_published')
            .eq('shop_id', shop)
            .eq('is_published', true)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();
        });
        
        const defaultForm = queryResult.data;
        const defaultError = queryResult.error;
        
        console.log(`[${requestId}] 📄 Default forms result:`, { 
          found: !!defaultForm,
          error: defaultError?.message 
        });
        
        if (!defaultError && defaultForm) {
          form = defaultForm;
          form.settings = form.settings || { enableIcons: true };
          console.log(`[${requestId}] ✅ Using default form: ${form.id}`);
        } else if (defaultError) {
          console.error(`[${requestId}] ❌ Error fetching default form:`, defaultError);
        } else {
          console.log(`[${requestId}] ⚠️ No default form found for shop ${shop}`);
        }
        
      } catch (error) {
        console.error(`[${requestId}] ❌ Error in default form query:`, error);
      }
    }

    // Generate blockId if needed
    if (!actualBlockId) {
      actualBlockId = `codform_${Date.now().toString(36)}`;
      console.log(`[${requestId}] 🆔 Generated new blockId: ${actualBlockId}`);
    }

    // Extract and process fields from form data
    if (form && form.data) {
      console.log(`[${requestId}] 🔧 Processing form data structure`);
      
      let extractedFields = [];
      
      try {
        if (Array.isArray(form.data)) {
          console.log(`[${requestId}] 📊 Form data is in steps format with ${form.data.length} steps`);
          for (const step of form.data) {
            if (step && step.fields && Array.isArray(step.fields)) {
              extractedFields = [...extractedFields, ...step.fields];
            }
          }
        } else if (typeof form.data === 'object' && form.data !== null) {
          if (form.data.fields && Array.isArray(form.data.fields)) {
            extractedFields = form.data.fields;
          } else if (form.data.steps && Array.isArray(form.data.steps)) {
            for (const step of form.data.steps) {
              if (step && step.fields && Array.isArray(step.fields)) {
                extractedFields = [...extractedFields, ...step.fields];
              }
            }
          }
        }
        
        console.log(`[${requestId}] ✅ Successfully extracted ${extractedFields.length} fields`);
        form.fields = extractedFields;
        
      } catch (err) {
        console.error(`[${requestId}] ❌ Error extracting fields:`, err);
        form.fields = [];
      }
    }

    // Create default fields if none exist
    if (form && (!form.fields || !Array.isArray(form.fields) || form.fields.length === 0)) {
      console.log(`[${requestId}] 🛠️ Creating default fields`);
      
      const language = form.style?.direction === 'rtl' ? 'ar' : 'en';
      
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
      
      console.log(`[${requestId}] ✅ Created ${form.fields.length} default fields`);
    }

    // Final form processing
    if (form) {
      if (!form.settings) {
        form.settings = { enableIcons: true };
      }
      
      form.settings.enableIcons = form.settings.enableIcons !== false;
      form.block_id = actualBlockId;
      
      // Process form fields
      if (form.fields && Array.isArray(form.fields)) {
        form.fields = form.fields.map(field => {
          if (!field) return field;
          
          const processedField = { ...field };
          
          if (processedField.icon === undefined || processedField.icon === '') {
            processedField.icon = 'none';
          }
          
          if (!processedField.style) {
            processedField.style = {};
          }
          
          if (processedField.icon && processedField.icon !== 'none') {
            processedField.style.showIcon = processedField.style.showIcon !== undefined ? 
              processedField.style.showIcon : true;
          }

          if (processedField.type === 'submit') {
            if (!processedField.style) processedField.style = {};
            if (processedField.style.animation) {
              processedField.style.animationType = processedField.style.animationType || 'pulse';
            }
            processedField.style.backgroundColor = processedField.style.backgroundColor || '#9b87f5';
            processedField.style.color = processedField.style.color || '#ffffff';
            processedField.style.fontSize = processedField.style.fontSize || '18px';
          }
          
          if (['text', 'phone', 'email'].includes(processedField.type)) {
            if (processedField.icon && processedField.icon !== 'none') {
              if (!processedField.style) processedField.style = {};
              processedField.style.showIcon = true;
            }
          }
          
          return processedField;
        });
      } else {
        form.fields = [];
      }

      if (!form.style) {
        form.style = {
          primaryColor: '#9b87f5',
          borderRadius: '8px',
          fontSize: '16px',
          direction: 'rtl'
        };
      }
    }

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

    // Fetch Quantity Offers for this product and form
    let quantityOffers = null;
    if (form && productId) {
      try {
        console.log(`[${requestId}] 🎁 Fetching quantity offers for product ${productId} and form ${form.id}`);
        
        const { data: offersData, error: offersError } = await queryWithRetry(() => {
          return supabase
            .from('quantity_offers')
            .select('*')
            .eq('product_id', productId)
            .eq('form_id', form.id)
            .eq('enabled', true)
            .maybeSingle();
        });
        
        if (offersError) {
          console.log(`[${requestId}] ℹ️ No quantity offers found:`, offersError.message);
        } else if (offersData) {
          quantityOffers = offersData;
          console.log(`[${requestId}] ✅ Found quantity offers:`, quantityOffers);
        } else {
          console.log(`[${requestId}] ℹ️ No quantity offers configured for this product`);
        }
      } catch (error) {
        console.error(`[${requestId}] ❌ Error fetching quantity offers:`, error);
      }
    }

    // Return success response
    if (form) {
      const fieldsWithIcons = form.fields?.filter(field => field && field.icon && field.icon !== 'none') || [];
      console.log(`[${requestId}] 🎉 SUCCESS - Sending form data to client`);
      console.log(`[${requestId}] 📊 Form stats: ${form.fields?.length || 0} fields, ${fieldsWithIcons.length} with icons`);
      
      const response = {
        form,
        quantity_offers: quantityOffers,
        block_id: actualBlockId,
        debug: debugInfo,
        success: true,
        requestId,
        timestamp: new Date().toISOString()
      };
      
      console.log(`[${requestId}] 📦 Response includes quantity offers:`, !!quantityOffers);
      
      return new Response(
        JSON.stringify(response),
        { headers: responseHeaders, status: 200 }
      );
    } else {
      console.log(`[${requestId}] 📭 No form found for shop ${shop}`);
      return new Response(
        JSON.stringify({ 
          message: 'No form found for this shop',
          block_id: actualBlockId,
          debug: debugInfo,
          success: false,
          requestId,
          timestamp: new Date().toISOString()
        }),
        { headers: responseHeaders, status: 404 }
      );
    }
    
  } catch (error) {
    console.error('❌ CRITICAL ERROR in forms-product:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        success: false,
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      }),
      { headers: responseHeaders, status: 500 }
    );
  }
});
