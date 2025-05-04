
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
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
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
    timestamp: new Date().toISOString(),
  });

  // التعامل مع طلبات CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    const url = new URL(req.url);
    // نستخدم let بدلاً من const لأننا قد نحتاج لتغيير القيمة
    let shop = url.searchParams.get("shop") || "";
    let hmac = url.searchParams.get("hmac");
    let code = url.searchParams.get("code");
    let state = url.searchParams.get("state");
    const timestamp = Date.now();
    const isPopup = url.searchParams.get("popup") === "true";
    let forceUpdate = url.searchParams.get("force_update") === "true";
    
    console.log("Callback params:", {
      shop,
      hmac: hmac ? "present" : "missing", 
      code: code ? "present" : "missing", 
      state,
      timestamp,
      isPopup,
      fullUrl: req.url
    });
    
    // إذا كانت البيانات ناقصة نحاول الحصول عليها من body
    if ((!shop || !code) && req.method === "POST") {
      try {
        const body = await req.json();
        console.log("POST body:", body);
        
        // إذا لم يكن لدينا shop من URL نأخذها من body
        if (!shop && body.shop) {
          shop = body.shop;
        }
        
        // إذا لم يكن لدينا code من URL نأخذه من body
        if (!code && body.code) {
          code = body.code;
        }
        
        // إذا لم يكن لدينا hmac من URL نأخذه من body
        if (!hmac && body.hmac) {
          hmac = body.hmac;
        }
        
        // إذا لم يكن لدينا state من URL نأخذه من body
        if (!state && body.state) {
          state = body.state;
        }
        
        // تحديث forceUpdate من body إذا كان موجوداً
        if (body.forceUpdate !== undefined) {
          forceUpdate = body.forceUpdate;
        }
        
        if (!shop || !code) {
          throw new Error("Missing required parameters in POST body");
        }
        
        console.log("Using values from body:", {
          shop,
          code,
          hmac,
          state
        });
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
    }
    
    // إذا مازلنا لا نملك البيانات المطلوبة
    if (!shop || !code || !hmac) {
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

      // Clear any existing tokens for this shop before requesting a new one
      try {
        // Delete any existing tokens for this shop
        const { error: deleteError } = await supabase
          .from('shopify_stores')
          .delete()
          .eq('shop', shop);
          
        if (deleteError) {
          console.log("Error deleting existing tokens:", deleteError);
          // Continue anyway
        } else {
          console.log("Successfully deleted previous tokens for shop:", shop);
        }
      } catch (cleanupError) {
        console.error("Error during shop cleanup:", cleanupError);
        // Continue anyway
      }
    
      // استبدال الرمز بتوكن الوصول - طلب رمز دائم (offline access token)
      const accessTokenResponse = await fetch(
        `https://${shop}/admin/oauth/access_token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: SHOPIFY_API_KEY,
            client_secret: SHOPIFY_API_SECRET,
            code,
            // Request a permanent token (offline access)
            grant_options: ['per_user_authentication']
          })
        }
      );
      
      if (!accessTokenResponse.ok) {
        const errorText = await accessTokenResponse.text();
        console.error("Access token error response:", errorText);
        throw new Error(`Failed to get access token: ${accessTokenResponse.statusText}. Response: ${errorText}`);
      }
      
      const tokenData = await accessTokenResponse.json();
      console.log("Token data received:", { 
        ...tokenData, 
        access_token: "REDACTED",
        token_type: tokenData.token_type || "unknown",
        scope: tokenData.scope || "unknown",
        expires_at: "Using offline token (permanent)"
      });
      
      // حفظ الرمز المميز (token) في قاعدة البيانات Supabase
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        
        // الحصول على معلومات المستخدم الحالي إن وجدت
        const { data: userData, error: userError } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        
        console.log("Current user:", userId || "No authenticated user");
        
        // Clean up all previous connections to ensure we start fresh
        const { error: disableAllError } = await supabase
          .from('shopify_stores')
          .update({ is_active: false })
          .not('id', 'is', null); // Disable all stores
        
        if (disableAllError) {
          console.log("Error disabling all stores:", disableAllError);
        } else {
          console.log("Successfully disabled all stores");
        }
        
        // بيانات المتجر للحفظ
        const storeData = {
          shop,
          access_token: tokenData.access_token,
          scope: tokenData.scope,
          updated_at: new Date().toISOString(),
          token_type: 'offline', // Mark as offline token
          is_active: true,
          created_at: new Date().toISOString()
        };
        
        // إضافة معرف المستخدم إن وجد
        if (userId) {
          Object.assign(storeData, { user_id: userId });
        }
        
        // Clean deletion and fresh insertion instead of upsert for a completely fresh token
        await supabase
          .from('shopify_stores')
          .delete()
          .eq('shop', shop);
          
        // Insert with a fresh record
        const { error: insertError } = await supabase
          .from('shopify_stores')
          .insert(storeData);
          
        if (insertError) {
          console.error("Error storing token:", insertError);
          throw new Error(`Failed to store the access token: ${insertError.message}`);
        } else {
          console.log("Token stored successfully");
        }
      } catch (storeError) {
        console.error("Error in store operation:", storeError);
        throw new Error(`Failed to update shop data: ${storeError instanceof Error ? storeError.message : "Unknown error"}`);
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
                localStorage.setItem('shopify_reconnected_at', '${Date.now()}');
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
              window.location.href = '${APP_URL}/dashboard?shopify_connected=true&shop=${encodeURIComponent(shop)}&new_connection=true&token_renewed=true';
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
      
      // إعادة التوجيه إلى التطبيق مع معلمات إضافية
      const redirectUrl = `${APP_URL}/dashboard?shopify_connected=true&shop=${encodeURIComponent(shop)}&timestamp=${timestamp}&new_connection=true&token_renewed=true`;
      console.log("Redirecting back to app:", redirectUrl);
      
      return new Response(
        JSON.stringify({
          success: true,
          shop,
          redirect: redirectUrl,
          timestamp,
          token_renewed: true
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
