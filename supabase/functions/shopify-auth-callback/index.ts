
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// إعدادات Supabase
const SUPABASE_URL = 'https://trlklwixfeaexhydzaue.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjcxMTQxOCwiZXhwIjoyMDY4Mjg3NDE4fQ.cXZGpHiwobAzYhKPa1yWL1I1jRjEz-3WDFFvTMNRglU';

// إعدادات تطبيق Shopify
const SHOPIFY_API_KEY = "753bee28b4a0b12f2d87c79b56c86641";
const SHOPIFY_API_SECRET = "981e7ad45a4951c809f766322d88c800";

console.log("🚀 Shopify Auth Callback Handler Started");

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

// دالة لحفظ بيانات المتجر
async function saveShopData(shop: string, tokenData: any): Promise<void> {
  console.log(`💾 Saving shop data for: ${shop}`);
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
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
      console.error(`❌ Database error:`, error);
      throw new Error(`فشل في حفظ بيانات المتجر: ${error.message}`);
    }
    
    console.log(`✅ Shop data saved successfully:`, data);
    
    // التحقق من حفظ البيانات
    const { data: verifyData, error: verifyError } = await supabase
      .from('shopify_stores')
      .select('*')
      .eq('shop', shop)
      .eq('is_active', true)
      .single();
    
    if (verifyError || !verifyData) {
      throw new Error('فشل في التحقق من حفظ البيانات');
    }
    
    console.log(`✅ Shop verification successful:`, verifyData);
    
  } catch (error) {
    console.error(`❌ Error saving shop data:`, error);
    throw error;
  }
}

serve(async (req) => {
  console.log("📞 Callback received:", req.url);

  try {
    // قراءة معلمات الطلب من URL
    const url = new URL(req.url);
    const shop = url.searchParams.get("shop");
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    
    console.log("📝 Callback parameters:", { shop, code: !!code, state });

    if (!shop || !code) {
      console.error("❌ Missing required parameters");
      return new Response(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>خطأ في المعلمات</title>
          <style>
            body { font-family: Arial; text-align: center; padding: 50px; background: #fee; }
            h1 { color: #d00; }
          </style>
        </head>
        <body>
          <h1>❌ خطأ في المعلمات</h1>
          <p>المعلمات المطلوبة غير موجودة: shop=${shop}, code=${!!code}</p>
          <script>
            setTimeout(() => {
              window.location.href = 'https://codmagnet.com/shopify-connect';
            }, 3000);
          </script>
        </body>
        </html>
      `, { headers: { "Content-Type": "text/html; charset=utf-8" } });
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
      
      // إعادة توجيه للصفحة الرئيسية مع معاملات الاتصال الناجح
      const appUrl = req.headers.get('origin') || 'https://codmagnet.com';
      const redirectUrl = `${appUrl}/?connected=true&shop=${encodeURIComponent(cleanedShop)}`;
      
      console.log(`🔄 Redirecting to: ${redirectUrl}`);
      
      return new Response(null, {
        status: 302,
        headers: { 
          "Location": redirectUrl,
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Pragma": "no-cache"
        }
      });

    } catch (error) {
      console.error("❌ Error processing callback:", error);
      
      console.log("🚨 Full request URL:", req.url);
      console.log("🚨 URL object:", url);
      console.log("🚨 Search params:", Array.from(url.searchParams.entries()));
      
      // إنشاء HTML للخطأ
      return new Response(`
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
              سيتم إعادة توجيهك إلى صفحة الاتصال خلال <span id="countdown">3</span> ثواني
            </div>
          </div>
          
          <script>
            console.error('❌ Shopify connection failed:', '${error instanceof Error ? error.message : 'Unknown error'}');
            
            // عد تنازلي وإعادة توجيه
            let timeLeft = 3;
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
      `, {
        headers: { 
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Pragma": "no-cache"
        }
      });
    }

  } catch (error) {
    console.error("❌ Fatal error in callback handler:", error);
    
    return new Response(`
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
    `, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
});
