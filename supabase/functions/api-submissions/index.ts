import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// إخفاء البيانات الحساسة في السجلات (PII/tokens)
function mask(value: unknown): unknown {
  try {
    const s = typeof value === 'string' ? value : JSON.stringify(value);
    return s
      .replace(/\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, '[redacted-email]')
      .replace(/\+?\d[\d\s\-()]{6,}/g, '[redacted-phone]')
      .replace(/(authorization|x-shopify-access-token|access_token)(["'\s:]*)([A-Za-z0-9._-]+)/gi, '$1$2[redacted-token]');
  } catch {
    return '[redacted]';
  }
}
const _log = console.log.bind(console);
const _error = console.error.bind(console);
console.log = (...args: any[]) => _log(...args.map(mask));
console.error = (...args: any[]) => _error(...args.map(mask));

// تحسين دالة تنسيق رقم الهاتف لدعم دول مختلفة
function validateAndFormatPhone(phone: string, formPhonePrefix: string = '+212'): string {
  console.log(`📞 تنسيق رقم الهاتف: ${phone} مع المفتاح: ${formPhonePrefix}`);
  
  if (!phone) {
    const defaultPhone = formPhonePrefix + '600000000';
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
      // إزالة الصفر والتأكد من أن الرقم صحيح
      const phoneWithoutZero = cleanPhone.substring(1);
      if (phoneWithoutZero.length >= 8 && phoneWithoutZero.length <= 9) {
        cleanPhone = '+212' + phoneWithoutZero;
      } else {
        cleanPhone = '+212600000000'; // رقم افتراضي صحيح
      }
    } else if (!cleanPhone.startsWith('+212') && !cleanPhone.startsWith('+')) {
      if (cleanPhone.length >= 8 && cleanPhone.length <= 9) {
        cleanPhone = '+212' + cleanPhone;
      } else {
        cleanPhone = '+212600000000'; // رقم افتراضي صحيح
      }
    }
  } else if (formPhonePrefix === '+966') {
    // معالجة الأرقام السعودية
    if (cleanPhone.startsWith('00966')) {
      cleanPhone = '+966' + cleanPhone.substring(5);
    } else if (cleanPhone.startsWith('966') && !cleanPhone.startsWith('+966')) {
      cleanPhone = '+966' + cleanPhone.substring(3);
    } else if (cleanPhone.startsWith('05') || cleanPhone.startsWith('01')) {
      cleanPhone = '+966' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('0') && !cleanPhone.startsWith('00')) {
      // إزالة الصفر والتأكد من أن الرقم صحيح
      const phoneWithoutZero = cleanPhone.substring(1);
      if (phoneWithoutZero.length >= 8 && phoneWithoutZero.length <= 9) {
        cleanPhone = '+966' + phoneWithoutZero;
      } else {
        cleanPhone = '+966500000000'; // رقم افتراضي صحيح
      }
    } else if (cleanPhone.startsWith('5') && cleanPhone.length === 9) {
      cleanPhone = '+966' + cleanPhone;
    } else if (!cleanPhone.startsWith('+966') && !cleanPhone.startsWith('+')) {
      if (cleanPhone.length >= 8 && cleanPhone.length <= 9) {
        cleanPhone = '+966' + cleanPhone;
      } else {
        cleanPhone = '+966500000000'; // رقم افتراضي صحيح
      }
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
  
  // التأكد من أن الرقم يبدأ بالمفتاح الصحيح
  if (!cleanPhone.startsWith(formPhonePrefix)) {
    cleanPhone = formPhonePrefix + '600000000'; // رقم افتراضي للمغرب
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

// دالة استخراج السعر المحول من بيانات النموذج - محسنة
function extractConvertedPrice(formData: any): { price: number; currency: string } {
  console.log('💰 Extracting converted price from form data:', formData);
  
  // الأولوية الأولى: السعر المحول المحفوظ في البيانات المرسلة مباشرة من الفرونت إند
  if (formData.extractedPrice && parseFloat(formData.extractedPrice) > 1) {
    const price = parseFloat(formData.extractedPrice);
    const currency = formData.extractedCurrency || 'SAR';
    console.log('🎯 Using saved converted price from frontend:', price, currency);
    return { price, currency };
  }
  
  // الأولوية الثانية: البحث في بيانات النموذج المتداخلة (إذا كانت في data object)
  if (formData.data && typeof formData.data === 'object') {
    if (formData.data.extractedPrice && parseFloat(formData.data.extractedPrice) > 1) {
      const price = parseFloat(formData.data.extractedPrice);
      const currency = formData.data.extractedCurrency || 'SAR';
      console.log('🎯 Using saved converted price from nested data:', price, currency);
      return { price, currency };
    }
  }
  
  // الأولوية الثالثة: البحث الشامل في جميع مستويات البيانات
  function searchInObject(obj: any, prefix: string = ''): { price: number; currency: string } | null {
    for (const [key, value] of Object.entries(obj)) {
      const keyLower = key.toLowerCase();
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // البحث الرقصي في الكائنات المتداخلة
        const nested = searchInObject(value, fullKey);
        if (nested && nested.price > 1) return nested;
      } else if (value) {
        const stringValue = String(value).trim();
        
        // البحث عن أنماط السعر المختلفة
        if (keyLower.includes('extractedprice') || keyLower.includes('converted_price') || 
            keyLower.includes('final_price') || keyLower.includes('total_price') ||
            keyLower.includes('finalPrice') || keyLower.includes('convertedPrice')) {
          const price = parseFloat(stringValue);
          if (price && price > 1) {
            console.log(`💰 Found converted price in ${fullKey}:`, price);
            
            // البحث عن العملة المرتبطة
            const currencyKey = key.replace(/price/i, 'currency').replace(/Price/i, 'Currency');
            const currency = obj[currencyKey] || 'SAR';
            
            return { price, currency };
          }
        }
      }
    }
    return null;
  }
  
  const foundPrice = searchInObject(formData);
  if (foundPrice) return foundPrice;
  
  // الأولوية الرابعة: البحث عن أي سعر في البيانات
  for (const [key, value] of Object.entries(formData)) {
    const keyLower = key.toLowerCase();
    const stringValue = String(value || '').trim();
    
    if (!stringValue) continue;
    
    // البحث عن أي سعر مع تجنب IDs والقيم غير المرغوبة
    if ((keyLower.includes('price') || keyLower.includes('amount') || 
        keyLower.includes('total') || keyLower.includes('سعر')) &&
        !keyLower.includes('id') && !keyLower.includes('template') &&
        !keyLower.includes('product-') && !keyLower.includes('form-')) {
      const price = parseFloat(stringValue);
      if (price && price > 1) {
        console.log('💰 Found price in form data:', price);
        return { price, currency: 'SAR' }; // العملة الافتراضية
      }
    }
  }
  
  console.log('⚠️ No converted price found, using default 0');
  return { price: 0, currency: 'SAR' };
}

function createShopifyOrderData(customer: any, formId: string, formSettings: any = {}, convertedPrice: { price: number; currency: string } = { price: 0, currency: 'SAR' }) {
  const nameParts = customer.name ? customer.name.split(' ') : ['Customer'];
  const firstName = nameParts[0] || 'Customer';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Order'; // Always provide a last name
  const currency = convertedPrice.currency || formSettings.currency || 'SAR'; // إعطاء الأولوية للعملة المحولة
  const totalPrice = convertedPrice.price > 0 ? convertedPrice.price.toFixed(2) : '0.00';
  
  console.log(`💰 Using converted price: ${totalPrice} ${currency} (from converted price logic)`);
  
  return {
    order: {
      financial_status: 'pending',
      fulfillment_status: null,
      currency: currency,
      total_price: totalPrice,
      email: customer.email || undefined,
      phone: customer.phone || undefined,
      // Remove customer object to avoid "phone already taken" error
      // customer: {
      //   first_name: firstName,
      //   last_name: lastName,
      //   email: customer.email || '',
      //   phone: customer.phone || ''
      // },
      billing_address: customer.city || customer.address ? {
        first_name: firstName,
        last_name: lastName,
        address1: customer.address || customer.city,
        city: customer.city || 'المدينة',
        country: formSettings.country || 'SA', // استخدام البلد من إعدادات النموذج
        phone: customer.phone || ''
      } : undefined,
      shipping_address: customer.city || customer.address ? {
        first_name: firstName,
        last_name: lastName,
        address1: customer.address || customer.city,
        city: customer.city || 'المدينة',
        country: formSettings.country || 'SA', // استخدام البلد من إعدادات النموذج
        phone: customer.phone || ''
      } : undefined,
      line_items: [
        {
          title: 'طلب من النموذج - Form Order',
          quantity: 1,
          price: totalPrice // استخدام السعر المحول
        }
      ],
      note: `طلب من النموذج - Form submission. ID: ${formId}\nالعميل: ${customer.name}\nالهاتف: ${customer.phone}\nالبريد: ${customer.email}\nالمدينة: ${customer.city}\nالعنوان: ${customer.address}`,
      tags: 'form-submission,نموذج'
    }
  };
}

async function createShopifyOrder(shopDomain: string, accessToken: string, customer: any, formId: string, formSettings: any = {}, convertedPrice: { price: number; currency: string } = { price: 0, currency: 'SAR' }): Promise<string | null> {
  console.log('🛒 Starting Shopify order creation process...');
  console.log('📋 Customer data for order:', JSON.stringify(customer, null, 2));
  console.log('⚙️ Form settings:', JSON.stringify(formSettings, null, 2));
  console.log('💰 Converted price data:', JSON.stringify(convertedPrice, null, 2));
  
  const orderData = createShopifyOrderData(customer, formId, formSettings, convertedPrice);
  console.log('🎯 Creating Shopify order:', JSON.stringify(orderData, null, 2));
  
  try {
    const response = await fetch(`https://${shopDomain}/admin/api/2025-04/orders.json`, {
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
      
      // First try to get form by exact ID (UUID format)
      let { data: formData, error: formError } = await supabase
        .from('forms')
        .select('id, country, currency, phone_prefix')
        .eq('id', formId)
        .single();
        
      // If not found by ID, try to find form associated with this product
      if (formError || !formData) {
        console.log('⚠️ Form not found by ID, trying to find form associated with product:', formId);
        
        // Use secure function to get product-form association
        const { data: productAssociation, error: productError } = await supabase
          .rpc('get_product_form_association', {
            p_shop_id: shopDomain,
            p_product_id: formId
          });
          
        let productSettingData = null;
        if (!productError && productAssociation && productAssociation.length > 0) {
          // Get the form data using the returned form_id
          const { data: formData, error: formError } = await supabase
            .from('forms')
            .select('id, country, currency, phone_prefix')
            .eq('id', productAssociation[0].form_id)
            .eq('is_published', true)
            .single();
            
          if (!formError && formData) {
            productSettingData = {
              form_id: productAssociation[0].form_id,
              forms: formData
            };
          }
        }
          
        if (!productError && productSettingData?.forms) {
          formData = productSettingData.forms as any;
          actualFormId = formData.id;
          console.log('✅ Found form associated with product:', actualFormId);
        } else {
          console.log('⚠️ No product-specific form found, trying latest form for shop:', shopDomain);
          
          // Final fallback: get the most recent form for this shop
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
      }
      
      if (formData) {
        formSettings = {
          country: formData.country || 'MA', // استخدام إعدادات النموذج الفعلية
          currency: formData.currency || 'MAD', // استخدام إعدادات النموذج الفعلية  
          phone_prefix: formData.phone_prefix || '+212' // استخدام إعدادات النموذج الفعلية
        };
        console.log('📋 Retrieved form settings:', JSON.stringify(formSettings, null, 2));
      }
    } catch (error) {
      console.error('⚠️ Could not retrieve form settings:', error);
      // استخدام الإعدادات الافتراضية المغربية
      formSettings = {
        country: 'MA',
        currency: 'MAD',
        phone_prefix: '+212'
      };
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
    let orderNumber = `ORD-${Date.now()}`; // Default order number
    
    try {
      console.log('📝 Processing form data:', JSON.stringify(formData, null, 2));
      
      // ✅ Extract converted price from form data (same logic as abandoned-tracking)
      let convertedPrice = extractConvertedPrice(formData);
      console.log('💰 Extracted converted price:', convertedPrice);
      
      // ✅ إضافة آلية الأسعار الافتراضية إذا لم يوجد سعر محول
      if (!convertedPrice.price || convertedPrice.price <= 1) {
        console.log('⚠️ No valid converted price found, using default price based on currency');
        
        // استخدام الأسعار الافتراضية حسب العملة من إعدادات النموذج
        const currency = formSettings.currency || 'SAR';
        let defaultPrice = 250; // افتراضي للسعودية
        
        if (currency === 'MAD') {
          defaultPrice = 400;
        } else if (currency === 'USD') {
          defaultPrice = 150;
        } else if (currency === 'AED') {
          defaultPrice = 200;
        } else if (currency === 'SAR') {
          defaultPrice = 250;
        }
        
        convertedPrice = { price: defaultPrice, currency };
        console.log('🎯 Using default price:', convertedPrice);
      }
      
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

      // Create order in Shopify with form settings and converted price
      const shopifyOrderId = await createShopifyOrder(shopDomain, shopData.access_token, customer, actualFormId, formSettings, convertedPrice);

      // Generate order number
      orderNumber = shopifyOrderId ? `SHOP-${shopifyOrderId}` : `ORD-${Date.now()}`;
      
      console.log('📋 Creating order with data:', {
        orderNumber,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        shopifyOrderId,
        submissionId: submissionData.id,
        currency: formSettings.currency || 'USD'
      });
      
      // Create order in our database with converted price and currency
      const orderInsertData = {
        order_number: orderNumber,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        total_amount: convertedPrice.price, // ✅ استخدام السعر المحول
        currency: convertedPrice.currency || formSettings.currency || 'SAR', // ✅ استخدام العملة المحولة
        status: 'pending',
        items: [{ 
          title: 'طلب من النموذج - Form Order', 
          quantity: 1, 
          price: convertedPrice.price.toFixed(2) // ✅ استخدام السعر المحول
        }],
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

        // Try to sync with Google Sheets if configured
        console.log('🔍 Starting Google Sheets sync check for shop:', orderData.shop_id);
        try {
          const { data: sheetsConfig } = await supabase
            .from('google_sheets_configs')
            .select('*')
            .eq('enabled', true)
            .eq('sync_orders', true)
            .eq('shop_id', orderData.shop_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          console.log('📋 Google Sheets config query result:', sheetsConfig);
          if (sheetsConfig) {
            console.log('✅ Found Google Sheets config, checking for form mapping...');
            // 1) Prefer per-form mapping if exists
            const { data: mapping } = await supabase
              .from('google_sheets_form_mappings')
              .select('*')
              .eq('shop_id', orderData.shop_id)
              .eq('form_id', orderData.form_id)
              .eq('enabled', true)
              .maybeSingle();

            // 2) Build row using optional columns_mapping if present
            const defaultRow = [
              new Date().toISOString(),
              orderData.order_number,
              orderData.customer_name,
              orderData.customer_phone,
              orderData.currency,
              orderData.total_amount?.toString() || '',
              'order',
              orderData.status
            ];

            let valuesToAppend: any[] = defaultRow;
            try {
              const cm = (sheetsConfig as any).columns_mapping as Record<string, string[]> | null;
              if (cm && Array.isArray(cm.order)) {
                // Map known order fields into provided columns order
                const fieldMap: Record<string, any> = {
                  created_at: new Date().toISOString(),
                  order_number: orderData.order_number,
                  customer_name: orderData.customer_name,
                  customer_email: orderData.customer_email,
                  customer_phone: orderData.customer_phone,
                  currency: orderData.currency,
                  total_amount: orderData.total_amount,
                  status: orderData.status,
                  type: 'order'
                };
                valuesToAppend = (cm.order as string[]).map((k) => (fieldMap as any)[k] ?? '');
              }
            } catch {}

            // Use existing columns from the database
            const spreadsheetId = mapping?.spreadsheet_id || (sheetsConfig as any).spreadsheet_id;
            const sheetTitle = mapping?.sheet_title || (sheetsConfig as any).sheet_title || (sheetsConfig as any).sheet_name;

            // If spreadsheet_id is missing, we need to extract it from the Google Sheets URL or use a different approach
            // For now, let's check if we have the required data
            console.log('🔍 Sheets config data:', {
              spreadsheet_id: (sheetsConfig as any).spreadsheet_id,
              sheet_title: (sheetsConfig as any).sheet_title,
              sheet_name: (sheetsConfig as any).sheet_name,
              sheet_id: (sheetsConfig as any).sheet_id,
              webhook_url: sheetsConfig.webhook_url
            });

            if (spreadsheetId && sheetTitle) {
              console.log('📊 Syncing order to Google Sheets:', { spreadsheetId, sheetTitle, values: valuesToAppend });
              const appendResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/google-sheets-append`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  shop_id: orderData.shop_id,
                  spreadsheet_id: spreadsheetId,
                  sheet_title: sheetTitle,
                  values: [valuesToAppend]
                })
              });

              const appendResult = await appendResponse.json();
              if (appendResponse.ok) {
                console.log('✅ Order synced to Google Sheets successfully');
              } else {
                console.error('❌ Failed to sync order to Google Sheets:', appendResult);
              }
            } else if (sheetsConfig.webhook_url) {
              console.log('🔗 Syncing order via webhook:', sheetsConfig.webhook_url);
              await fetch(sheetsConfig.webhook_url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'new_order', order: orderData, timestamp: new Date().toISOString() }),
              });
            } else {
              console.log('⚠️ Google Sheets config found but missing required data:');
              console.log('   - spreadsheet_id:', spreadsheetId || 'MISSING');
              console.log('   - sheet_title:', sheetTitle || 'MISSING');
              console.log('   - webhook_url:', sheetsConfig.webhook_url || 'MISSING');
              console.log('   - Available data: sheet_id=' + (sheetsConfig as any).sheet_id + ', sheet_name=' + (sheetsConfig as any).sheet_name);
              console.log('🔧 Please recreate the Google Sheets integration to fix this issue.');
            }
          } else {
            console.log('ℹ️ No Google Sheets config found for shop:', orderData.shop_id);
          }
        } catch (sheetError) {
          console.error('❌ Google Sheets sync failed:', sheetError);
        }
      }

    } catch (orderCreationError) {
      console.error('❌ Error in order creation process:', orderCreationError);
      // Continue even if order creation fails, using default order number
    }

    // Get order settings to determine redirect behavior
    let orderSettings = null;
    try {
      console.log('🔍 Fetching order settings for shop:', shopDomain);
      const { data: settingsData, error: settingsError } = await supabase
        .from('order_settings')
        .select('*')
        .eq('shop_id', shopDomain)
        .maybeSingle();
      
      if (!settingsError && settingsData) {
        orderSettings = settingsData;
        console.log('✅ Found order settings:', orderSettings);
      } else {
        console.log('⚠️ No order settings found or error:', settingsError);
        // Try localStorage approach used by frontend
        const storageKey = `order_settings_${shopDomain}`;
        console.log('🔍 Checking if localStorage pattern settings exist for key:', storageKey);
      }
    } catch (error) {
      console.log('⚠️ Could not fetch order settings, using defaults:', error);
    }

    // Determine redirect URL based on settings
    let redirectUrl;
    
    console.log('🎯 Order settings for redirect:', {
      post_order_action: orderSettings?.post_order_action,
      redirect_enabled: orderSettings?.redirect_enabled,
      thank_you_page_url: orderSettings?.thank_you_page_url
    });
    
    // Check if redirect is enabled and has a custom URL
    if (orderSettings?.redirect_enabled && orderSettings?.thank_you_page_url && orderSettings.thank_you_page_url.trim() !== '') {
      // Use custom thank you page URL from settings
      redirectUrl = orderSettings.thank_you_page_url.trim();
      // Add order parameter
      const separator = redirectUrl.includes('?') ? '&' : '?';
      redirectUrl += `${separator}order=${orderNumber}&success=true`;
      console.log('✅ Using custom redirect URL from settings:', redirectUrl);
    } else if (orderSettings?.post_order_action === 'redirect' && orderSettings?.redirect_enabled) {
      // Use default Shopify checkout page if no custom URL set
      redirectUrl = `https://${shopDomain}/checkout/thank_you?order=${orderNumber}&success=true`;
      console.log('📄 Using default checkout page (redirect enabled but no custom URL)');
    } else {
      // Default fallback
      redirectUrl = `https://${shopDomain}/?order=${orderNumber}&success=true`;
      console.log('🏠 Using homepage redirect (redirect disabled or other action)');
    }

    console.log('🔄 Redirect URL determined:', redirectUrl);
    const thankYouUrl = redirectUrl;
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'تم إرسال طلبكم بنجاح',
        submissionId: submissionData.id,
        orderNumber: orderNumber || 'unknown',
        thankYouUrl: thankYouUrl,
        redirect: thankYouUrl,
        trackConversion: true // Flag to trigger advertising tracking
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
