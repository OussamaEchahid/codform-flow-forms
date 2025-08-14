import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0'
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    console.log('🔄 Starting to fix orders prices...');

    // Get all orders with 0 total amount
    const { data: orders, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('total_amount', 0);

    if (fetchError) {
      console.error('Error fetching orders:', fetchError);
      throw fetchError;
    }

    console.log(`📋 Found ${orders?.length || 0} orders with zero amount`);

    let updated = 0;
    for (const order of orders || []) {
      // Determine price based on currency and shop
      let newPrice = 0;
      
      if (order.currency === 'SAR') {
        newPrice = 250.00; // Default SAR price
      } else if (order.currency === 'USD') {
        newPrice = 150.00; // Default USD price  
      } else if (order.currency === 'MAD') {
        newPrice = 400.00; // Default MAD price
      } else {
        newPrice = 100.00; // Default for other currencies
      }

      // Update the order
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          total_amount: newPrice,
          items: [{
            title: 'طلب من النموذج - Form Order',
            quantity: 1,
            price: newPrice.toFixed(2)
          }]
        })
        .eq('id', order.id);

      if (updateError) {
        console.error(`Error updating order ${order.order_number}:`, updateError);
      } else {
        console.log(`✅ Updated order ${order.order_number} to ${newPrice} ${order.currency}`);
        updated++;
      }
    }

    console.log(`🎉 Successfully updated ${updated} orders`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Updated ${updated} orders`,
        updatedCount: updated 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});