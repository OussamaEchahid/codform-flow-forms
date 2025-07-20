
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// تحسين دالة تنسيق رقم الهاتف لدعم دول مختلفة
function validateAndFormatPhone(phone: string, formPhonePrefix: string = '+966'): string {
  console.log(`📞 تنسيق رقم الهاتف: ${phone} مع المفتاح: ${formPhonePrefix}`);
  
  if (!phone) {
    const defaultPhone = formPhonePrefix + '500000000';
    console.log(`📞 استخدام رقم افتراضي: ${defaultPhone}`);
    return defaultPhone;
  }
  
  // تنظيف رقم الهاتف
  let cleanPhone = phone.toString().replace(/[\s\-\(\)\.]/g, '');
  cleanPhone = cleanPhone.replace(/[^\d+]/g, '');
  
  console.log(`📞 رقم منظف: ${cleanPhone}`);
  
  // معالجة الأرقام بناءً على كود الدولة المحدد
  if (formPhonePrefix === '+212') {
    // معالجة الأرقام المغربية
    if (cleanPhone.startsWith('00212')) {
      cleanPhone = '+212' + cleanPhone.substring(5);
    } else if (cleanPhone.startsWith('212') && !cleanPhone.startsWith('+212')) {
      cleanPhone = '+212' + cleanPhone.substring(3);
    } else if (cleanPhone.startsWith('0') && !cleanPhone.startsWith('00')) {
      cleanPhone = '+212' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('+212') && !cleanPhone.startsWith('+')) {
      cleanPhone = '+212' + cleanPhone;
    }
  } else if (formPhonePrefix === '+966') {
    // معالجة الأرقام السعودية
    if (cleanPhone.startsWith('00966')) {
      cleanPhone = '+966' + cleanPhone.substring(5);
    } else if (cleanPhone.startsWith('966') && !cleanPhone.startsWith('+966')) {
      cleanPhone = '+966' + cleanPhone.substring(3);
    } else if (cleanPhone.startsWith('05') || cleanPhone.startsWith('01')) {
      cleanPhone = '+966' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('5') && cleanPhone.length === 9) {
      cleanPhone = '+966' + cleanPhone;
    } else if (!cleanPhone.startsWith('+966') && !cleanPhone.startsWith('+')) {
      cleanPhone = '+966' + cleanPhone;
    }
  } else {
    // معالجة عامة للدول الأخرى
    const countryCode = formPhonePrefix.replace('+', '');
    if (cleanPhone.startsWith('00' + countryCode)) {
      cleanPhone = formPhonePrefix + cleanPhone.substring(2 + countryCode.length);
    } else if (cleanPhone.startsWith(countryCode) && !cleanPhone.startsWith(formPhonePrefix)) {
      cleanPhone = formPhonePrefix + cleanPhone.substring(countryCode.length);
    } else if (cleanPhone.startsWith('0') && !cleanPhone.startsWith('00')) {
      cleanPhone = formPhonePrefix + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith(formPhonePrefix) && !cleanPhone.startsWith('+')) {
      cleanPhone = formPhonePrefix + cleanPhone;
    }
  }
  
  // التحقق من صحة التنسيق النهائي
  if (!cleanPhone.startsWith(formPhonePrefix)) {
    cleanPhone = formPhonePrefix + cleanPhone.replace(/^\+?\d+/, '');
  }
  
  console.log(`📞 رقم نهائي: ${cleanPhone}`);
  return cleanPhone;
}

