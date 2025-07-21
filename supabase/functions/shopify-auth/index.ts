
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { v4 as uuidv4 } from "https://esm.sh/uuid@9";

// إعدادات Supabase
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || 'https://trlklwixfeaexhydzaue.supabase.co';
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M';

console.log("🚀 Shopify Auth Edge Function initialized");

// إعدادات تطبيق Shopify
const SHOPIFY_API_KEY = "753bee28b4a0b12f2d87c79b56c86641";

// صلاحيات التطبيق
const scopes = "write_products,read_products,read_orders,write_orders,write_script_tags,read_themes,write_themes,read_content,write_content";

// عنوان URL لرد المصادقة - يشير مباشرة إلى Edge Function
const CALLBACK_URL = `https://trlklwixfeaexhydzaue.supabase.co/functions/v1/shopify-auth-callback`;

// إعداد عناوين CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
};

// دالة لتنظيف نطاق المتجر
function cleanShopDomain(shop: string): string {
  if (!shop) return "";
  
  let cleanedShop = shop.trim();
  
  // إزالة البروتوكول إذا كان موجودًا
  if (cleanedShop.startsWith('http')) {
    try {
      const url = new URL(cleanedShop);
      cleanedShop = url.hostname;
    } catch (e) {
      console.error("Error cleaning shop URL:", e);
    }
  }
  
  // التأكد من أنه ينتهي بـ myshopify.com
  if (!cleanedShop.endsWith('myshopify.com')) {
    if (!cleanedShop.includes('.')) {
      cleanedShop = `${cleanedShop}.myshopify.com`;
    }
  }
  
  return cleanedShop;
}

// التحقق من صحة عنوان URL للمتجر
function isValidShopifyDomain(shop: string): boolean {
  if (!shop) return false;
  const shopifyDomainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
  return shopifyDomainPattern.test(shop);
}

serve(async (req) => {
  console.log("🔗 Auth Request received:", {
    url: req.url,
    method: req.method,
  });

  // التعامل مع طلبات CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    // استخراج المعلمات من URL أو body
    let shop = "";
    
    const url = new URL(req.url);
    const shopParam = url.searchParams.get("shop");
    
    if (shopParam) {
      shop = cleanShopDomain(shopParam);
    } else if (req.method === "POST") {
      try {
        const body = await req.json();
        console.log("Request body:", body);
        shop = cleanShopDomain(body.shop || "");
      } catch (e) {
        console.error("Error parsing request body:", e);
        return new Response(
          JSON.stringify({ 
            error: "Invalid request format", 
            success: false 
          }),
          { status: 400, headers: corsHeaders }
        );
      }
    }
    
    if (!shop) {
      return new Response(
        JSON.stringify({ 
          error: "Shop parameter is required", 
          success: false 
        }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    console.log("🏪 Processing shop:", shop);
    
    // التحقق من صحة نطاق المتجر
    if (!isValidShopifyDomain(shop)) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid Shopify domain", 
          invalidDomain: shop,
          success: false
        }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    // إنشاء حالة مصادقة فريدة
    const state = uuidv4();
    
    // إنشاء عنوان URL للمصادقة
    const authUrl = `https://${shop}/admin/oauth/authorize?` +
      `client_id=${SHOPIFY_API_KEY}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `redirect_uri=${encodeURIComponent(CALLBACK_URL)}&` +
      `state=${state}`;
    
    console.log("🔗 Generated auth URL:", authUrl);
    console.log("📞 Callback URL:", CALLBACK_URL);
    
    return new Response(
      JSON.stringify({ 
        redirect: authUrl,
        shop,
        state,
        success: true,
        callbackUrl: CALLBACK_URL
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
