import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// إعدادات Supabase
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || 'https://trlklwixfeaexhydzaue.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjcxMTQxOCwiZXhwIjoyMDY4Mjg3NDE4fQ.cXZGpHiwobAzYhKPa1yWL1I1jRjEz-3WDFFvTMNRglU';

// إعدادات تطبيق Shopify
const SHOPIFY_API_KEY = "7e4608874bbcc38afa1953948da28407";
const SHOPIFY_API_SECRET = "18221d830a86da52082e0d06c0d32ba3";

console.log("🚀 Shopify Auth Callback Edge Function initialized");

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
  
  console.log(`🧹 Cleaned shop domain: ${shop} -> ${cleanedShop}`);
  return cleanedShop;
}

// دالة للحصول على رمز الوصول
async function getAccessToken(shop: string, code: string): Promise<any> {
  const url = `https://${shop}/admin/oauth/access_token`;
  
  const payload = {
    client_id: SHOPIFY_API_KEY,
    client_secret: SHOPIFY_API_SECRET,
    code: code,
  };
  
  console.log(`🔄 Requesting access token from: ${url}`);
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Access token request failed: ${response.status} - ${errorText}`);
    throw new Error(`خطأ في الحصول على رمز الوصول: ${response.status}`);
  }
  
  const data = await response.json();
  console.log("✅ Access token received successfully");
  return data;
}

// دالة لحفظ بيانات المتجر مع إعادة المحاولة
async function saveShopData(shop: string, tokenData: any, maxRetries = 5): Promise<void> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`💾 Saving shop data (attempt ${attempt}/${maxRetries})`);
      
      // حذف أي بيانات قديمة للمتجر أولاً
      const { error: deleteError } = await supabase
        .from('shopify_stores')
        .delete()
        .eq('shop', shop);
      
      if (deleteError) {
        console.warn(`⚠️ Warning deleting old shop data:`, deleteError);
      }
      
      // إدراج البيانات الجديدة
      const { data, error } = await supabase
        .from('shopify_stores')
        .insert({
          shop: shop,
          access_token: tokenData.access_token,
          scope: tokenData.scope,
          token_type: tokenData.token_type || 'Bearer',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Database error (attempt ${attempt}):`, error);
        if (attempt === maxRetries) {
          throw new Error(`فشل في حفظ بيانات المتجر: ${error.message}`);
        }
        // انتظار قبل إعادة المحاولة
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      
      console.log(`✅ Shop data saved successfully:`, data);
      return;
      
    } catch (error) {
      console.error(`❌ Error saving shop data (attempt ${attempt}):`, error);
      if (attempt === maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

serve(async (req) => {
  console.log("🚀 Shopify Auth Callback Handler Started");

  // التعامل مع طلبات CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    // قراءة معلمات الطلب
    const url = new URL(req.url);
    let shop = url.searchParams.get("shop");
    let code = url.searchParams.get("code");
    let state = url.searchParams.get("state");
    
    // إذا لم توجد المعلمات في URL، جرب body
    if (!shop || !code) {
      if (req.method === "POST") {
        try {
          const body = await req.json();
          shop = body.shop || shop;
          code = body.code || code;
          state = body.state || state;
        } catch (e) {
          console.error("Error parsing request body:", e);
        }
      }
    }
    
    console.log("📝 Callback parameters:", { shop, code, state, hasCode: !!code });

    if (!shop || !code) {
      console.error("❌ Missing required parameters");
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head><title>خطأ في المعلمات</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1 style="color: red;">خطأ في المعلمات</h1>
          <p>المعلمات المطلوبة غير موجودة</p>
          <script>
            setTimeout(() => {
              window.location.href = 'https://codmagnet.com/shopify-connect';
            }, 3000);
          </script>
        </body>
        </html>
      `;
      return new Response(errorHtml, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    // تنظيف اسم المتجر
    const cleanedShop = cleanShopDomain(shop);
    console.log(`🧹 Cleaned shop: ${shop} -> ${cleanedShop}`);

    try {
      // الحصول على access token من Shopify
      console.log("🔄 Getting access token from Shopify...");
      const tokenData = await getAccessToken(cleanedShop, code);
      
      if (!tokenData || !tokenData.access_token) {
        throw new Error("فشل في الحصول على access token من Shopify");
      }

      console.log("✅ Access token received from Shopify");

      // حفظ بيانات المتجر في قاعدة البيانات
      console.log("💾 Saving shop data to database...");
      await saveShopData(cleanedShop, tokenData);
      
      console.log("✅ Shop data saved successfully");

      // إنشاء HTML للنجاح مع إعادة توجيه تلقائية
      const successHtml = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>تم الاتصال بنجاح</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              margin: 0;
              padding: 0;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 3rem;
              box-shadow: 0 25px 50px rgba(0,0,0,0.15);
              text-align: center;
              max-width: 500px;
              width: 90%;
            }
            .success-icon {
              font-size: 4rem;
              color: #10b981;
              margin-bottom: 1rem;
            }
            h1 {
              color: #1f2937;
              margin-bottom: 1rem;
              font-size: 2rem;
            }
            p {
              color: #6b7280;
              line-height: 1.6;
              font-size: 1.1rem;
            }
            .shop-name {
              background: #f0fdf4;
              border: 1px solid #bbf7d0;
              border-radius: 8px;
              padding: 1rem;
              margin: 1rem 0;
              font-weight: bold;
              color: #166534;
            }
            .countdown {
              background: #f9fafb;
              border-radius: 8px;
              padding: 1rem;
              margin-top: 2rem;
              font-size: 0.875rem;
              color: #374151;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✅</div>
            <h1>تم الاتصال بنجاح!</h1>
            <p>تم ربط متجرك بالتطبيق بنجاح</p>
            <div class="shop-name">${cleanedShop}</div>
            <p>يمكنك الآن استخدام جميع ميزات التطبيق مع متجرك</p>
            <div class="countdown">
              سيتم إعادة توجيهك إلى لوحة التحكم خلال <span id="countdown">5</span> ثواني
            </div>
          </div>
          
          <script>
            console.log('✅ Shopify store connected successfully: ${cleanedShop}');
            
            // حفظ معلومات المتجر في localStorage
            localStorage.setItem('shopify_store', '${cleanedShop}');
            localStorage.setItem('shopify_connected', 'true');
            localStorage.setItem('shopify_last_connected', Date.now().toString());
            
            // عد تنازلي وإعادة توجيه
            let timeLeft = 5;
            const countdownElement = document.getElementById('countdown');
            
            const timer = setInterval(() => {
              timeLeft--;
              countdownElement.textContent = timeLeft;
              if (timeLeft <= 0) {
                clearInterval(timer);
                window.location.href = 'https://codmagnet.com/dashboard';
              }
            }, 1000);
          </script>
        </body>
        </html>
      `;

      return new Response(successHtml, {
        headers: { 
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Pragma": "no-cache"
        }
      });

    } catch (error) {
      console.error("❌ Error processing callback:", error);
      
      // إنشاء HTML للخطأ
      const errorHtml = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>خطأ في الاتصال</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              margin: 0;
              padding: 0;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 3rem;
              box-shadow: 0 25px 50px rgba(0,0,0,0.15);
              text-align: center;
              max-width: 500px;
              width: 90%;
            }
            .error-icon {
              font-size: 4rem;
              color: #ef4444;
              margin-bottom: 1rem;
            }
            h1 {
              color: #1f2937;
              margin-bottom: 1rem;
              font-size: 2rem;
            }
            p {
              color: #6b7280;
              line-height: 1.6;
              font-size: 1.1rem;
            }
            .error-details {
              background: #fef2f2;
              border: 1px solid #fecaca;
              border-radius: 8px;
              padding: 1rem;
              margin: 1rem 0;
              color: #991b1b;
              font-size: 0.875rem;
            }
            .countdown {
              background: #f9fafb;
              border-radius: 8px;
              padding: 1rem;
              margin-top: 2rem;
              font-size: 0.875rem;
              color: #374151;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error-icon">❌</div>
            <h1>فشل في الاتصال</h1>
            <p>حدث خطأ أثناء محاولة ربط متجرك</p>
            <div class="error-details">${error instanceof Error ? error.message : 'خطأ غير معروف'}</div>
            <p>يرجى المحاولة مرة أخرى</p>
            <div class="countdown">
              سيتم إعادة توجيهك إلى صفحة الاتصال خلال <span id="countdown">5</span> ثواني
            </div>
          </div>
          
          <script>
            console.error('❌ Shopify connection failed:', '${error instanceof Error ? error.message : 'Unknown error'}');
            
            // عد تنازلي وإعادة توجيه
            let timeLeft = 5;
            const countdownElement = document.getElementById('countdown');
            
            const timer = setInterval(() => {
              timeLeft--;
              countdownElement.textContent = timeLeft;
              if (timeLeft <= 0) {
                clearInterval(timer);
                window.location.href = 'https://codmagnet.com/shopify-connect';
              }
            }, 1000);
          </script>
        </body>
        </html>
      `;

      return new Response(errorHtml, {
        headers: { 
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Pragma": "no-cache"
        }
      });
    }

  } catch (error) {
    console.error("❌ Fatal error in callback handler:", error);
    
    const fatalErrorHtml = `
      <!DOCTYPE html>
      <html>
      <head><title>خطأ خطير</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1 style="color: red;">خطأ خطير في النظام</h1>
        <p>حدث خطأ غير متوقع، يرجى المحاولة لاحقاً</p>
        <script>
          setTimeout(() => {
            window.location.href = 'https://codmagnet.com';
          }, 3000);
        </script>
      </body>
      </html>
    `;

    return new Response(fatalErrorHtml, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
});