import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

// إعدادات Supabase
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || 'https://trlklwixfeaexhydzaue.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjcxMTQxOCwiZXhwIjoyMDY4Mjg3NDE4fQ.cXZGpHiwobAzYhKPa1yWL1I1jRjEz-3WDFFvTMNRglU';

// إعدادات تطبيق Shopify
const SHOPIFY_API_KEY = "7e4608874bbcc38afa1953948da28407";
const SHOPIFY_API_SECRET = "18221d830a86da52082e0d06c0d32ba3";

console.log("🚀 Shopify Auth Callback initialized");

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
  
  const body = {
    client_id: SHOPIFY_API_KEY,
    client_secret: SHOPIFY_API_SECRET,
    code: code
  };
  
  console.log(`🔑 Getting access token for ${shop}`);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${response.status} - ${error}`);
  }
  
  const tokenData = await response.json();
  console.log(`✅ Access token received for ${shop}`);
  return tokenData;
}

// دالة لحفظ بيانات المتجر مع محاولات متعددة
async function saveShopData(shop: string, tokenData: any, maxRetries = 5): Promise<void> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`💾 Saving shop data attempt ${attempt}/${maxRetries} for ${shop}`);
      
      // حذف المتاجر الأخرى وتعيين هذا كنشط
      const { error: updateError } = await supabase
        .from('shopify_stores')
        .update({ is_active: false })
        .neq('shop', shop);
      
      if (updateError) {
        console.warn(`⚠️ Warning updating other stores: ${updateError.message}`);
      }
      
      // إدراج أو تحديث المتجر الحالي
      const { data, error } = await supabase
        .from('shopify_stores')
        .upsert({
          shop: shop,
          access_token: tokenData.access_token,
          scope: tokenData.scope || '',
          token_type: tokenData.token_type || 'offline',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();
      
      if (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error);
        if (attempt === maxRetries) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      
      // التحقق من الحفظ
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data: verifyData, error: verifyError } = await supabase
        .from('shopify_stores')
        .select('shop, is_active')
        .eq('shop', shop)
        .single();
      
      if (verifyError || !verifyData) {
        console.error(`❌ Verification failed on attempt ${attempt}`);
        if (attempt === maxRetries) {
          throw new Error('Failed to verify shop data after save');
        }
        continue;
      }
      
      console.log(`✅ Shop ${shop} saved and verified successfully on attempt ${attempt}`);
      return;
      
    } catch (error) {
      console.error(`❌ Attempt ${attempt} error:`, error);
      if (attempt === maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`🚀 [${requestId}] New request: ${req.method} ${req.url}`);
  
  // معالجة OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const url = new URL(req.url);
    const shop = cleanShopDomain(url.searchParams.get("shop") || "");
    const code = url.searchParams.get("code");
    const hmac = url.searchParams.get("hmac");
    const state = url.searchParams.get("state");
    
    console.log(`📊 [${requestId}] Parameters:`, { shop, code: !!code, hmac: !!hmac, state });
    
    if (!shop) {
      throw new Error('معامل shop مطلوب');
    }
    
    if (!code) {
      throw new Error('معامل code مطلوب');
    }
    
    // الحصول على رمز الوصول
    console.log(`🔑 [${requestId}] Getting access token...`);
    const tokenData = await getAccessToken(shop, code);
    
    // حفظ البيانات مع محاولات متعددة
    console.log(`💾 [${requestId}] Saving to database...`);
    await saveShopData(shop, tokenData);
    
    console.log(`🎉 [${requestId}] SUCCESS: Shop ${shop} processed successfully!`);
    
    // إرجاع استجابة HTML تحتوي على تحويل إلى الداشبورد
    const redirectHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>تم الاتصال بنجاح</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          text-align: center; 
          padding: 50px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          margin: 0;
        }
        .container {
          background: white;
          color: #333;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          max-width: 500px;
          margin: 0 auto;
        }
        .success { color: #28a745; font-size: 24px; margin-bottom: 20px; }
        .loading { color: #6c757d; margin: 20px 0; }
        .spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #007bff;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success">✅ تم ربط المتجر بنجاح!</div>
        <p>المتجر: <strong>${shop}</strong></p>
        <div class="loading">جاري تحويلك إلى لوحة التحكم...</div>
        <div class="spinner"></div>
      </div>
      
      <script>
        // حفظ بيانات المتجر في localStorage
        localStorage.setItem('shopify_store', '${shop}');
        localStorage.setItem('shopify_connected', 'true');
        localStorage.removeItem('shopify_temp_store');
        
        // التحويل إلى الداشبورد
        setTimeout(() => {
          window.top.location.href = 'https://codform-flow-forms.lovable.app/dashboard';
        }, 2000);
        
        // في حالة فشل التحويل التلقائي
        setTimeout(() => {
          if (window.top) {
            window.top.location.href = 'https://codform-flow-forms.lovable.app/dashboard';
          } else {
            window.location.href = 'https://codform-flow-forms.lovable.app/dashboard';
          }
        }, 5000);
      </script>
    </body>
    </html>`;
    
    return new Response(redirectHtml, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "X-Shopify-Auth-Success": "true",
        "X-Request-ID": requestId
      }
    });
    
  } catch (error) {
    console.error(`❌ [${requestId}] ERROR:`, error);
    
    const errorHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>خطأ في الاتصال</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          text-align: center; 
          padding: 50px;
          background: #f8d7da;
          color: #721c24;
        }
        .container {
          background: white;
          padding: 30px;
          border-radius: 10px;
          border: 1px solid #f5c6cb;
          max-width: 500px;
          margin: 0 auto;
        }
        .error { color: #dc3545; font-size: 20px; margin-bottom: 20px; }
        button {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          margin: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="error">❌ حدث خطأ أثناء ربط المتجر</div>
        <p>الخطأ: ${error.message}</p>
        <button onclick="window.top.location.href='https://codform-flow-forms.lovable.app/shopify'">
          المحاولة مرة أخرى
        </button>
        <button onclick="window.top.location.href='https://codform-flow-forms.lovable.app/dashboard'">
          العودة للداشبورد
        </button>
      </div>
    </body>
    </html>`;
    
    return new Response(errorHtml, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8"
      }
    });
  }
});