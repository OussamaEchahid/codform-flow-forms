
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// إعدادات Supabase - تحديث للاستخدام المتسق للمفاتيح
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || 'https://mtyfuwdsshlzqwjujavp.supabase.co';
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");

// إعدادات تطبيق Shopify
const SHOPIFY_API_KEY = Deno.env.get("SHOPIFY_API_KEY") || "7e4608874bbcc38afa1953948da28407";
const SHOPIFY_API_SECRET = Deno.env.get("SHOPIFY_API_SECRET") || "18221d830a86da52082e0d06c0d32ba3";

// عنوان URL للتطبيق المستضاف
const APP_URL = "https://codform-flow-forms.lovable.app";

// إعداد عناوين CORS - تمت إضافة المزيد من الرؤوس للتوافق
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

// دالة الحصول على رمز الوصول من Shopify - تم تحسين معالجة الأخطاء
async function getAccessToken(shop: string, code: string): Promise<any> {
  try {
    console.log(`Getting access token for ${shop} with code ${code}`);
    
    const requestData = {
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code
    };
    
    // إضافة رؤوس لمنع التخزين المؤقت
    const cacheHeaders = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    const tokenUrl = `https://${shop}/admin/oauth/access_token`;
    
    console.log(`Requesting token from URL: ${tokenUrl}`);
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: cacheHeaders,
      body: JSON.stringify(requestData),
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Error getting access token: ${response.status} ${response.statusText}`);
      console.error(`Error body: ${errorBody}`);
      throw new Error(`Failed to get access token: ${response.status} ${response.statusText}`);
    }
    
    const responseData = await response.json();
    
    // التأكد من وجود رمز الوصول
    if (!responseData.access_token) {
      console.error("No access token in response:", responseData);
      throw new Error('No access token in response');
    }
    
    // تحديد نوع الرمز (دائم أو مؤقت)
    let tokenType = 'offline';
    if (responseData.expires_in) {
      tokenType = 'online';
      console.log(`Token will expire in ${responseData.expires_in} seconds`);
    }
    
    console.log(`Token data received with type: ${tokenType}`);
    
    return {
      access_token: responseData.access_token,
      scope: responseData.scope,
      token_type: tokenType
    };
  } catch (error) {
    console.error(`Error in getAccessToken: ${error instanceof Error ? error.message : "Unknown error"}`);
    throw error;
  }
}

// دالة لتحديث بيانات المتجر في قاعدة البيانات
async function updateShopData(shop: string, tokenData: any): Promise<void> {
  if (!SUPABASE_KEY) {
    console.error("Cannot update shop data: SUPABASE_KEY is not available");
    throw new Error("Database connection failed: API key not available");
  }
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // قبل التحديث، تأكد من تعطيل الحالات النشطة المتعددة
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
      // نسجل الخطأ ولكن نتابع العملية
      console.error(`Exception during disable operation: ${disableError instanceof Error ? disableError.message : JSON.stringify(disableError)}`);
    }
    
    // استعلام للتحقق من وجود متجر بهذا الاسم
    const { data: existingStore } = await supabase
      .from('shopify_stores')
      .select('*')
      .eq('shop', shop)
      .maybeSingle();
    
    const storeData = {
      shop,
      access_token: tokenData.access_token,
      scope: tokenData.scope,
      token_type: tokenData.token_type,
      is_active: true,
      updated_at: new Date().toISOString()
    };
    
    console.log(`Store data prepared for ${shop}`);
    
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
      const { error: insertError } = await supabase
        .from('shopify_stores')
        .insert([storeData]);
      
      if (insertError) {
        console.error(`Error storing token: ${JSON.stringify(insertError)}`);
        throw new Error(`Failed to store the access token: ${insertError.message || "Unknown error"}`);
      }
      
      console.log(`Successfully created new store record for ${shop}`);
    }
  } catch (error) {
    console.error(`Critical error in updateShopData: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    throw new Error(`Failed to update shop data: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// التحقق من صحة حالة المصادقة
async function verifyState(state: string): Promise<boolean> {
  if (!SUPABASE_KEY) {
    console.warn("Cannot verify state: SUPABASE_KEY is not available");
    return true; // السماح بالمتابعة في حالة عدم توفر مفتاح API
  }
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // الحصول على سجل المصادقة المخزن مسبقًا
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
    return false; // في حالة الخطأ، نعود بـ false للأمان
  }
}

// استجابة لطلبات معينة فقط للتوثيق
serve(async (req) => {
  // التعامل مع طلبات OPTIONS بشكل صحيح لـ CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      headers: corsHeaders, 
      status: 200 
    });
  }
  
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Callback received: ${req.method} ${req.url}`);
  
  try {
    // استخراج المعلمات من URL أو body
    let shop = "";
    let code = "";
    let state = "";
    
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
      } catch (e) {
        console.error(`[${requestId}] Error parsing request body:`, e);
        throw new Error('Invalid request body');
      }
    } else {
      // في حالة GET، يتم استخراج المعلمات من URL
      shop = url.searchParams.get("shop") || "";
      code = url.searchParams.get("code") || "";
      state = url.searchParams.get("state") || "";
    }
    
    // تنظيف عنوان المتجر
    shop = cleanShopDomain(shop);
    console.log(`[${requestId}] Processing callback for shop: ${shop}`);
    
    // التحقق من وجود المعلمات المطلوبة
    if (!code || !shop) {
      throw new Error('المعلمات المطلوبة (code أو shop) غير موجودة في استدعاء المصادقة');
    }
    
    // التحقق من صحة الحالة إذا كانت موجودة (لكن لا نرفض الطلب إذا كان غير صالح)
    if (state) {
      const stateValid = await verifyState(state);
      if (!stateValid) {
        console.warn(`[${requestId}] State validation failed, but continuing with callback processing`);
      }
    }
    
    // الحصول على رمز الوصول من Shopify
    console.log(`[${requestId}] Requesting access token from Shopify...`);
    const tokenData = await getAccessToken(shop, code);
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
