import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { 
      auth: { persistSession: false } 
    });

    console.log('🔧 Fixing missing billing dates...');

    // البحث عن الاشتراكات المدفوعة بدون next_billing_date
    const { data: subscriptions, error } = await supabase
      .from('shop_subscriptions')
      .select('*')
      .neq('plan_type', 'free')
      .eq('status', 'active')
      .is('next_billing_date', null);

    if (error) {
      console.error('❌ Error fetching subscriptions:', error);
      throw error;
    }

    console.log(`📊 Found ${subscriptions?.length || 0} subscriptions without billing dates`);

    const results = [];

    for (const sub of subscriptions || []) {
      try {
        // تعيين تاريخ التجديد التالي (شهر من الآن)
        const nextBillingDate = new Date();
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

        await supabase
          .from('shop_subscriptions')
          .update({
            next_billing_date: nextBillingDate.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', sub.id);

        results.push({
          shop: sub.shop_domain,
          plan: sub.plan_type,
          next_billing_date: nextBillingDate.toISOString(),
          action: 'billing_date_set'
        });

        console.log(`✅ Set billing date for ${sub.shop_domain}: ${nextBillingDate.toISOString()}`);

      } catch (error) {
        console.error(`❌ Error processing ${sub.shop_domain}:`, error);
        results.push({
          shop: sub.shop_domain,
          action: 'error',
          error: error.message
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('❌ Function error:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
