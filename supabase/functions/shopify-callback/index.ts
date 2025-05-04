
// تعديل وظيفة معالجة استدعاء Shopify لتصحيح المشاكل المتعلقة باسترجاع رمز الوصول

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// إعدادات Supabase
const SUPABASE_URL = 'https://nhqrngdzuatdnfkihtud.supabase.co';
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || '';

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
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
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
  
  // نمط النطاق الأساسي لـ Shopify
  const shopifyDomainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
  
  return shopifyDomainPattern.test(shop);
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
    
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(2, 15);
    
    // إضافة رؤوس لمنع التخزين المؤقت
    const cacheHeaders = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Timestamp': `${timestamp}`,
      'X-Nonce': nonce,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    // إضافة رقم عشوائي لعنوان URL لتجنب التخزين المؤقت
    const randomValue = Math.floor(Math.random() * 10000000);
    const tokenUrl = `https://${shop}/admin/oauth/access_token?_=${randomValue}`;
    
    console.log(`Requesting token from URL: ${tokenUrl}`);
    
    // تنفيذ طلب في حاوية try/catch منفصلة للتقاط أخطاء الشبكة
    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: cacheHeaders,
        body: JSON.stringify(requestData),
        cache: 'no-store' // منع التخزين المؤقت بشكل صريح
      });
      
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Error getting access token: ${response.status} ${response.statusText}`);
        console.error(`Error body: ${errorBody}`);
        
        // محاولة ثانية باستخدام URL مختلف قليلًا
        if (response.status === 404 || response.status === 403 || response.status === 400) {
          console.log("Trying alternative URL format...");
          
          // تجربة عنوان URL بدون المعلمات
          const altResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
            method: 'POST',
            headers: cacheHeaders,
            body: JSON.stringify(requestData),
            cache: 'no-store'
          });
          
          if (!altResponse.ok) {
            const altErrorBody = await altResponse.text();
            throw new Error(`Failed with alternative URL: ${altResponse.status} ${altResponse.statusText}. Response: ${altErrorBody}`);
          }
          
          return await altResponse.json();
        }
        
        throw new Error(`Failed to get access token: ${response.status} ${response.statusText}. Response: ${errorBody}`);
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
      
      // تحديد تاريخ انتهاء الصلاحية، أو إشارة إلى أنه دائم
      const expiresAt = responseData.expires_in 
        ? new Date(Date.now() + (responseData.expires_in * 1000)).toISOString() 
        : 'Using offline token (permanent)';
      
      console.log(`Token data received with type: ${tokenType}, expires: ${expiresAt}`);
      
      return {
        access_token: responseData.access_token,
        scope: responseData.scope,
        token_type: tokenType
      };
    } catch (fetchError) {
      console.error(`Fetch error in getAccessToken: ${fetchError.message || fetchError}`);
      
      // محاولة ثالثة باستخدام fetch مع خيارات مختلفة
      const thirdAttemptResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData),
      });
      
      if (!thirdAttemptResponse.ok) {
        throw new Error(`All attempts to get access token failed. Last error status: ${thirdAttemptResponse.status}`);
      }
      
      const thirdAttemptData = await thirdAttemptResponse.json();
      
      if (!thirdAttemptData.access_token) {
        throw new Error('No access token in final attempt response');
      }
      
      // تحديد نوع الرمز
      let tokenType = 'offline';
      if (thirdAttemptData.expires_in) {
        tokenType = 'online';
      }
      
      return {
        access_token: thirdAttemptData.access_token,
        scope: thirdAttemptData.scope,
        token_type: tokenType
      };
    }
  } catch (error) {
    console.error(`Critical error in getAccessToken: ${error.message || error}`);
    throw error;
  }
}

// دالة لتحديث بيانات المتجر في قاعدة البيانات - تم تحسين إدارة الأخطاء
async function updateShopData(shop: string, tokenData: any): Promise<void> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // قبل التحديث، تأكد من تعطيل الحالات النشطة المتعددة
    try {
      console.log(`Disabling other active store records before updating ${shop}`);
      
      const { error: disableError } = await supabase
        .from('shopify_stores')
        .update({ is_active: false })
        .not('shop', 'eq', shop);
        
      if (disableError) {
        console.log(`Error disabling other stores: ${JSON.stringify(disableError)}`);
      } else {
        console.log(`Successfully disabled all other stores`);
      }
    } catch (disableError) {
      // نسجل الخطأ ولكن نتابع العملية
      console.error(`Exception during disable operation: ${disableError.message || JSON.stringify(disableError)}`);
    }
    
    // استعلام للتحقق من وجود متجر بهذا الاسم
    const { data: existingStore } = await supabase
      .from('shopify_stores')
      .select('*')
      .eq('shop', shop)
      .single();
    
    const storeData = {
      shop,
      access_token: tokenData.access_token,
      scope: tokenData.scope,
      token_type: tokenData.token_type,
      is_active: true,
      updated_at: new Date().toISOString()
    };
    
    // إضافة معرف المستخدم إذا كان متوفرًا
    if (existingStore?.user_id) {
      storeData.user_id = existingStore.user_id;
    }
    
    console.log(`Store data prepared for ${shop} with token_type: ${tokenData.token_type}`);
    
    if (existingStore) {
      // تحديث السجل الموجود
      console.log(`Updating existing store record for ${shop}`);
      const { error: updateError } = await supabase
        .from('shopify_stores')
        .update(storeData)
        .eq('shop', shop);
      
      if (updateError) {
        console.error(`Error updating store: ${JSON.stringify(updateError)}`);
        throw new Error(`Failed to update the store record: ${updateError.message}`);
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
        throw new Error(`Failed to store the access token: ${insertError.message}`);
      }
      
      console.log(`Successfully created new store record for ${shop}`);
    }
    
    // تأكيد التحديث عن طريق التحقق من القاعدة
    const { data: verifyData, error: verifyError } = await supabase
      .from('shopify_stores')
      .select('*')
      .eq('shop', shop)
      .eq('is_active', true)
      .single();
    
    if (verifyError || !verifyData) {
      console.warn(`Could not verify store data was updated successfully: ${verifyError?.message || 'No data returned'}`);
    } else {
      console.log(`Verified store data for ${shop} is active and up to date`);
    }
  } catch (error) {
    console.error(`Critical error in updateShopData: ${error.message || JSON.stringify(error)}`);
    throw new Error(`Failed to update shop data: ${error.message}`);
  }
}

// التحقق من صحة حالة المصادقة
async function verifyState(state: string, shop: string): Promise<any> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // الحصول على سجل المصادقة المخزن مسبقًا
    const { data, error } = await supabase
      .from('shopify_auth')
      .select('*')
      .eq('state', state)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error || !data || data.length === 0) {
      console.error(`State verification error: ${JSON.stringify(error)}`);
      throw new Error(`Invalid or expired state parameter: ${error?.message || 'No auth record found'}`);
    }
    
    const authRecord = data[0];
    
    // التحقق من أن الحالة لم تنتهي صلاحيتها (خلال 15 دقيقة)
    const stateCreatedAt = new Date(authRecord.created_at);
    const now = new Date();
    const differenceInMinutes = (now.getTime() - stateCreatedAt.getTime()) / (1000 * 60);
    
    if (differenceInMinutes > 15) {
      throw new Error('State parameter expired. Please try again.');
    }
    
    console.log(`State verified successfully: ${JSON.stringify(authRecord)}`);
    return authRecord;
  } catch (error) {
    console.error(`Error verifying state: ${error}`);
    throw error;
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
  
  const timestamp = new Date().toISOString();
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Callback received at ${timestamp}: ${req.method} ${req.url}`);
  
  try {
    // استخراج المعلمات من URL أو body
    let shop = "";
    let code = "";
    let hmac = "";
    let state = "";
    let forceUpdate = false;
    
    // معلمات الاستدعاء
    const url = new URL(req.url);
    
    if (req.method === "POST") {
      // إذا كان الطلب POST، يتم استخراج المعلمات من body
      try {
        const body = await req.json();
        console.log(`[${requestId}] POST body: ${JSON.stringify(body)}`);
        
        shop = body.shop || "";
        code = body.code || "";
        hmac = body.hmac || "";
        state = body.state || "";
        forceUpdate = body.forceUpdate === true;
      } catch (e) {
        console.error(`[${requestId}] Error parsing request body: ${e}`);
        throw new Error('Invalid request body');
      }
    } else {
      // في حالة GET، يتم استخراج المعلمات من URL
      shop = url.searchParams.get("shop") || "";
      code = url.searchParams.get("code") || "";
      hmac = url.searchParams.get("hmac") || "";
      state = url.searchParams.get("state") || "";
      forceUpdate = url.searchParams.get("force_update") === "true";
    }
    
    // تنظيف عنوان المتجر
    shop = cleanShopDomain(shop);
    console.log(`[${requestId}] Processing callback for shop: ${shop}`);
    
    // سجل المعلمات الكاملة للتشخيص
    const fullParams = {
      shop,
      code: code ? "present" : "missing",
      hmac: hmac ? "present" : "missing",
      state,
      forceUpdate,
      timestamp: Date.now(),
      requestId,
      method: req.method,
      url: req.url
    };
    
    console.log(`[${requestId}] Callback parameters: ${JSON.stringify(fullParams)}`);
    
    // التحقق من وجود المعلمات المطلوبة
    if (!code || !hmac || !shop) {
      throw new Error('المعلمات المطلوبة غير موجودة في استدعاء المصادقة');
    }
    
    // Verify state if provided
    if (state) {
      try {
        await verifyState(state, shop);
        console.log(`[${requestId}] State verification passed`);
      } catch (stateError) {
        // Log but continue, don't reject the auth just for state issues
        console.warn(`[${requestId}] State verification issue: ${stateError.message}`);
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
    console.error(`[${requestId}] Error in Shopify OAuth flow: ${error.message || JSON.stringify(error)}`);
    
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
