
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { v4 as uuidv4 } from "https://esm.sh/uuid@9";

// إعدادات Supabase
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

console.log("🚀 Shopify Auth Edge Function initialized");

// إعدادات تطبيق Shopify
const SHOPIFY_API_KEY = Deno.env.get("SHOPIFY_API_KEY")!;

// صلاحيات التطبيق
const scopes = "read_products,write_draft_orders,write_pixels,read_customer_events";

// عنوان URL لرد المصادقة - يشير مباشرة إلى Edge Function
const CALLBACK_URL = `${SUPABASE_URL}/functions/v1/shopify-auth-callback`;

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
    let userId: string | undefined = undefined;
    
    const url = new URL(req.url);
    const shopParam = url.searchParams.get("shop");
    
    if (shopParam) {
      shop = cleanShopDomain(shopParam);
    } else if (req.method === "POST") {
      try {
        const body = await req.json();
        console.log("Request body:", body);
        shop = cleanShopDomain(body.shop || "");
        userId = body.userId || body.user_id; // استخراج user_id من الطلب
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
    
    // محاولة الحصول على user_id من header Authorization
    if (!userId) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        try {
          const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
          const token = authHeader.replace("Bearer ", "");
          const { data: { user }, error } = await supabase.auth.getUser(token);
          if (user && !error) {
            userId = user.id;
            console.log("🔍 Found user ID from auth token:", userId);
          }
        } catch (e) {
          console.log("⚠️ Could not extract user from auth token:", e);
        }
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
    
    // إنشاء حالة مصادقة تحتوي على userId إذا كان متوفراً
    const stateData = {
      id: uuidv4(),
      userId: userId
    };
    const state = encodeURIComponent(JSON.stringify(stateData));
    
    console.log("🔗 Creating auth state with user:", userId);
    
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