function extractCustomerData(formData: any, formSettings: any = {}): {
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
} {
  console.log('🔍 Extracting customer data from:', JSON.stringify(formData, null, 2));
  console.log('📋 Form settings:', JSON.stringify(formSettings, null, 2));
  
  let name = 'عميل غير محدد';
  let email = '';
  let phone = '';
  let city = '';
  let address = '';
  
  // Enhanced extraction logic with Arabic and English support
  for (const [key, value] of Object.entries(formData)) {
    const keyLower = key.toLowerCase();
    const stringValue = String(value || '').trim();
    
    if (!stringValue) continue;
    
    // Name extraction - more patterns
    if (keyLower.includes('name') || keyLower.includes('اسم') || 
        keyLower.includes('text') && !keyLower.includes('area') ||
        keyLower.includes('customer') || keyLower.includes('عميل')) {
      if (stringValue.length > 2) { // Avoid single characters
        name = stringValue;
      }
    }
    // Email extraction
    else if (keyLower.includes('email') || keyLower.includes('بريد') || 
             keyLower.includes('mail') || stringValue.includes('@')) {
      email = stringValue;
    }
    // Phone extraction - enhanced patterns
    else if (keyLower.includes('phone') || keyLower.includes('هاتف') || 
             keyLower.includes('تليفون') || keyLower.includes('جوال') ||
             keyLower.includes('mobile') || keyLower.includes('tel') ||
             /^\+?[\d\s\-\(\)]{8,}$/.test(stringValue)) {
      phone = stringValue;
    }
    // City extraction
    else if (keyLower.includes('city') || keyLower.includes('مدينة') || 
             keyLower.includes('المدينة') || keyLower.includes('محافظة')) {
      city = stringValue;
    }
    // Address extraction - enhanced patterns
    else if (keyLower.includes('address') || keyLower.includes('عنوان') || 
             keyLower.includes('العنوان') || keyLower.includes('textarea') ||
             keyLower.includes('location') || keyLower.includes('موقع')) {
      if (stringValue.length > city.length) { // Prefer longer address
        address = stringValue;
      }
    }
  }
  
  // استخدام كود الدولة من إعدادات النموذج
  const formPhonePrefix = formSettings.phone_prefix || '+966';
  console.log(`📞 استخدام مفتاح من النموذج: ${formPhonePrefix}`);
  phone = validateAndFormatPhone(phone, formPhonePrefix);
  
  console.log('✅ Extracted customer data:', { name, email, phone, city, address });
  return { name, email, phone, city, address };
}

function createShopifyOrderData(customer: any, formId: string, formSettings: any = {}) {
  const firstName = customer.name.split(' ')[0] || customer.name;
  const lastName = customer.name.split(' ').slice(1).join(' ') || '';
  const currency = formSettings.currency || 'SAR';
  
  return {
    order: {
      financial_status: 'pending',
      fulfillment_status: null,
      currency: currency,
      total_price: '0.00',
      email: customer.email || undefined,
      phone: customer.phone || undefined,
      customer: {
        first_name: firstName,
        last_name: lastName,
        email: customer.email || '',
        phone: customer.phone || ''
      },
      billing_address: customer.city || customer.address ? {
        first_name: firstName,
        last_name: lastName,
        address1: customer.address || customer.city,
        city: customer.city || 'المدينة',
        country: formSettings.country || 'SA',
        phone: customer.phone || ''
      } : undefined,
      shipping_address: customer.city || customer.address ? {
        first_name: firstName,
        last_name: lastName,
        address1: customer.address || customer.city,
        city: customer.city || 'المدينة',
        country: formSettings.country || 'SA',
        phone: customer.phone || ''
      } : undefined,
      line_items: [
        {
          title: 'طلب من النموذج - Form Order',
          quantity: 1,
          price: '0.00'
        }
      ],
      note: `طلب من النموذج - Form submission. ID: ${formId}\nالعميل: ${customer.name}\nالهاتف: ${customer.phone}\nالبريد: ${customer.email}\nالمدينة: ${customer.city}\nالعنوان: ${customer.address}`,
      tags: 'form-submission,نموذج'
    }
  };
}

