
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Utility functions for data processing
function validateAndFormatPhone(phone: string): string {
  if (!phone) return '+966500000000'; // Default Saudi number
  
  // Clean the phone number
  let cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // Remove any non-digit characters except +
  cleanPhone = cleanPhone.replace(/[^\d+]/g, '');
  
  // Handle Saudi numbers
  if (cleanPhone.startsWith('00966')) {
    cleanPhone = '+966' + cleanPhone.substring(5);
  } else if (cleanPhone.startsWith('966')) {
    cleanPhone = '+966' + cleanPhone.substring(3);
  } else if (cleanPhone.startsWith('05') || cleanPhone.startsWith('01')) {
    cleanPhone = '+966' + cleanPhone.substring(1);
  } else if (cleanPhone.startsWith('5') && cleanPhone.length === 9) {
    cleanPhone = '+966' + cleanPhone;
  } else if (!cleanPhone.startsWith('+966') && !cleanPhone.startsWith('+')) {
    // If it's a number without country code, assume Saudi
    if (cleanPhone.length >= 9) {
      cleanPhone = '+966' + cleanPhone;
    } else {
      cleanPhone = '+966500000000'; // Default
    }
  }
  
  // Validate final format
  if (cleanPhone.length < 13 || !cleanPhone.startsWith('+966')) {
    return '+966500000000'; // Default valid Saudi number
  }
  
  return cleanPhone;
}

function extractCustomerData(formData: any): {
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
} {
  console.log('🔍 Extracting customer data from:', JSON.stringify(formData, null, 2));
  
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
  
  // Validate and format phone
  phone = validateAndFormatPhone(phone);
  
  console.log('✅ Extracted customer data:', { name, email, phone, city, address });
  return { name, email, phone, city, address };
}

function createMinimalShopifyOrder(customer: any, formId: string) {
  return {
    order: {
      financial_status: 'pending',
      currency: 'SAR',
      total_price: '0.00',
      line_items: [
        {
          title: 'طلب من النموذج - Form Order',
          quantity: 1,
          price: '0.00'
        }
      ],
      note: `طلب من النموذج - Form submission. ID: ${formId}\nالعميل: ${customer.name}\nالهاتف: ${customer.phone}\nالمدينة: ${customer.city}`,
      tags: 'form-submission,نموذج',
      email: customer.email || undefined,
      phone: customer.phone || undefined
    }
  };
}

function createFullShopifyOrder(customer: any, formId: string) {
  const firstName = customer.name.split(' ')[0] || customer.name;
  const lastName = customer.name.split(' ').slice(1).join(' ') || '';
  
  return {
    order: {
      financial_status: 'pending',
      fulfillment_status: null,
      currency: 'SAR',
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
        city: customer.city || 'الرياض',
        country: 'SA',
        phone: customer.phone || ''
      } : undefined,
      shipping_address: customer.city || customer.address ? {
        first_name: firstName,
        last_name: lastName,
        address1: customer.address || customer.city,
        city: customer.city || 'الرياض',
        country: 'SA',
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

async function createShopifyOrder(shopDomain: string, accessToken: string, customer: any, formId: string): Promise<string | null> {
  console.log('🛒 Starting Shopify order creation process...');
  console.log('📋 Customer data for order:', JSON.stringify(customer, null, 2));
  
  // Try full order first
  const fullOrderData = createFullShopifyOrder(customer, formId);
  console.log('🎯 Creating full Shopify order:', JSON.stringify(fullOrderData, null, 2));
  
  try {
    const response = await fetch(`https://${shopDomain}/admin/api/2025-01/orders.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify(fullOrderData)
    });

    const result = await response.json();
    console.log('📦 Shopify full order response:', JSON.stringify(result, null, 2));
    console.log('🔍 Response status:', response.status);

    if (response.ok && result.order) {
      console.log('✅ Full Shopify order created successfully:', result.order.id);
      return result.order.id;
    } else {
      console.log('⚠️ Full order failed, trying minimal order...');
      console.log('❌ Full order error:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('❌ Error with full order:', error);
  }

  // Try minimal order
  const minimalOrderData = createMinimalShopifyOrder(customer, formId);
  console.log('🔄 Creating minimal Shopify order:', JSON.stringify(minimalOrderData, null, 2));
  
  try {
    const response = await fetch(`https://${shopDomain}/admin/api/2025-01/orders.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify(minimalOrderData)
    });

    const result = await response.json();
    console.log('📦 Shopify minimal order response:', JSON.stringify(result, null, 2));
    
    if (response.ok && result.order) {
      console.log('✅ Minimal Shopify order created successfully:', result.order.id);
      return result.order.id;
    } else {
      console.error('❌ Minimal order also failed:', JSON.stringify(result, null, 2));
      return null;
    }
  } catch (error) {
    console.error('❌ Error with minimal order:', error);
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

    // Get form ID from query param
    const url = new URL(req.url);
    const formId = url.searchParams.get('formId');
    
    if (!formId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: formId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Parse request body
    const requestData = await req.json();
    console.log('📝 Request data received:', JSON.stringify(requestData, null, 2));
    
    const shopDomain = requestData.shopDomain || '';
    console.log('🏪 Shop domain:', shopDomain);
    
    // Store submission in database
    console.log('💾 Storing submission with formId:', formId, 'shopDomain:', shopDomain);
    
    const submissionRecord = {
      form_id: formId,
      shop_id: shopDomain,
      data: requestData
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
      const formData = requestData.data || requestData.formData || requestData;
      console.log('📝 Processing form data:', JSON.stringify(formData, null, 2));
      
      // Extract customer information using enhanced function
      const customer = extractCustomerData(formData);
      
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

      // Create order in Shopify with improved logic
      const shopifyOrderId = await createShopifyOrder(shopDomain, shopData.access_token, customer, formId);

      // Generate order number
      const orderNumber = shopifyOrderId ? `SHOP-${shopifyOrderId}` : `ORD-${Date.now()}`;
      
      console.log('📋 Creating order with data:', {
        orderNumber,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        shopifyOrderId,
        submissionId: submissionData.id
      });
      
      // Create order in our database
      console.log('🆔 Using original formId for order:', formId);
      
      const orderInsertData = {
        order_number: orderNumber,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        total_amount: 0.00,
        currency: 'SAR',
        status: 'pending',
        items: [{ title: 'طلب من النموذج - Form Order', quantity: 1, price: '0.00' }],
        shipping_address: { address: customer.address, city: customer.city },
        billing_address: { address: customer.address, city: customer.city },
        form_id: formId, // Use the original formId from request
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
