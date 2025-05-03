
// تعديل مسار الرد على المصادقة لاستخدام المسار الصحيح

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { v4 as uuidv4 } from "https://esm.sh/uuid@9";

// إعدادات Supabase
const SUPABASE_URL = 'https://nhqrngdzuatdnfkihtud.supabase.co';
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ocXJuZ2R6dWF0ZG5ma2lodHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MDM2MTgsImV4cCI6MjA2MTE3OTYxOH0.bebH8nV_6W0DpwjmS_vYFB2P9xVU-txCRvQc6Jt5DdA';

// إعدادات تطبيق Shopify
const SHOPIFY_API_KEY = Deno.env.get("SHOPIFY_API_KEY") || "7e4608874bbcc38afa1953948da28407";

// صلاحيات التطبيق
const scopes = "write_products,read_products,read_orders,write_orders,write_script_tags,read_themes,write_themes,read_content,write_content";

// عنوان URL للتطبيق المستضاف
const APP_URL = "https://codform-flow-forms.lovable.app";

// عنوان URL لرد المصادقة - تحديث المسار هنا
const CALLBACK_URL = `${APP_URL}/shopify-callback`;

// إعداد عناوين CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

// دالة لتنظيف نطاق المتجر
function cleanShopDomain(shop: string): string {
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

serve(async (req) => {
  // سجل الطلب كاملاً للتصحيح
  console.log("Request received:", {
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
    
    // حفظ حالة المصادقة في قاعدة البيانات
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      
      const { error } = await supabase
        .from('shopify_auth')
        .insert({
          shop,
          state
          // لقد حذفنا field force_update لأنه غير موجود في الجدول
        });
      
      if (error) {
        console.error("Error saving auth state:", error);
      } else {
        console.log("Auth state saved successfully");
      }
    } catch (e) {
      console.error("Database error:", e);
      // استمر على الرغم من الخطأ
    }
    
    // إنشاء عنوان URL للمصادقة
    console.log("Using callback URL:", CALLBACK_URL);
    
    const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${scopes}&redirect_uri=${encodeURIComponent(CALLBACK_URL)}&state=${state}`;
    
    console.log("Generated auth URL:", authUrl);
    
    return new Response(
      JSON.stringify({ 
        redirect: authUrl,
        shop,
        state,
        success: true,
        callbackUrl: CALLBACK_URL,
        forceUpdate: forceUpdate // إضافة flag للاستخدام في واجهة المستخدم
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