async function createShopifyOrder(shopDomain: string, accessToken: string, customer: any, formId: string, formSettings: any = {}): Promise<string | null> {
  console.log('🛒 Starting Shopify order creation process...');
  console.log('📋 Customer data for order:', JSON.stringify(customer, null, 2));
  console.log('⚙️ Form settings:', JSON.stringify(formSettings, null, 2));
  
  const orderData = createShopifyOrderData(customer, formId, formSettings);
  console.log('🎯 Creating Shopify order:', JSON.stringify(orderData, null, 2));
  
  try {
    const response = await fetch(`https://${shopDomain}/admin/api/2025-01/orders.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();
    console.log('📦 Shopify order response:', JSON.stringify(result, null, 2));
    console.log('🔍 Response status:', response.status);

    if (response.ok && result.order) {
      console.log('✅ Shopify order created successfully:', result.order.id);
      return result.order.id;
    } else {
      console.error('❌ Order creation failed:', JSON.stringify(result, null, 2));
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating Shopify order:', error);
    return null;
  }
}

serve(async (req: Request) => {
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
    const requestData = await req.json();
    console.log('📝 Request data received:', JSON.stringify(requestData, null, 2));
    
    const formId = requestData.formId || requestData.form_id;
    const shopDomain = requestData.shopDomain || '';
    const formData = requestData.data || requestData.formData || requestData;
    
    console.log('🏪 Shop domain:', shopDomain);
    console.log('📋 Form ID:', formId);
    
    if (!formId || !shopDomain) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: formId and shopDomain' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get form settings from database with fallback
    let formSettings = {};
    let actualFormId = formId;
    
    try {
      console.log('🔍 Looking up form settings for ID:', formId);
      
      // First try to get form by exact ID
      let { data: formData, error: formError } = await supabase
        .from('forms')
        .select('id, country, currency, phone_prefix')
        .eq('id', formId)
        .single();
        
      if (formError || !formData) {
        console.log('⚠️ Form not found by ID, trying fallback by shop_id:', shopDomain);
        
        // Fallback: get the most recent form for this shop
        const { data: fallbackFormData, error: fallbackError } = await supabase
          .from('forms')
          .select('id, country, currency, phone_prefix')
          .eq('shop_id', shopDomain)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();
          
        if (!fallbackError && fallbackFormData) {
          formData = fallbackFormData;
          actualFormId = fallbackFormData.id;
          console.log('✅ Using fallback form:', actualFormId);
        } else {
          console.log('⚠️ No fallback form found, using default settings');
        }
      }
      
      if (formData) {
        formSettings = {
          country: formData.country || 'SA',
          currency: formData.currency || 'SAR',
          phone_prefix: formData.phone_prefix || '+966'
        };
        console.log('📋 Retrieved form settings:', JSON.stringify(formSettings, null, 2));
      }
    } catch (error) {
      console.error('⚠️ Could not retrieve form settings:', error);
    }
    
    // Store submission in database
    console.log('💾 Storing submission with formId:', actualFormId, 'shopDomain:', shopDomain);
    
    const submissionRecord = {
      form_id: actualFormId,
      shop_id: shopDomain,
      data: {
        formId: formId,
        shopDomain: shopDomain,
        data: formData
      }
    };
    
    console.log('📋 Submission record:', JSON.stringify(submissionRecord, null, 2));
    
    const { data: submissionData, error: submissionError } = await supabase
      .from('form_submissions')
      .insert(submissionRecord)
      .select()
      .single();

    if (submissionError) {
      console.error('Error storing submission:', submissionError);
      return new Response(
        JSON.stringify({ error: 'Failed to store submission', details: submissionError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Create order from form submission and sync with Shopify
    try {
      console.log('📝 Processing form data:', JSON.stringify(formData, null, 2));
      
      // Extract customer information using form settings
      const customer = extractCustomerData(formData, formSettings);
      
      // Get shopify access token
      const { data: shopData, error: shopError } = await supabase
        .from('shopify_stores')
        .select('access_token')
        .eq('shop', shopDomain)
        .eq('is_active', true)
        .single();

      if (shopError || !shopData?.access_token) {
        console.error('Error getting Shopify access token:', shopError);
        throw new Error('Unable to access Shopify store');
      }

      console.log('🔑 Found Shopify access token for shop:', shopDomain);

      // Create order in Shopify with form settings
      const shopifyOrderId = await createShopifyOrder(shopDomain, shopData.access_token, customer, actualFormId, formSettings);

      // Generate order number
      const orderNumber = shopifyOrderId ? `SHOP-${shopifyOrderId}` : `ORD-${Date.now()}`;
      
      console.log('📋 Creating order with data:', {
        orderNumber,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        shopifyOrderId,
        submissionId: submissionData.id,
        currency: formSettings.currency || 'SAR'
      });
      
      // Create order in our database with correct currency and settings
      const orderInsertData = {
        order_number: orderNumber,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        total_amount: 0.00,
        currency: formSettings.currency || 'SAR',
        status: 'pending',
        items: [{ title: 'طلب من النموذج - Form Order', quantity: 1, price: '0.00' }],
        shipping_address: { address: customer.address, city: customer.city },
        billing_address: { address: customer.address, city: customer.city },
        form_id: actualFormId,
        shop_id: shopDomain,
        shopify_order_id: shopifyOrderId?.toString()
      };
      
      console.log('📝 Order insert data:', JSON.stringify(orderInsertData, null, 2));
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert(orderInsertData)
        .select()
        .single();

      if (orderError) {
        console.error('❌ Error creating order in database:', orderError);
        console.log('🔍 Order insert data that failed:', JSON.stringify(orderInsertData, null, 2));
      } else {
        console.log('✅ Order created in database successfully:', orderData.order_number);
        console.log('📦 Order details:', JSON.stringify(orderData, null, 2));
      }

    } catch (orderCreationError) {
      console.error('❌ Error in order creation process:', orderCreationError);
      // Continue even if order creation fails
    }

    // Return success with redirect URL
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'تم إرسال طلبكم بنجاح',
        submissionId: submissionData.id,
        redirect: '/thank-you'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
