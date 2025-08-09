
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// إعدادات Supabase
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || 'https://trlklwixfeaexhydzaue.supabase.co';
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M';

console.log("Initializing update-shopify-token function with Supabase:", SUPABASE_URL);

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

// دالة اختبار الرمز للتأكد من صحته
async function testToken(shop: string, token: string): Promise<boolean> {
  try {
    console.log(`Testing token for shop: ${shop}`);
    
    // بناء عنوان URL لاختبار الرمز
    const testUrl = `https://${shop}/admin/api/2025-04/shop.json`;
    
    // إجراء طلب باستخدام الرمز
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    // التحقق من الاستجابة
    if (!response.ok) {
      const responseText = await response.text();
      console.error(`Token test failed. Status: ${response.status}, Response: ${responseText}`);
      return false;
    }
    
    // تحليل الاستجابة للتأكد من صحة البنية
    const data = await response.json();
    
    if (!data || !data.shop || !data.shop.id) {
      console.error('Invalid response format from shop endpoint');
      return false;
    }
    
    console.log(`Token test successful for shop ID: ${data.shop.id}`);
    return true;
  } catch (error) {
    console.error('Error testing token:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

// دالة تحديث رمز الوصول في قاعدة البيانات
async function updateTokenInDatabase(shop: string, token: string): Promise<boolean> {
  try {
    console.log(`Updating token in database for shop: ${shop}`);
    
    if (!SUPABASE_KEY) {
      throw new Error("Cannot update token: SUPABASE_KEY is not available");
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // التحقق من وجود المتجر أولاً
    const { data: existingShop, error: queryError } = await supabase
      .from('shopify_stores')
      .select('*')
      .eq('shop', shop)
      .limit(1);
    
    if (queryError) {
      console.error('Error querying shop:', queryError);
      throw new Error(`Database query error: ${queryError.message}`);
    }
    
    const currentTimestamp = new Date().toISOString();
    
    // إذا كان المتجر موجودًا، قم بتحديثه
    if (existingShop && existingShop.length > 0) {
      const { error: updateError } = await supabase
        .from('shopify_stores')
        .update({
          access_token: token,
          updated_at: currentTimestamp,
          is_active: true
        })
        .eq('shop', shop);
      
      if (updateError) {
        console.error('Error updating token:', updateError);
        throw new Error(`Database update error: ${updateError.message}`);
      }
      
      console.log(`Token updated successfully for existing shop: ${shop}`);
      return true;
    } else {
      // إذا لم يكن المتجر موجودًا، قم بإنشاء سجل جديد
      const { error: insertError } = await supabase
        .from('shopify_stores')
        .insert([{
          shop: shop,
          access_token: token,
          created_at: currentTimestamp,
          updated_at: currentTimestamp,
          is_active: true,
          token_type: 'offline'
        }]);
      
      if (insertError) {
        console.error('Error inserting new shop record:', insertError);
        throw new Error(`Database insert error: ${insertError.message}`);
      }
      
      console.log(`New shop record created with token: ${shop}`);
      return true;
    }
  } catch (error) {
    console.error('Error updating token in database:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// خدمة الدالة لمعالجة الطلبات
serve(async (req) => {
  // معرف فريد للطلب للتتبع
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Token update request received: ${req.method} ${req.url}`);
  
  // التعامل مع طلبات OPTIONS بشكل صحيح لـ CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      headers: corsHeaders, 
      status: 200 
    });
  }
  
  try {
    if (req.method !== "POST") {
      throw new Error("Method not allowed. Use POST.");
    }
    
    // استخراج البيانات من body
    const requestData = await req.json();
    console.log(`[${requestId}] Request data:`, { 
      shop: requestData.shop, 
      hasToken: !!requestData.token 
    });
    
    // التحقق من وجود المعلمات المطلوبة
    if (!requestData.shop || !requestData.token) {
      throw new Error("Missing required parameters: shop and token");
    }
    
    // تنظيف عنوان المتجر
    const shop = cleanShopDomain(requestData.shop);
    const token = requestData.token;
    
    // التحقق من أن الرمز ليس placeholder_token
    if (token === 'placeholder_token') {
      throw new Error("Cannot update to placeholder token");
    }
    
    // اختبار صحة الرمز
    console.log(`[${requestId}] Testing token before updating database...`);
    const isValid = await testToken(shop, token);
    
    if (!isValid) {
      throw new Error("Token validation failed. The token appears to be invalid or expired.");
    }
    
    // تحديث الرمز في قاعدة البيانات
    console.log(`[${requestId}] Token is valid, updating in database...`);
    await updateTokenInDatabase(shop, token);
    
    // إعادة الاستجابة الناجحة
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Token updated successfully", 
        shop, 
        timestamp: Date.now(),
        request_id: requestId
      }),
      { 
        status: 200, 
        headers: corsHeaders 
      }
    );
  } catch (error) {
    // التعامل مع الأخطاء
    console.error(`[${requestId}] Error processing token update:`, error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error", 
        timestamp: Date.now(),
        request_id: requestId
      }),
      { 
        status: 200, // استخدام 200 حتى مع الأخطاء لتمكين العميل من معالجتها
        headers: corsHeaders 
      }
    );
  }
});
