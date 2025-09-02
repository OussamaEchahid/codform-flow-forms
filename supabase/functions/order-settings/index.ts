import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Add logging
console.log('🚀 Order Settings Function Started');

interface OrderSettings {
  id?: string;
  shop_id: string;
  user_id?: string;
  post_order_action: 'redirect' | 'popup' | 'stay';
  redirect_enabled: boolean;
  thank_you_page_url?: string;
  popup_title?: string;
  popup_message?: string;
  created_at?: string;
  updated_at?: string;
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

    const { method } = req;
    
    let shopId: string;
    let requestMethod = method;
    let requestData: any = null;
    
    if (method === 'GET') {
      const url = new URL(req.url);
      shopId = url.searchParams.get('shop_id') || '';
    } else {
      requestData = await req.json();
      shopId = requestData.shop_id || '';
      requestMethod = requestData.method || method;
    }

    console.log('📋 Order Settings Request:', { method, requestMethod, shopId, hasRequestData: !!requestData });

    if (!shopId) {
      return new Response(
        JSON.stringify({ error: 'shop_id parameter is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (requestMethod === 'GET') {
      // Get order settings for shop
      const { data, error } = await supabase
        .from('order_settings')
        .select('*')
        .eq('shop_id', shopId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching order settings:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch order settings' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      console.log('📋 Retrieved order settings for shop:', shopId, data);

      // If no settings found, return defaults
      const settings = data || {
        shop_id: shopId,
        post_order_action: 'redirect',
        redirect_enabled: true,
        thank_you_page_url: '',
        popup_title: 'Order Created Successfully!',
        popup_message: 'Thank you for your order! We\'ll contact you soon to confirm the details. Please keep your phone nearby.'
      };

      console.log('📋 Returning settings:', settings);

      return new Response(
        JSON.stringify({ success: true, data: settings }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    if (requestMethod === 'POST' || requestMethod === 'PUT') {
      // Save or update order settings
      const settings: Partial<OrderSettings> = requestData?.settings;

      if (!settings) {
        return new Response(
          JSON.stringify({ error: 'settings data is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Prepare settings for upsert
      const settingsToSave = {
        ...settings,
        shop_id: shopId,
        updated_at: new Date().toISOString()
      };

      // Remove undefined values
      Object.keys(settingsToSave).forEach(key => {
        if (settingsToSave[key as keyof OrderSettings] === undefined) {
          delete settingsToSave[key as keyof OrderSettings];
        }
      });

      const { data, error } = await supabase
        .from('order_settings')
        .upsert(settingsToSave, {
          onConflict: 'shop_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving order settings:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to save order settings', details: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );

  } catch (error) {
    console.error('Error in order-settings function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});