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
          .eq('shop_id', data.shop_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (sheetsConfig) {
          // 1) Prefer per-form mapping if exists
          const { data: mapping } = await supabase
            .from('google_sheets_form_mappings')
            .select('*')
            .eq('shop_id', data.shop_id)
            .eq('form_id', data.form_id)
            .eq('enabled', true)
            .maybeSingle();

          // 2) Build row using optional columns_mapping if present
          const defaultRow = [
            new Date().toISOString(),
            data.order_number,
            data.customer_name,
            data.customer_phone,
            data.currency,
            data.total_amount?.toString() || '',
            'order',
            data.status
          ];

          let valuesToAppend: any[] = defaultRow;
          try {
            const cm = (sheetsConfig as any).columns_mapping as Record<string, string[]> | null;
            if (cm && Array.isArray(cm.order)) {
              // Map known order fields into provided columns order
              const fieldMap: Record<string, any> = {
                created_at: new Date().toISOString(),
                order_number: data.order_number,
                customer_name: data.customer_name,
                customer_email: data.customer_email,
                customer_phone: data.customer_phone,
                currency: data.currency,
                total_amount: data.total_amount,
                status: data.status,
                type: 'order'
              };
              valuesToAppend = (cm.order as string[]).map((k) => (fieldMap as any)[k] ?? '');
            }
          } catch {}

          const spreadsheetId = mapping?.spreadsheet_id || (sheetsConfig as any).spreadsheet_id;
          const sheetTitle = mapping?.sheet_title || (sheetsConfig as any).sheet_title || (sheetsConfig as any).sheet_name;

          if (spreadsheetId && sheetTitle) {
            await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/google-sheets-append`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                shop_id: data.shop_id,
                spreadsheet_id: spreadsheetId,
                sheet_title: sheetTitle,
                values: [valuesToAppend]
              })
            });
          } else if (sheetsConfig.webhook_url) {
            await fetch(sheetsConfig.webhook_url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'new_order', order: data, timestamp: new Date().toISOString() }),
            });
          }
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
      const shopId = url.searchParams.get('shop_id');
      
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter by shop_id if provided
      if (shopId) {
        query = query.eq('shop_id', shopId);
      }

      const { data, error } = await query;

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