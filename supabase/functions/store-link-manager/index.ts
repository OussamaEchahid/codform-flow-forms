import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StoreRequest {
  action: 'link_store' | 'get_stores' | 'validate_access';
  shop?: string;
  userId?: string;
  email?: string;
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
    );

    const body: StoreRequest = await req.json();
    const { action, shop, userId, email } = body;

    console.log('🏪 Store Link Manager Request:', { action, shop, userId, email });

    switch (action) {
      case 'link_store': {
        if (!shop || !userId) {
          return new Response(
            JSON.stringify({ success: false, error: 'Missing shop or userId' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // ربط المتجر بالمستخدم
        const { data, error } = await supabase
          .from('shopify_stores')
          .upsert({
            shop,
            user_id: userId,
            email,
            is_active: true,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'shop'
          });

        if (error) {
          console.error('❌ Error linking store:', error);
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('✅ Store linked successfully:', shop);
        return new Response(
          JSON.stringify({ success: true, data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_stores': {
        if (!userId) {
          return new Response(
            JSON.stringify({ success: false, error: 'Missing userId' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data, error } = await supabase
          .from('shopify_stores')
          .select('shop, is_active, updated_at, access_token')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('updated_at', { ascending: false });

        if (error) {
          console.error('❌ Error fetching stores:', error);
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, stores: data || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'validate_access': {
        if (!shop || !userId) {
          return new Response(
            JSON.stringify({ success: false, error: 'Missing shop or userId' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data, error } = await supabase
          .from('shopify_stores')
          .select('access_token')
          .eq('shop', shop)
          .eq('user_id', userId)
          .eq('is_active', true)
          .single();

        if (error || !data?.access_token) {
          return new Response(
            JSON.stringify({ success: false, hasAccess: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, hasAccess: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('❌ Store Link Manager Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});