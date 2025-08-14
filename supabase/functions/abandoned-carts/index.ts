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

    if (req.method === 'POST' && action === 'create-abandoned-cart') {
      const cartData = await req.json();
      console.log('📝 Received cart data:', cartData);
      
      const { data, error } = await supabase
        .from('abandoned_carts')
        .insert({
          customer_email: cartData.customer_email,
          customer_phone: cartData.customer_phone,
          customer_name: cartData.customer_name,
          cart_items: cartData.cart_items || [],
          total_value: cartData.total_value,
          currency: cartData.currency || 'SAR',
          form_id: cartData.form_id,
          shop_id: cartData.shop_id,
          form_data: cartData.form_data || {},
          last_activity: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating abandoned cart:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to create abandoned cart' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, cart: data }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if ((req.method === 'GET' || req.method === 'POST') && action === 'list-abandoned-carts') {
      // Handle both URL params and body data
      let shopId;
      try {
        if (req.method === 'GET') {
          shopId = url.searchParams.get('shop_id');
        } else {
          const body = await req.json();
          shopId = body.shop_id;
        }
        console.log('Fetching abandoned carts for shop:', shopId);
      } catch (error) {
        console.error('Error parsing request:', error);
        return new Response(
          JSON.stringify({ error: 'Invalid request format' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      let query = supabase
        .from('abandoned_carts')
        .select('*')
        .order('last_activity', { ascending: false });

      // Filter by shop_id if provided
      if (shopId) {
        query = query.eq('shop_id', shopId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching abandoned carts:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch abandoned carts' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      return new Response(
        JSON.stringify({ carts: data }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (req.method === 'PUT' && action === 'update-recovery-attempt') {
      const { cart_id } = await req.json();
      
      const { data, error } = await supabase
        .from('abandoned_carts')
        .update({ 
          last_activity: new Date().toISOString()
        })
        .eq('id', cart_id)
        .select()
        .single();

      if (error) {
        console.error('Error updating recovery attempt:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update recovery attempt' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, cart: data }),
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