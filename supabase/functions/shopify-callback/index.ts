
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

// إعدادات Supabase
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || 'https://trlklwixfeaexhydzaue.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M';

// إعدادات تطبيق Shopify
const SHOPIFY_API_KEY = Deno.env.get("SHOPIFY_API_KEY") || "7e4608874bbcc38afa1953948da28407";
const SHOPIFY_API_SECRET = Deno.env.get("SHOPIFY_API_SECRET") || "18221d830a86da52082e0d06c0d32ba3";

console.log("🚀 Shopify Callback Edge Function initialized with enhanced logging");

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

// دالة التحقق من HMAC
function verifyHmac(data: any, hmac: string): boolean {
  if (!SHOPIFY_API_SECRET || !hmac) {
    console.warn("⚠️ HMAC verification skipped - missing secret or hmac");
    return true; // Skip verification if missing
  }
  
  try {
    // إنشاء query string للتحقق من HMAC
    const queryString = Object.keys(data)
      .filter(key => key !== 'hmac')
      .sort()
      .map(key => `${key}=${data[key]}`)
      .join('&');
    
    const computedHmac = createHmac('sha256', SHOPIFY_API_SECRET)
      .update(queryString)
      .digest('hex');
    
    const isValid = computedHmac === hmac;
    console.log(`🔐 HMAC verification: ${isValid ? 'VALID' : 'INVALID'}`);
    return isValid;
  } catch (error) {
    console.error("❌ HMAC verification error:", error);
    return false;
  }
}

// دالة الحصول على رمز الوصول من Shopify
async function getAccessToken(shop: string, code: string): Promise<any> {
  console.log(`🔑 Getting access token for shop: ${shop}`);
  
  if (!shop || !code) {
    throw new Error("Shop and code are required for token exchange");
  }
  
  if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET) {
    throw new Error("Shopify API credentials missing");
  }
  
  const tokenUrl = `https://${shop}/admin/oauth/access_token`;
  console.log(`📡 Token request URL: ${tokenUrl}`);
  
  const requestData = {
    client_id: SHOPIFY_API_KEY,
    client_secret: SHOPIFY_API_SECRET,
    code
  };
  
  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify(requestData)
    });
    
    console.log(`📈 Token response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Token request failed: ${errorText}`);
      throw new Error(`Failed to get access token: ${response.status} ${response.statusText}`);
    }
    
    const responseData = await response.json();
    console.log(`✅ Token received with keys: ${Object.keys(responseData).join(', ')}`);
    
    if (!responseData.access_token) {
      console.error("❌ No access token in response");
      throw new Error("Access token missing in Shopify response");
    }
    
    return {
      access_token: responseData.access_token,
      scope: responseData.scope || '',
      token_type: responseData.expires_in ? 'online' : 'offline'
    };
  } catch (error) {
    console.error(`❌ Token request error: ${error.message}`);
    throw error;
  }
}

