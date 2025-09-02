import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    
    console.log('🕐 Running scheduled billing check...');

    // استدعاء دالة فحص الاشتراكات المنتهية
    const expiredResponse = await fetch(`${SUPABASE_URL}/functions/v1/check-expired-subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
    });

    const expiredResult = await expiredResponse.json();
    console.log('📊 Expired subscriptions check result:', expiredResult);

    // استدعاء دالة إصلاح تواريخ الفوترة المفقودة
    const fixDatesResponse = await fetch(`${SUPABASE_URL}/functions/v1/fix-billing-dates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
    });

    const fixDatesResult = await fixDatesResponse.json();
    console.log('🔧 Fix billing dates result:', fixDatesResult);

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      expired_check: expiredResult,
      fix_dates: fixDatesResult,
      message: 'Scheduled billing check completed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('❌ Scheduled billing check error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
