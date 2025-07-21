import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { action, shop } = await req.json();

    console.log('Clean Shopify Stores request:', { action, shop });

    if (action === 'clean_all_except') {
      // حذف جميع المتاجر ما عدا المحدد
      const { error } = await supabase
        .from('shopify_stores')
        .delete()
        .neq('shop', shop);

      if (error) {
        console.error('Error cleaning stores:', error);
        return new Response(
          JSON.stringify({ error: error.message, success: false }),
          { status: 500, headers: corsHeaders }
        );
      }

      console.log(`✅ Cleaned all stores except: ${shop}`);
    } else if (action === 'clean_all') {
      // حذف جميع المتاجر
      const { error } = await supabase
        .from('shopify_stores')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // حذف الكل

      if (error) {
        console.error('Error cleaning all stores:', error);
        return new Response(
          JSON.stringify({ error: error.message, success: false }),
          { status: 500, headers: corsHeaders }
        );
      }

      console.log('✅ Cleaned all stores');
    } else if (action === 'reset_active' && shop) {
      // إعادة تعيين المتجر النشط
      
      // جعل جميع المتاجر غير نشطة
      await supabase
        .from('shopify_stores')
        .update({ is_active: false })
        .neq('shop', shop);

      // جعل المتجر المحدد نشط
      const { error } = await supabase
        .from('shopify_stores')
        .update({ is_active: true })
        .eq('shop', shop);

      if (error) {
        console.error('Error resetting active store:', error);
        return new Response(
          JSON.stringify({ error: error.message, success: false }),
          { status: 500, headers: corsHeaders }
        );
      }

      console.log(`✅ Set ${shop} as active store`);
    }

    return new Response(
      JSON.stringify({ success: true, action, shop }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { status: 500, headers: corsHeaders }
    );
  }
});