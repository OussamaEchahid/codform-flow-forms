import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { buildCorsHeaders } from "../_shared/cors.ts";

interface SuccessParams {
  shop: string;
  plan: string;
  charge_id?: string;
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const shop = url.searchParams.get('shop');
    const plan = url.searchParams.get('plan');
    const chargeId = url.searchParams.get('charge_id');

    if (!shop || !plan) {
      return new Response(JSON.stringify({ error: 'Missing shop or plan parameter' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

    console.log(`✅ Confirming subscription for shop: ${shop}, plan: ${plan}, charge: ${chargeId}`);

    // تأكيد الاشتراك وتحديث الحالة إلى نشط
    const { data, error } = await supabase.rpc('upgrade_shop_plan', {
      p_shop_domain: shop,
      p_new_plan: plan as any,
      p_shopify_charge_id: chargeId || null
    });

    if (error) {
      console.error('❌ Error confirming subscription:', error);
      throw error;
    }

    console.log('✅ Subscription confirmed successfully:', data);

    // إعادة توجيه مباشرة إلى صفحة الخطط
    return new Response(null, {
      headers: { 
        ...corsHeaders, 
        'Location': 'https://codmagnet.com/plans?success=true&plan=' + plan 
      },
      status: 302,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('subscription-success error:', message);
    
    // إعادة توجيه إلى الخطط مع رسالة خطأ
    return new Response(null, {
      headers: { 
        ...corsHeaders, 
        'Location': 'https://codmagnet.com/plans?error=true' 
      },
      status: 302,
    });
  }
});