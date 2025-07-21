import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = 'https://trlklwixfeaexhydzaue.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjcxMTQxOCwiZXhwIjoyMDY4Mjg3NDE4fQ.cXZGpHiwobAzYhKPa1yWL1I1jRjEz-3WDFFvTMNRglU';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function cleanShopDomain(shop: string): string {
  if (!shop) return "";
  
  let cleanedShop = shop.trim().toLowerCase();
  
  if (cleanedShop.startsWith('http')) {
    try {
      const url = new URL(cleanedShop);
      cleanedShop = url.hostname;
    } catch (e) {
      console.error("❌ Error cleaning shop URL:", e);
    }
  }
  
  if (!cleanedShop.endsWith('myshopify.com')) {
    if (!cleanedShop.includes('.')) {
      cleanedShop = `${cleanedShop}.myshopify.com`;
    }
  }
  
  return cleanedShop;
}

serve(async (req) => {
  console.log("🚀 Save Detected Shop Function Called");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shop } = await req.json();
    
    if (!shop) {
      console.error("❌ No shop provided");
      return new Response(
        JSON.stringify({ success: false, error: "Missing shop parameter" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const cleanedShop = cleanShopDomain(shop);
    console.log(`🔍 Processing shop: ${shop} -> ${cleanedShop}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // فحص إذا كان المتجر موجود
    const { data: existing, error: checkError } = await supabase
      .from('shopify_stores')
      .select('shop, is_active, access_token')
      .eq('shop', cleanedShop)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking existing shop:', checkError);
      return new Response(
        JSON.stringify({ success: false, error: checkError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    if (existing) {
      console.log('ℹ️ Shop already exists, activating:', cleanedShop);
      
      // تفعيل المتجر الموجود
      const { error: updateError } = await supabase
        .from('shopify_stores')
        .update({ 
          is_active: true, 
          updated_at: new Date().toISOString() 
        })
        .eq('shop', cleanedShop);

      if (updateError) {
        console.error('❌ Error activating existing shop:', updateError);
        return new Response(
          JSON.stringify({ success: false, error: updateError.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      console.log('✅ Existing shop activated successfully');
      return new Response(
        JSON.stringify({ 
          success: true, 
          shop: cleanedShop, 
          action: 'activated',
          message: 'Shop activated successfully' 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    } else {
      console.log('💾 Creating new shop entry:', cleanedShop);
      
      // إضافة المتجر الجديد
      const { data: newShop, error: insertError } = await supabase
        .from('shopify_stores')
        .insert({
          shop: cleanedShop,
          is_active: true,
          access_token: null,
          scope: null,
          token_type: 'Bearer',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error saving new shop:', insertError);
        return new Response(
          JSON.stringify({ success: false, error: insertError.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      console.log('✅ New shop saved successfully:', newShop);
      return new Response(
        JSON.stringify({ 
          success: true, 
          shop: cleanedShop, 
          action: 'created',
          data: newShop,
          message: 'Shop saved successfully' 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});