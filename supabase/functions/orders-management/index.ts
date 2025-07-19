import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (req.method === 'POST' && action === 'create-order') {
      const orderData = await req.json();
      
      // Generate order number
      const orderNumber = `ORD-${Date.now()}`;
      
      const { data, error } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: orderData.customer_name,
          customer_email: orderData.customer_email,
          customer_phone: orderData.customer_phone,
          total_amount: orderData.total_amount,
          currency: orderData.currency || 'SAR',
          status: 'pending',
          items: orderData.items || [],
          shipping_address: orderData.shipping_address || {},
          billing_address: orderData.billing_address || {},
          form_id: orderData.form_id,
          shop_id: orderData.shop_id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating order:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to create order' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Try to sync with Google Sheets if configured
      try {
        const { data: sheetsConfig } = await supabase
          .from('google_sheets_configs')
          .select('*')
          .eq('enabled', true)
          .eq('sync_orders', true)
          .single();

        if (sheetsConfig && sheetsConfig.webhook_url) {
          await fetch(sheetsConfig.webhook_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'new_order',
              order: data,
              timestamp: new Date().toISOString()
            }),
          });
        }
      } catch (sheetError) {
        console.log('Google Sheets sync failed:', sheetError);
      }

      return new Response(
        JSON.stringify({ success: true, order: data }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (req.method === 'GET' && action === 'list-orders') {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch orders' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      return new Response(
        JSON.stringify({ orders: data }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (req.method === 'PUT' && action === 'update-order-status') {
      const { order_id, status } = await req.json();
      
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', order_id)
        .select()
        .single();

      if (error) {
        console.error('Error updating order:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update order' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, order: data }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});