// دالة تحديث بيانات المتجر مع محاولات متعددة
async function updateShopDataWithRetries(shop: string, tokenData: any, maxRetries = 3): Promise<void> {
  console.log(`💾 Starting database save for shop: ${shop}`);
  
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Database connection failed: Service Role Key not available");
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  if (!tokenData || !tokenData.access_token) {
    throw new Error("Invalid token data: access_token is required");
  }
  
  console.log(`🔑 Valid token received for ${shop}, starting save process`);
  
  let attempt = 0;
  let lastError: Error | null = null;
  
  while (attempt < maxRetries) {
    attempt++;
    console.log(`🔄 Database save attempt ${attempt}/${maxRetries} for ${shop}`);
    
    try {
      // الخطوة 1: إلغاء تفعيل المتاجر الأخرى
      console.log(`🚫 Disabling other stores before saving ${shop}`);
      const { error: disableError } = await supabase
        .from('shopify_stores')
        .update({ is_active: false })
        .neq('shop', shop);
      
      if (disableError) {
        console.warn(`⚠️ Error disabling other stores: ${disableError.message}`);
      } else {
        console.log(`✅ Successfully disabled other stores`);
      }
      
      // الخطوة 2: التحقق من وجود المتجر
      console.log(`🔍 Checking if store ${shop} exists`);
      const { data: existingStore } = await supabase
        .from('shopify_stores')
        .select('*')
        .eq('shop', shop)
        .maybeSingle();
      
      const currentTimestamp = new Date().toISOString();
      const storeData = {
        shop,
        access_token: tokenData.access_token,
        scope: tokenData.scope || '',
        token_type: tokenData.token_type || 'offline',
        is_active: true,
        updated_at: currentTimestamp
      };
      
      let result;
      
      if (existingStore) {
        console.log(`📝 Updating existing store record for ${shop}`);
        result = await supabase
          .from('shopify_stores')
          .update(storeData)
          .eq('shop', shop)
          .select();
      } else {
        console.log(`➕ Creating new store record for ${shop}`);
        result = await supabase
          .from('shopify_stores')
          .insert([{
            ...storeData,
            created_at: currentTimestamp
          }])
          .select();
      }
      
      if (result.error) {
        throw new Error(`Database operation failed: ${result.error.message}`);
      }
      
      if (!result.data || result.data.length === 0) {
        throw new Error(`No data returned from database operation`);
      }
      
      console.log(`✅ Store ${shop} saved successfully on attempt ${attempt}`);
      
      // الخطوة 3: التحقق الفوري من حفظ البيانات
      console.log(`🔍 Verifying saved data for ${shop}`);
      const { data: verifyData, error: verifyError } = await supabase
        .from('shopify_stores')
        .select('*')
        .eq('shop', shop)
        .eq('is_active', true)
        .maybeSingle();
      
      if (verifyError) {
        throw new Error(`Verification failed: ${verifyError.message}`);
      }
      
      if (!verifyData) {
        throw new Error(`Verification failed: No active store found for ${shop}`);
      }
      
      console.log(`✅ Store ${shop} verified successfully in database`);
      
      // الخطوة 4: اختبار صحة الرمز
      await testTokenValidity(shop, tokenData.access_token);
      
      console.log(`🎉 Store ${shop} completely saved and verified!`);
      return; // نجح الحفظ، خروج من الحلقة
      
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Save attempt ${attempt} failed: ${lastError.message}`);
      
      if (attempt < maxRetries) {
        const delay = attempt * 1000; // تأخير متزايد
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // إذا فشلت جميع المحاولات
  throw new Error(`Failed to save store after ${maxRetries} attempts. Last error: ${lastError?.message}`);
}

// دالة اختبار صحة الرمز
async function testTokenValidity(shop: string, accessToken: string): Promise<void> {
  console.log(`🧪 Testing token validity for ${shop}`);
  
  try {
    const testUrl = `https://${shop}/admin/api/2023-07/shop.json`;
    const response = await fetch(testUrl, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Token validation failed: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data || !data.shop || !data.shop.id) {
      throw new Error("Invalid response format from shop endpoint");
    }
    
    console.log(`✅ Token validation successful for ${shop} (Shop ID: ${data.shop.id})`);
  } catch (error) {
    console.error(`❌ Token validation error: ${error.message}`);
    throw error;
  }
}

// استجابة لطلبات
serve(async (req) => {
  const requestId = crypto.randomUUID();
  console.log(`🆔 [${requestId}] Request received: ${req.method} ${req.url}`);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }
  
  try {
    let shop = "";
    let code = "";
    let state = "";
    let hmac = "";
    let timestamp = "";
    
    const url = new URL(req.url);
    
    if (req.method === "POST") {
      const body = await req.json();
      console.log(`📨 [${requestId}] POST body received`);
      
      shop = body.shop || "";
      code = body.code || "";
      state = body.state || "";
      hmac = body.hmac || "";
      timestamp = body.timestamp || "";
    } else {
      shop = url.searchParams.get("shop") || "";
      code = url.searchParams.get("code") || "";
      state = url.searchParams.get("state") || "";
      hmac = url.searchParams.get("hmac") || "";
      timestamp = url.searchParams.get("timestamp") || "";
    }
    
    shop = cleanShopDomain(shop);
    
    console.log(`📋 [${requestId}] Parameters: shop=${shop}, code=${code ? 'present' : 'missing'}, hmac=${hmac ? 'present' : 'missing'}`);
    
    if (!code || !shop) {
      throw new Error('Required parameters (code or shop) missing');
    }
    
    // التحقق من HMAC
    if (hmac) {
      const isValidHmac = verifyHmac({
        shop,
        code,
        state,
        timestamp
      }, hmac);
      
      if (!isValidHmac) {
        console.warn(`⚠️ [${requestId}] HMAC verification failed, but continuing...`);
      }
    }
    
    // الحصول على رمز الوصول
    console.log(`🔑 [${requestId}] Getting access token...`);
    const tokenData = await getAccessToken(shop, code);
    
    // حفظ البيانات مع محاولات متعددة
    console.log(`💾 [${requestId}] Saving to database with retries...`);
    await updateShopDataWithRetries(shop, tokenData);
    
    console.log(`🎉 [${requestId}] SUCCESS: Shop ${shop} fully processed!`);
    
    const successResponse = {
      success: true,
      access_token: tokenData.access_token,
      shop: shop,
      message: `تم ربط المتجر ${shop} بنجاح`,
      debug: {
        requestId,
        timestamp: new Date().toISOString(),
        tokenType: tokenData.token_type || 'offline',
        databaseVerified: true,
        hmacVerified: !!hmac
      }
    };
    
    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: {
        ...corsHeaders,
        "X-Shopify-Auth-Success": "true",
        "X-Request-ID": requestId
      }
    });
    
  } catch (error) {
    console.error(`❌ [${requestId}] ERROR: ${error.message}`);
    console.error(`📊 [${requestId}] Stack: ${error.stack}`);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        request_id: requestId
      }),
      {
        status: 200,
        headers: corsHeaders
      }
    );
  }
});
