
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
    const shopDomain = requestData.shopDomain || '';
    
    // Store submission in database
    const { data: submissionData, error: submissionError } = await supabase
      .from('form_submissions')
      .insert({
        form_id: formId,
        shop_id: shopDomain,
        data: requestData,
        status: 'submitted'
      })
      .select()
      .single();

    if (submissionError) {
      console.error('Error storing submission:', submissionError);
      return new Response(
        JSON.stringify({ error: 'Failed to store submission', details: submissionError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Create order from form submission
    try {
      const formData = requestData.formData || requestData;
      
      // Extract customer information
      const customerName = formData.name || formData.customerName || formData['الاسم'] || 'غير محدد';
      const customerEmail = formData.email || formData.customerEmail || formData['البريد الإلكتروني'] || '';
      const customerPhone = formData.phone || formData.customerPhone || formData['رقم الهاتف'] || '';
      
      // Calculate total (can be enhanced based on form data)
      const totalAmount = formData.total || formData.amount || 0;
      
      // Generate order number
      const orderNumber = `ORD-${Date.now()}`;
      
      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          total_amount: totalAmount,
          currency: 'SAR',
          status: 'pending',
          items: formData.items || [],
          shipping_address: formData.shippingAddress || {},
          billing_address: formData.billingAddress || {},
          form_id: formId,
          shop_id: shopDomain
        })
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        // Continue even if order creation fails, as submission was successful
      } else {
        console.log('Order created successfully:', orderData.order_number);
      }

    } catch (orderCreationError) {
      console.error('Error in order creation process:', orderCreationError);
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
