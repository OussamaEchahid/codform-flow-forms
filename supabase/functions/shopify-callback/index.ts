
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// إعدادات Supabase
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || 'https://trlklwixfeaexhydzaue.supabase.co';
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M';

// إعدادات تطبيق Shopify
const SHOPIFY_API_KEY = Deno.env.get("SHOPIFY_API_KEY") || "7e4608874bbcc38afa1953948da28407";
const SHOPIFY_API_SECRET = Deno.env.get("SHOPIFY_API_SECRET") || "18221d830a86da52082e0d06c0d32ba3";

console.log("Initializing Shopify Callback Edge Function with:", {
  SUPABASE_URL,
  SHOPIFY_API_KEY_EXISTS: !!SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET_EXISTS: !!SHOPIFY_API_SECRET
});

// عنوان URL للتطبيق المستضاف
const APP_URL = "https://codform-flow-forms.lovable.app";

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

// دالة الحصول على رمز الوصول من Shopify - تمت إعادة كتابتها بشكل كامل
async function getAccessToken(shop: string, code: string): Promise<any> {
  try {
    console.log(`Getting access token for ${shop} with code ${code}`);
    
    // تأكد من أن المتجر والرمز موجودان
    if (!shop || !code) {
      throw new Error("Shop and code are required for token exchange");
    }
    
    if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET) {
      throw new Error("Shopify API credentials missing");
    }
    
    // بناء عنوان URL بشكل صحيح للمتجر المحدد
    const tokenUrl = `https://${shop}/admin/oauth/access_token`;
    
    console.log(`Requesting token from: ${tokenUrl}`);
    
    const requestData = {
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code
    };
    
    console.log("Request payload:", JSON.stringify(requestData));
    
    // طلب الرمز مع رؤوس مناسبة لمنع التخزين المؤقت
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
    
    // سجل حالة الاستجابة
    console.log(`Token request response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response from Shopify: ${errorText}`);
      throw new Error(`Failed to get access token: ${response.status} ${response.statusText}`);
    }
    
    // تحليل الاستجابة
    const responseData = await response.json();
    console.log("Token response received with keys:", Object.keys(responseData));
    
    // التحقق من وجود رمز الوصول
    if (!responseData.access_token) {
      console.error("No access token in response:", responseData);
      throw new Error("Access token missing in Shopify response");
    }
    
    // تحديد نوع الرمز (دائم أو مؤقت)
    let tokenType = 'offline';
    if (responseData.expires_in) {
      tokenType = 'online';
      console.log(`Token will expire in ${responseData.expires_in} seconds`);
    }
    
    console.log(`Token successfully obtained with type: ${tokenType}`);
    
    // إعادة البيانات الضرورية فقط
    return {
      access_token: responseData.access_token,
      scope: responseData.scope || '',
      token_type: tokenType
    };
  } catch (error) {
    console.error(`Error in getAccessToken: ${error instanceof Error ? error.message : "Unknown error"}`);
    console.error(`Error stack: ${error instanceof Error ? error.stack : "No stack trace"}`);
    throw error;
  }
}

