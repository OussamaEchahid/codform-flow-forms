
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      
      // Extract customer information from various field formats
      let customerName = 'غير محدد';
      let customerEmail = '';
      let customerPhone = '';
      let customerCity = '';
      let customerAddress = '';
      
      // Loop through form data to find customer info
      for (const [key, value] of Object.entries(formData)) {
        const keyLower = key.toLowerCase();
        const stringValue = String(value || '').trim();
        
        if (keyLower.includes('text') || keyLower.includes('name') || keyLower.includes('اسم')) {
          customerName = stringValue || customerName;
        } else if (keyLower.includes('email') || keyLower.includes('بريد')) {
          customerEmail = stringValue || customerEmail;
        } else if (keyLower.includes('phone') || keyLower.includes('هاتف') || keyLower.includes('تليفون')) {
          customerPhone = stringValue || customerPhone;
        } else if (keyLower.includes('city') || keyLower.includes('مدينة')) {
          customerCity = stringValue || customerCity;
        } else if (keyLower.includes('address') || keyLower.includes('عنوان') || keyLower.includes('textarea')) {
          customerAddress = stringValue || customerAddress;
        }
      }
      
      // Ensure phone number is valid for Shopify (remove if empty)
      if (!customerPhone || customerPhone.length < 6) {
        customerPhone = '+966500000000'; // Default valid phone for Saudi Arabia
      }
      
      console.log('👤 Customer data:', { customerName, customerEmail, customerPhone, customerCity, customerAddress });
      
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

      // Create order in Shopify
      const shopifyOrderData = {
        order: {
          financial_status: 'pending',
          fulfillment_status: null,
          currency: 'SAR',
          total_price: '100.00', // Default price, can be customized
          customer: {
            first_name: customerName.split(' ')[0] || customerName,
            last_name: customerName.split(' ').slice(1).join(' ') || '',
            email: customerEmail,
            phone: customerPhone
          },
          billing_address: {
            first_name: customerName.split(' ')[0] || customerName,
            last_name: customerName.split(' ').slice(1).join(' ') || '',
            address1: customerAddress,
            city: customerCity,
            country: 'SA',
            phone: customerPhone
          },
          shipping_address: {
            first_name: customerName.split(' ')[0] || customerName,
            last_name: customerName.split(' ').slice(1).join(' ') || '',
            address1: customerAddress,
            city: customerCity,
            country: 'SA',
            phone: customerPhone
          },
          line_items: [
            {
              title: 'Form Order',
              quantity: 1,
              price: '100.00'
            }
          ],
          note: `Order created from form submission. Form ID: ${formId}`,
          tags: 'form-submission'
        }
      };

      console.log('🛒 Creating Shopify order:', JSON.stringify(shopifyOrderData, null, 2));

      // Send order to Shopify
      const shopifyResponse = await fetch(`https://${shopDomain}/admin/api/2025-01/orders.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': shopData.access_token
        },
        body: JSON.stringify(shopifyOrderData)
      });

      const shopifyResult = await shopifyResponse.json();
      console.log('📦 Shopify order response:', JSON.stringify(shopifyResult, null, 2));

      let shopifyOrderId = null;
      if (shopifyResponse.ok && shopifyResult.order) {
        shopifyOrderId = shopifyResult.order.id;
        console.log('✅ Shopify order created successfully:', shopifyOrderId);
      } else {
        console.error('❌ Failed to create Shopify order:', shopifyResult);
      }

      // Generate order number
      const orderNumber = shopifyOrderId ? `SHOP-${shopifyOrderId}` : `ORD-${Date.now()}`;
      
      // Create order in our database
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          total_amount: 100.00,
          currency: 'SAR',
          status: 'pending',
          items: [{ title: 'Form Order', quantity: 1, price: '100.00' }],
          shipping_address: { address: customerAddress, city: customerCity },
          billing_address: { address: customerAddress, city: customerCity },
          form_id: submissionData.id, // Use the submission ID instead of formId
          shop_id: shopDomain,
          shopify_order_id: shopifyOrderId?.toString()
        })
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order in database:', orderError);
      } else {
        console.log('✅ Order created in database:', orderData.order_number);
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
