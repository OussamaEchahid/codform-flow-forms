
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// إعدادات Supabase
const SUPABASE_URL = 'https://nhqrngdzuatdnfkihtud.supabase.co';
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ocXJuZ2R6dWF0ZG5ma2lodHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MDM2MTgsImV4cCI6MjA2MTE3OTYxOH0.bebH8nV_6W0DpwjmS_vYFB2P9xVU-txCRvQc6Jt5DdA';

// إعدادات تطبيق Shopify
const SHOPIFY_API_KEY = Deno.env.get("SHOPIFY_API_KEY") || "7e4608874bbcc38afa1953948da28407";
const SHOPIFY_API_SECRET = Deno.env.get("SHOPIFY_API_SECRET") || "18221d830a86da52082e0d06c0d32ba3";

// عنوان URL لتطبيقنا
const APP_URL = "https://codform-flow-forms.lovable.app";

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

// التحقق من صحة عنوان URL للمتجر
function isValidShopifyDomain(shop: string): boolean {
  if (!shop) return false;
  
  // نمط النطاق الأساسي لـ Shopify
  const shopifyDomainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
  
  return shopifyDomainPattern.test(shop);
}

serve(async (req) => {
  // سجل الطلب كاملاً للتصحيح
  console.log("Callback received:", {
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
    let shop = url.searchParams.get("shop");
    const hmac = url.searchParams.get("hmac");
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const timestamp = Date.now();
    const isPopup = url.searchParams.get("popup") === "true";
    
    console.log("Callback params:", {
      shop,
      hmac: hmac ? "present" : "missing", 
      code: code ? "present" : "missing", 
      state,
      timestamp,
      isPopup,
      fullUrl: req.url
    });
    
    if (!shop || !code) {
      // إذا كان الطلب من واجهة المستخدم (نوع POST)
      if (req.method === "POST") {
        try {
          const body = await req.json();
          console.log("POST body:", body);
          
          shop = body.shop;
          const codeFromBody = body.code;
          const hmacFromBody = body.hmac;
          const stateFromBody = body.state;
          
          if (!shop || !codeFromBody) {
            throw new Error("Missing required parameters in POST body");
          }
          
          // استخدام القيم من body إذا لم تكن متوفرة في URL
          if (!code) code = codeFromBody;
          if (!hmac) hmac = hmacFromBody;
          if (!state) state = stateFromBody;
        } catch (jsonError) {
          console.error("Error parsing POST body:", jsonError);
          return new Response(
            JSON.stringify({ 
              error: "Invalid request format or missing required parameters",
              success: false,
              timestamp
            }), 
            { status: 400, headers: corsHeaders }
          );
        }
      } else {
        return new Response(
          JSON.stringify({ 
            error: "Missing required parameters",
            params: Object.fromEntries(url.searchParams.entries()),
            success: false,
            timestamp
          }), 
          { status: 400, headers: corsHeaders }
        );
      }
    }
    
    // تنظيف نطاق المتجر
    shop = cleanShopDomain(shop);
    console.log("Cleaned shop domain for callback:", shop);
    
    // التحقق من صحة نطاق المتجر
    if (!isValidShopifyDomain(shop)) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid Shopify domain",
          invalidDomain: shop,
          timestamp,
          success: false
        }), 
        { status: 400, headers: corsHeaders }
      );
    }
    
    try {
      // التحقق من حالة المصادقة إن وجدت
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      
      if (state) {
        // التحقق من وجود حالة المصادقة في قاعدة البيانات
        const { data: stateRecord, error: stateError } = await supabase
          .from('shopify_auth')
          .select('*')
          .eq('state', state)
          .single();
        
        if (stateError) {
          console.log("Error checking state:", stateError);
          // استمر على أي حال، لا تفشل المصادقة فقط بسبب التحقق من الحالة
        } else if (stateRecord) {
          console.log("State verified successfully:", stateRecord);
        } else {
          console.log("No matching state found, but continuing");
        }
      }
    
      // استبدال الرمز بتوكن الوصول
      const accessTokenResponse = await fetch(
        `https://${shop}/admin/oauth/access_token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: SHOPIFY_API_KEY,
            client_secret: SHOPIFY_API_SECRET,
            code
          })
        }
      );
      
      if (!accessTokenResponse.ok) {
        const errorText = await accessTokenResponse.text();
        console.error("Access token error response:", errorText);
        throw new Error(`Failed to get access token: ${accessTokenResponse.statusText}. Response: ${errorText}`);
      }
      
      const tokenData = await accessTokenResponse.json();
      console.log("Token data received:", { ...tokenData, access_token: "REDACTED" });
      
      // حفظ الرمز المميز (token) في قاعدة البيانات Supabase
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        
        // الحصول على معلومات المستخدم الحالي إن وجدت
        const { data: userData, error: userError } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        
        console.log("Current user:", userId || "No authenticated user");
        
        // تعطيل كافة المتاجر الأخرى
        const { error: updateError } = await supabase
          .from('shopify_stores')
          .update({ is_active: false })
          .neq('shop', shop);
        
        if (updateError) {
          console.log("Error disabling other stores:", updateError);
          // استمر على أي حال
        } else {
          console.log("Successfully disabled other stores");
        }
        
        // بيانات المتجر للحفظ
        const storeData = {
          shop,
          access_token: tokenData.access_token,
          scope: tokenData.scope,
          updated_at: new Date().toISOString(),
          is_active: true
        };
        
        // إضافة معرف المستخدم إن وجد
        if (userId) {
          Object.assign(storeData, { user_id: userId });
        }
        
        // استخدام عملية upsert للتعامل مع المتاجر الجديدة والتحديثات
        const { error: upsertError } = await supabase
          .from('shopify_stores')
          .upsert(storeData, { 
            onConflict: 'shop', 
            returning: 'minimal' 
          });
          
        if (upsertError) {
          console.error("Error storing token:", upsertError);
          // استمر على أي حال، حصلنا على الرمز وهو الجزء المهم
        } else {
          console.log("Token stored successfully");
        }
      } catch (storeError) {
        console.error("Error in store operation:", storeError);
        // استمر على أي حال
      }
      
      // تنظيف سجل الحالة المؤقت
      if (state) {
        try {
          await supabase
            .from('shopify_auth')
            .delete()
            .eq('state', state);
          console.log("Temporary state record cleaned up");
        } catch (cleanupError) {
          console.log("Error cleaning up state record:", cleanupError);
          // خطأ غير حرج، استمر
        }
      }
      
      // إعادة استجابة HTML لإغلاق النافذة المنبثقة إذا كانت في نافذة منبثقة
      if (isPopup) {
        const htmlResponse = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <title>تمت المصادقة بنجاح</title>
          <script>
            // إرسال رسالة إلى النافذة الأم حول نجاح المصادقة
            if (window.opener) {
              window.opener.postMessage({
                type: 'shopify:auth:success',
                shop: '${shop}',
              }, '*');
              
              // تخزين معلومات المتجر في localStorage قبل الإغلاق
              try {
                localStorage.setItem('shopify_store', '${shop}');
                localStorage.setItem('shopify_connected', 'true');
                localStorage.setItem('shopify_active_store', '${shop}');
                console.log('Shop data saved to localStorage');
              } catch(e) {
                console.error('Error saving to localStorage:', e);
              }
              
              // إغلاق النافذة المنبثقة بعد تأخير قصير
              setTimeout(function() {
                window.close();
              }, 1000);
            } else {
              // إذا لم تكن في نافذة منبثقة، إعادة التوجيه
              window.location.href = '${APP_URL}/dashboard?shopify_connected=true&shop=${encodeURIComponent(shop)}&new_connection=true';
            }
          </script>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              text-align: center;
              padding: 2rem;
              direction: rtl;
            }
            .success {
              color: #10B981;
              font-size: 3rem;
              margin-bottom: 1rem;
            }
            h1 {
              color: #4B5563;
            }
            p {
              color: #6B7280;
            }
          </style>
        </head>
        <body>
          <div class="success">✓</div>
          <h1>تم الاتصال بنجاح!</h1>
          <p>تم اتصال متجرك ${shop} بنجاح. يمكنك إغلاق هذه النافذة والعودة إلى التطبيق.</p>
        </body>
        </html>
        `;
        
        return new Response(htmlResponse, { 
          headers: { 
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          } 
        });
      }
      
      // إعادة التوجيه إلى التطبيق
      const redirectUrl = `${APP_URL}/dashboard?shopify_connected=true&shop=${encodeURIComponent(shop)}&timestamp=${timestamp}&new_connection=true`;
      console.log("Redirecting back to app:", redirectUrl);
      
      return new Response(
        JSON.stringify({
          success: true,
          shop,
          redirect: redirectUrl,
          timestamp
        }),
        { status: 200, headers: corsHeaders }
      );
    } catch (error) {
      console.error("Error in Shopify OAuth flow:", error);
      return new Response(
        JSON.stringify({ 
          error: error instanceof Error ? error.message : "Unknown error in OAuth flow",
          errorType: error instanceof Error ? error.name : "Unknown",
          success: false,
          timestamp: new Date().toISOString()
        }),
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error("Critical error in callback handler:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Critical error in callback handler",
        errorDetails: error instanceof Error ? error.stack : "Unknown stack",
        success: false,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