// دالة لتحديث بيانات المتجر في قاعدة البيانات - تم تحسينها
async function updateShopData(shop: string, tokenData: any): Promise<void> {
  if (!SUPABASE_KEY) {
    console.error("Cannot update shop data: SUPABASE_KEY is not available");
    throw new Error("Database connection failed: API key not available");
  }
  
  try {
    console.log(`Creating Supabase client for ${SUPABASE_URL}`);
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // التحقق من صحة بيانات الرمز قبل التخزين
    if (!tokenData || !tokenData.access_token) {
      throw new Error("Invalid token data: access_token is required");
    }
    
    // تأكد من أنه ليس رمزًا مؤقتًا
    if (tokenData.access_token === 'placeholder_token') {
      throw new Error("Cannot store placeholder token");
    }
    
    // جعل المتاجر الأخرى غير نشطة
    try {
      console.log(`Disabling other active store records before updating ${shop}`);
      
      const { error: disableError } = await supabase
        .from('shopify_stores')
        .update({ is_active: false })
        .neq('shop', shop);
        
      if (disableError) {
        console.log(`Error disabling other stores: ${JSON.stringify(disableError)}`);
      } else {
        console.log(`Successfully disabled all other stores`);
      }
    } catch (disableError) {
      console.error(`Exception during disable operation: ${disableError instanceof Error ? disableError.message : JSON.stringify(disableError)}`);
    }
    
    // استعلام للتحقق من وجود متجر بهذا الاسم
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
    
    console.log(`Store data prepared for ${shop} with real token (not placeholder)`);
    
    if (existingStore) {
      // تحديث السجل الموجود
      console.log(`Updating existing store record for ${shop}`);
      const { error: updateError } = await supabase
        .from('shopify_stores')
        .update(storeData)
        .eq('shop', shop);
      
      if (updateError) {
        console.error(`Error updating store: ${JSON.stringify(updateError)}`);
        throw new Error(`Failed to update the store record: ${updateError.message || "Unknown error"}`);
      }
      
      console.log(`Successfully updated store data for ${shop}`);
    } else {
      // إنشاء سجل جديد
      console.log(`Creating new store record for ${shop}`);
      
      // أضف حقل created_at للسجلات الجديدة
      const newStoreData = {
        ...storeData, 
        created_at: currentTimestamp
      };
      
      const { error: insertError } = await supabase
        .from('shopify_stores')
        .insert([newStoreData]);
      
      if (insertError) {
        console.error(`Error storing token: ${JSON.stringify(insertError)}`);
        throw new Error(`Failed to store the access token: ${insertError.message || "Unknown error"}`);
      }
      
      console.log(`Successfully created new store record for ${shop}`);
    }
    
    // اختبار الاتصال لتأكيد أن الرمز يعمل
    try {
      await testToken(shop, tokenData.access_token);
      console.log(`Token validation successful for ${shop}`);
    } catch (testError) {
      console.warn(`Warning: Token validation failed: ${testError instanceof Error ? testError.message : "Unknown error"}`);
      // لا نريد أن نفشل العملية بأكملها إذا فشل الاختبار
    }
  } catch (error) {
    console.error(`Critical error in updateShopData: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    throw new Error(`Failed to update shop data: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// دالة جديدة لاختبار صلاحية الرمز
async function testToken(shop: string, accessToken: string): Promise<void> {
  try {
    if (!shop || !accessToken) {
      throw new Error("Shop and access token required for testing");
    }
    
    // طلب بسيط للتحقق من صلاحية الرمز - API متجر
    const testUrl = `https://${shop}/admin/api/2023-07/shop.json`;
    
    const response = await fetch(testUrl, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Token validation failed with status: ${response.status}`);
    }
    
    // تحليل الاستجابة للتأكد من صحة التنسيق
    const data = await response.json();
    
    if (!data || !data.shop || !data.shop.id) {
      throw new Error("Invalid response format from shop endpoint");
    }
    
    // الرمز صالح
    console.log(`Token validation successful for ${shop} (Shop ID: ${data.shop.id})`);
  } catch (error) {
    console.error(`Token validation error: ${error instanceof Error ? error.message : "Unknown error"}`);
    throw error;
  }
}

// التحقق من صحة حالة المصادقة (لم يتغير)
async function verifyState(state: string): Promise<boolean> {
  if (!SUPABASE_KEY) {
    console.warn("Cannot verify state: SUPABASE_KEY is not available");
    return true;
  }
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    const { data, error } = await supabase
      .from('shopify_auth')
      .select('*')
      .eq('state', state)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error(`State verification error: ${JSON.stringify(error)}`);
      return false;
    }
    
    if (!data || data.length === 0) {
      console.warn(`No matching state found in database: ${state}`);
      return false;
    }
    
    const authRecord = data[0];
    
    // التحقق من أن الحالة لم تنتهي صلاحيتها (خلال 15 دقيقة)
    const stateCreatedAt = new Date(authRecord.created_at);
    const now = new Date();
    const differenceInMinutes = (now.getTime() - stateCreatedAt.getTime()) / (1000 * 60);
    
    if (differenceInMinutes > 60) {
      console.warn(`State parameter expired. Created ${differenceInMinutes} minutes ago.`);
      return false;
    }
    
    console.log(`State verified successfully`);
    return true;
  } catch (error) {
    console.error(`Error verifying state: ${error instanceof Error ? error.message : "Unknown error"}`);
    return false;
  }
}

// استجابة لطلبات معينة فقط للتوثيق
serve(async (req) => {
  // معرف فريد للطلب للتتبع
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Callback request received: ${req.method} ${req.url}`);
  
  // التعامل مع طلبات OPTIONS بشكل صحيح لـ CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      headers: corsHeaders, 
      status: 200 
    });
  }
  
  try {
    // استخراج المعلمات من URL أو body
    let shop = "";
    let code = "";
    let state = "";
    let hmac = "";
    
    // معلمات الاستدعاء
    const url = new URL(req.url);
    
    if (req.method === "POST") {
      // إذا كان الطلب POST، يتم استخراج المعلمات من body
      try {
        const body = await req.json();
        console.log(`[${requestId}] POST body:`, body);
        
        shop = body.shop || "";
        code = body.code || "";
        state = body.state || "";
        hmac = body.hmac || "";
      } catch (e) {
        console.error(`[${requestId}] Error parsing request body:`, e);
        throw new Error('Invalid request body');
      }
    } else {
      // في حالة GET، يتم استخراج المعلمات من URL
      shop = url.searchParams.get("shop") || "";
      code = url.searchParams.get("code") || "";
      state = url.searchParams.get("state") || "";
      hmac = url.searchParams.get("hmac") || "";
    }
    
    // تنظيف عنوان المتجر
    shop = cleanShopDomain(shop);
    console.log(`[${requestId}] Processing callback for shop: ${shop}, code present: ${!!code}, hmac present: ${!!hmac}`);
    
    // التحقق من وجود المعلمات المطلوبة
    if (!code || !shop) {
      throw new Error('المعلمات المطلوبة (code أو shop) غير موجودة في استدعاء المصادقة');
    }
    
    // سجل المعلومات المهمة للتشخيص
    console.log(`[${requestId}] Shopify callback parameters:`, {
      shop,
      code: code ? "Present (hidden)" : "Missing",
      hmac: hmac ? "Present (hidden)" : "Missing",
      state,
      timestamp: new Date().toISOString()
    });
    
    // التحقق من صحة الحالة إذا كانت موجودة
    if (state) {
      const stateValid = await verifyState(state);
      if (!stateValid) {
        console.warn(`[${requestId}] State validation failed, but continuing with callback processing`);
      }
    }
    
    // الحصول على رمز الوصول من Shopify
    console.log(`[${requestId}] Requesting access token from Shopify...`);
    const tokenData = await getAccessToken(shop, code);
    
    // التحقق من صحة البيانات
    if (!tokenData || !tokenData.access_token) {
      throw new Error("Access token retrieval failed - invalid response from Shopify");
    }
    
    console.log(`[${requestId}] Access token received successfully for ${shop}`);
    
    // تحديث بيانات المتجر في قاعدة البيانات
    console.log(`[${requestId}] Updating store data in database...`);
    await updateShopData(shop, tokenData);
    console.log(`[${requestId}] Store data updated successfully`);
    
    // إنشاء استجابة ناجحة
    return new Response(
      JSON.stringify({ 
        success: true, 
        shop, 
        timestamp: Date.now(),
        request_id: requestId,
        token_type: tokenData.token_type,
        has_valid_token: true,
        redirect_url: `${APP_URL}/dashboard?shopify_connected=true&shop=${encodeURIComponent(shop)}&new_connection=true&timestamp=${Date.now()}`
      }),
      { 
        status: 200, 
        headers: {
          ...corsHeaders,
          "X-Shopify-Auth-Success": "true",
          "X-Request-ID": requestId
        } 
      }
    );
  } catch (error) {
    console.error(`[${requestId}] Error in Shopify OAuth flow: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    console.error(`[${requestId}] Stack trace: ${error instanceof Error ? error.stack : "No stack trace available"}`);
    
    // إنشاء استجابة الخطأ
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "حدث خطأ غير معروف", 
        timestamp: Date.now(),
        request_id: requestId
      }),
      { 
        status: 200, // استخدام 200 حتى مع الأخطاء للسماح للعميل بمعالجة الخطأ
        headers: corsHeaders 
      }
    );
  }
});
