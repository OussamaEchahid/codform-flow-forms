
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

// دالة الحصول على رمز الوصول من Shopify
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
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Timestamp': `${timestamp}`,
      'X-Nonce': nonce
    };
    
    const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...cacheHeaders
      },
      body: JSON.stringify(requestData),
      cache: 'no-store' // منع التخزين المؤقت بشكل صريح
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Error getting access token: ${response.status} ${response.statusText}`);
      console.error(`Error body: ${errorBody}`);
      
      throw new Error(`Failed to get access token: ${response.status} ${response.statusText}. Response: ${errorBody}`);
    }
    
    const data = await response.json();
    
    // التأكد من وجود رمز الوصول
    if (!data.access_token) {
      throw new Error('No access token in response');
    }
    
    // تحديد نوع الرمز (دائم أو مؤقت)
    let tokenType = 'offline';
    if (data.expires_in) {
      tokenType = 'online';
      console.log(`Token will expire in ${data.expires_in} seconds`);
    }
    
    // تحديد تاريخ انتهاء الصلاحية، أو إشارة إلى أنه دائم
    const expiresAt = data.expires_in 
      ? new Date(Date.now() + (data.expires_in * 1000)).toISOString() 
      : 'Using offline token (permanent)';
    
    console.log(`Token data received: ${JSON.stringify({
      access_token: "REDACTED",
      scope: data.scope,
      token_type: tokenType,
      expires_at: expiresAt
    })}`);
    
    return {
      access_token: data.access_token,
      scope: data.scope,
      token_type: tokenType
    };
  } catch (error) {
    console.error(`Error in getAccessToken: ${error}`);
    throw error;
  }
}

// دالة لتحديث بيانات المتجر في قاعدة البيانات
async function updateShopData(shop: string, tokenData: any): Promise<void> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    console.log(`Current user: ${await getCurrentUser(supabase)}`);
    
    // تعطيل جميع المتاجر السابقة في حالة كانت نشطة
    const { error: disableError } = await supabase
      .from('shopify_stores')
      .update({ is_active: false })
      .not('shop', 'eq', shop); // لا تقم بتعديل المتجر الحالي
      
    if (disableError) {
      console.log(`Error disabling other stores: ${JSON.stringify(disableError)}`);
    } else {
      console.log(`Successfully disabled all stores`);
    }
    
    // حذف جميع الإدخالات السابقة للمتجر الحالي، إذا كان ذلك ضروريًا
    try {
      const { error: deleteError } = await supabase
        .from('shopify_stores')
        .delete()
        .eq('shop', shop);
        
      if (deleteError) {
        // إذا فشل الحذف بسبب قيود المفتاح الأجنبي، نقوم بالتحديث بدلاً من ذلك
        console.log(`Error deleting existing tokens: ${JSON.stringify(deleteError)}`);
      }
    } catch (deleteError) {
      console.log(`Exception during delete: ${JSON.stringify(deleteError)}`);
    }
    
    // تخزين بيانات الرمز الجديد
    const { data: insertData, error: insertError } = await supabase
      .from('shopify_stores')
      .insert({
        shop,
        access_token: tokenData.access_token,
        scope: tokenData.scope,
        token_type: tokenData.token_type,
        is_active: true,
        updated_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.error(`Error storing token: ${JSON.stringify(insertError)}`);
      throw new Error(`Failed to store the access token: ${insertError.message}`);
    }
    
    console.log(`Successfully updated shop data for ${shop}`);
  } catch (error) {
    console.error(`Error in updateShopData: ${error}`);
    throw new Error(`Failed to update shop data: ${error.message}`);
  }
}

// الحصول على المستخدم الحالي
async function getCurrentUser(supabase: any): Promise<string> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return "No authenticated user";
    }
    
    return `User: ${user.id}`;
  } catch (error) {
    return `Error getting user: ${error.message}`;
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
      .eq('shop', shop)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) {
      console.error(`State verification error: ${JSON.stringify(error)}`);
      throw new Error(`Invalid or expired state parameter: ${error?.message || 'No auth record found'}`);
    }
    
    // التحقق من أن الحالة لم تنتهي صلاحيتها (خلال 15 دقيقة)
    const stateCreatedAt = new Date(data.created_at);
    const now = new Date();
    const differenceInMinutes = (now.getTime() - stateCreatedAt.getTime()) / (1000 * 60);
    
    if (differenceInMinutes > 15) {
      throw new Error('State parameter expired. Please try again.');
    }
    
    console.log(`State verified successfully: ${JSON.stringify(data)}`);
    return data;
  } catch (error) {
    console.error(`Error verifying state: ${error}`);
    throw error;
  }
}

serve(async (req) => {
  // معالجة طلبات CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }
  
  const timestamp = new Date().toISOString();
  console.log(`Callback received: ${JSON.stringify({ 
    url: req.url, 
    method: req.method, 
    headers: Object.fromEntries(req.headers.entries()),
    timestamp 
  })}`);
  
  try {
    // استخراج المعلمات من URL أو body
    let shop = "";
    let code = "";
    let hmac = "";
    let state = "";
    let forceUpdate = false;
    
    // معلمات الاستدعاء
    const url = new URL(req.url);
    const callbackParams = {
      shop: url.searchParams.get("shop") || "",
      hmac: url.searchParams.get("hmac") ? "present" : "missing",
      code: url.searchParams.get("code") ? "present" : "missing",
      state: url.searchParams.get("state"),
      timestamp: Date.now(),
      isPopup: url.searchParams.get("popup") === "true",
      fullUrl: req.url
    };
    
    console.log(`Callback params: ${JSON.stringify(callbackParams)}`);
    
    if (req.method === "POST") {
      // إذا كان الطلب POST، يتم استخراج المعلمات من body
      try {
        const body = await req.json();
        console.log(`POST body: ${JSON.stringify(body)}`);
        
        shop = body.shop || "";
        code = body.code || "";
        hmac = body.hmac || "";
        state = body.state || "";
        forceUpdate = body.forceUpdate === true;
        
        console.log(`Using values from body: ${JSON.stringify({ shop, code, hmac, state })}`);
      } catch (e) {
        console.error(`Error parsing request body: ${e}`);
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
    console.log(`Cleaned shop domain for callback: ${shop}`);
    
    // التحقق من وجود المعلمات المطلوبة
    if (!code || !hmac || !shop || !state) {
      throw new Error('المعلمات المطلوبة غير موجودة في استدعاء المصادقة');
    }
    
    // التحقق من حالة المصادقة
    await verifyState(state, shop);
    
    // الحصول على رمز الوصول من Shopify
    const tokenData = await getAccessToken(shop, code);
    
    // تحديث بيانات المتجر في قاعدة البيانات
    await updateShopData(shop, tokenData);
    
    // إنشاء استجابة ناجحة
    return new Response(
      JSON.stringify({ 
        success: true, 
        shop, 
        timestamp: Date.now(),
        token_type: tokenData.token_type,
        redirect_url: `${APP_URL}/dashboard?shopify_connected=true&shop=${encodeURIComponent(shop)}&new_connection=true&timestamp=${Date.now()}`
      }),
      { 
        status: 200, 
        headers: {
          ...corsHeaders,
          "X-Shopify-Auth-Success": "true"
        } 
      }
    );
  } catch (error) {
    console.error(`Error in Shopify OAuth flow: ${error}`);
    
    // إنشاء استجابة الخطأ
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "حدث خطأ غير معروف", 
        timestamp: Date.now() 
      }),
      { 
        status: 200, // استخدام 200 حتى مع الأخطاء للسماح للعميل بمعالجة الخطأ
        headers: corsHeaders 
      }
    );
  }
});
