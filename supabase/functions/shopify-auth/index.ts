
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { v4 as uuidv4 } from "https://esm.sh/uuid@9";

// إعدادات Supabase - تحديث لاستخدام المفاتيح الصحيحة
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || 'https://trlklwixfeaexhydzaue.supabase.co';
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M';

console.log("Initializing Shopify Auth Edge Function with Supabase:", SUPABASE_URL);

// إعدادات تطبيق Shopify - التأكد من وجود المفتاح
const SHOPIFY_API_KEY = Deno.env.get("SHOPIFY_API_KEY") || "7e4608874bbcc38afa1953948da28407";

// صلاحيات التطبيق
const scopes = "write_products,read_products,read_orders,write_orders,write_script_tags,read_themes,write_themes,read_content,write_content";

// عنوان URL للتطبيق المستضاف
const APP_URL = "https://codform-flow-forms.lovable.app";

// عنوان URL لرد المصادقة
const CALLBACK_URL = `${APP_URL}/shopify-callback`;

// إعداد عناوين CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
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
  
  // نمط النطاق الأساسي لـ Shopify
  const shopifyDomainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
  
  return shopifyDomainPattern.test(shop);
}

// طريقة بديلة لحفظ حالة المصادقة إذا فشل الاتصال بقاعدة البيانات
function generateSecureStateWithoutDB(): { state: string, timestamp: number } {
  const state = uuidv4();
  const timestamp = Date.now();
  
  return { state, timestamp };
}

serve(async (req) => {
  // سجل الطلب كاملاً للتصحيح
  console.log("Auth Request received:", {
    url: req.url,
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
  });

  // التعامل مع طلبات CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    // استخراج المعلمات من URL أو body
    let shop = "";
    let forceUpdate = false;
    
    const url = new URL(req.url);
    const shopParam = url.searchParams.get("shop");
    
    if (shopParam) {
      // إذا كانت المعلمة في URL
      shop = cleanShopDomain(shopParam);
      forceUpdate = url.searchParams.get("force_update") === "true";
    } else if (req.method === "POST") {
      // إذا كانت المعلمة في body
      try {
        const body = await req.json();
        console.log("Request body:", body);
        
        shop = cleanShopDomain(body.shop || "");
        forceUpdate = body.forceUpdate === true;
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
    
    console.log("Cleaned shop domain:", shop);
    
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
    
    // محاولة حفظ حالة المصادقة في قاعدة البيانات
    let dbSaveSuccess = false;
    
    try {
      console.log(`Attempting to save auth state for shop: ${shop} with Supabase key available: ${!!SUPABASE_KEY}`);
      if (SUPABASE_KEY) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        
        const { error } = await supabase
          .from('shopify_auth')
          .insert({
            shop,
            state
          });
        
        if (error) {
          console.error("Error saving auth state:", error);
          // سنتابع العملية مع طريقة بديلة
        } else {
          console.log("Auth state saved successfully");
          dbSaveSuccess = true;
        }
      } else {
        console.warn("SUPABASE_KEY not available, using alternative method");
      }
    } catch (e) {
      console.error("Database error:", e);
      // استمر على الرغم من الخطأ مع طريقة بديلة
    }
    
    // إذا فشل حفظ الحالة في قاعدة البيانات، نستخدم طريقة بديلة
    const fallbackState = !dbSaveSuccess ? generateSecureStateWithoutDB() : null;
    
    // إنشاء عنوان URL للمصادقة
    console.log("Using callback URL:", CALLBACK_URL);
    
    const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${scopes}&redirect_uri=${encodeURIComponent(CALLBACK_URL)}&state=${fallbackState ? fallbackState.state : state}`;
    
    console.log("Generated auth URL:", authUrl);
    
    return new Response(
      JSON.stringify({ 
        redirect: authUrl,
        shop,
        state: fallbackState ? fallbackState.state : state,
        success: true,
        callbackUrl: CALLBACK_URL,
        forceUpdate, // إضافة flag للاستخدام في واجهة المستخدم
        dbState: dbSaveSuccess ? "saved" : "fallback" // لأغراض التشخيص
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
