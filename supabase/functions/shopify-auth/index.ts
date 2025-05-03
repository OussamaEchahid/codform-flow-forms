
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// إعداد عناوين CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

// إعدادات Supabase
const SUPABASE_URL = 'https://nhqrngdzuatdnfkihtud.supabase.co';
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ocXJuZ2R6dWF0ZG5ma2lodHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MDM2MTgsImV4cCI6MjA2MTE3OTYxOH0.bebH8nV_6W0DpwjmS_vYFB2P9xVU-txCRvQc6Jt5DdA';

// إعدادات تطبيق Shopify
const SHOPIFY_API_KEY = Deno.env.get("SHOPIFY_API_KEY") || "7e4608874bbcc38afa1953948da28407";
const SHOPIFY_API_SECRET = Deno.env.get("SHOPIFY_API_SECRET") || "18221d830a86da52082e0d06c0d32ba3";

// عنوان URL لتطبيقنا
const APP_URL = "https://codform-flow-forms.lovable.app";

// تعريف جميع مسارات إعادة التوجيه الصالحة
const AUTH_CALLBACK_PATHS = [
  "/shopify-callback",
  "/auth/callback",
  "/api/shopify-callback",
  "/auth/offline"
];

// دالة لتنظيف نطاق المتجر
function cleanShopDomain(shop: string): string {
  let cleanedShop = shop.trim();
  
  // إزالة البروتوكول إذا كان موجوداً
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

// دالة لإنشاء معرف فريد للأمان
function generateNonce(): string {
  return crypto.randomUUID();
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
    const url = new URL(req.url);
    const timestamp = Date.now();

    // التعامل مع طلب POST (إذا كان الطلب من واجهة المستخدم)
    if (req.method === "POST") {
      try {
        const body = await req.json();
        console.log("Request body:", body);
        let shop = body.shop;

        if (!shop) {
          return new Response(
            JSON.stringify({ 
              error: "Missing shop parameter",
              timestamp,
              success: false
            }), 
            { status: 400, headers: corsHeaders }
          );
        }
        
        // تنظيف نطاق المتجر
        const cleanedShop = cleanShopDomain(shop);
        console.log("Cleaned shop domain:", cleanedShop);

        // التحقق من صحة نطاق المتجر
        if (!isValidShopifyDomain(cleanedShop)) {
          return new Response(
            JSON.stringify({ 
              error: "Invalid Shopify domain",
              invalidDomain: cleanedShop,
              timestamp,
              success: false
            }), 
            { status: 400, headers: corsHeaders }
          );
        }

        // إنشاء معرف فريد لهذه الجلسة
        const state = generateNonce();
        
        try {
          // تخزين حالة المصادقة المؤقتة
          const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
          
          const { error: insertError } = await supabase.from('shopify_auth').insert({
            shop: cleanedShop,
            state,
            created_at: new Date().toISOString(),
          });
          
          if (insertError) {
            console.error("Error saving auth state:", insertError);
            throw new Error("Failed to save authentication state");
          } else {
            console.log("Auth state saved successfully");
          }
          
          // إنشاء عناوين URL للمصادقة
          const scopes = "write_products,read_products,read_orders,write_orders,write_script_tags,read_themes,write_themes,read_content,write_content";
          
          // استخدام المسار الأول لإعادة التوجيه بعد المصادقة
          const authCallbackUrl = `${APP_URL}${AUTH_CALLBACK_PATHS[0]}`; 
          const authUrl = `https://${cleanedShop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${scopes}&redirect_uri=${encodeURIComponent(authCallbackUrl)}&state=${state}`;
          
          console.log("Generated auth URL:", authUrl);
          console.log("Using callback URL:", authCallbackUrl);
          
          return new Response(JSON.stringify({
            success: true,
            redirect: authUrl,
            shop: cleanedShop,
            state,
            appUrl: APP_URL,
            callbackUrl: authCallbackUrl,
            timestamp
          }), { status: 200, headers: corsHeaders });
        } catch (error) {
          console.error("Error initiating authentication:", error);
          return new Response(
            JSON.stringify({ 
              error: "Error initiating authentication",
              details: error instanceof Error ? error.message : "Unknown error",
              shop: cleanedShop,
              success: false,
              timestamp
            }),
            { status: 500, headers: corsHeaders }
          );
        }
      } catch (jsonError) {
        console.error("Error parsing request body:", jsonError);
        return new Response(
          JSON.stringify({ 
            error: "Invalid JSON in request body",
            success: false,
            timestamp: Date.now()
          }),
          { status: 400, headers: corsHeaders }
        );
      }
    } else {
      // التعامل مع طلبات GET
      let shop = url.searchParams.get("shop");
      
      console.log("GET Request params:", Object.fromEntries(url.searchParams.entries()));
      
      // لا يوجد متجر محدد
      if (!shop) {
        return new Response(
          JSON.stringify({ 
            error: "Missing shop parameter",
            timestamp,
            url: req.url,
            params: Object.fromEntries(url.searchParams.entries()),
            success: false
          }), 
          { status: 400, headers: corsHeaders }
        );
      }
      
      // تنظيف نطاق المتجر
      const cleanedShop = cleanShopDomain(shop);
      console.log("Cleaned shop domain:", cleanedShop);
      
      // التحقق من صحة نطاق المتجر
      if (!isValidShopifyDomain(cleanedShop)) {
        return new Response(
          JSON.stringify({ 
            error: "Invalid Shopify domain",
            invalidDomain: cleanedShop,
            timestamp,
            success: false
          }), 
          { status: 400, headers: corsHeaders }
        );
      }

      // إنشاء معرف فريد لهذه المصادقة
      const state = generateNonce();
      
      try {
        // التحقق من وجود هذا المتجر في قاعدة البيانات
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        
        const { data: existingShops, error: queryError } = await supabase
          .from('shopify_stores')
          .select('*')
          .eq('shop', cleanedShop);
        
        if (queryError) {
          console.error("Error checking existing shops:", queryError);
        } else {
          console.log("Existing shop check result:", existingShops);
        }
        
        // حفظ حالة المصادقة المؤقتة
        const { error: insertError } = await supabase.from('shopify_auth').insert({
          shop: cleanedShop,
          state,
          created_at: new Date().toISOString(),
        });
        
        if (insertError) {
          console.error("Error saving auth state:", insertError);
          throw new Error("Failed to save authentication state");
        }
        
        // إنشاء عناوين URL للمصادقة
        const scopes = "write_products,read_products,read_orders,write_orders,write_script_tags,read_themes,write_themes,read_content,write_content";
        
        // استخدام المسار الأول لإعادة التوجيه
        const authCallbackUrl = `${APP_URL}${AUTH_CALLBACK_PATHS[0]}`; 
        const authUrl = `https://${cleanedShop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${scopes}&redirect_uri=${encodeURIComponent(authCallbackUrl)}&state=${state}`;
        
        console.log("Generated auth URL:", authUrl);
        console.log("Using callback URL:", authCallbackUrl);
        
        return new Response(JSON.stringify({
          success: true,
          redirect: authUrl,
          shop: cleanedShop,
          state,
          appUrl: APP_URL,
          callbackUrl: authCallbackUrl,
          timestamp
        }), { status: 200, headers: corsHeaders });
      } catch (error) {
        console.error("Error initiating authentication:", error);
        return new Response(
          JSON.stringify({ 
            error: "Error initiating authentication",
            details: error instanceof Error ? error.message : "Unknown error",
            shop: cleanedShop,
            success: false,
            timestamp
          }),
          { status: 500, headers: corsHeaders }
        );
      }
    }
  } catch (error) {
    console.error("Critical error in auth function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Internal server error",
        stack: error instanceof Error ? error.stack : undefined,
        success: false,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
