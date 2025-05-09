
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// إعدادات CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// معلومات Supabase
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

// أنواع البيانات
interface PagePublishRequest {
  shop: string;
  accessToken: string;
  title?: string;
  content?: string;
  metaobjects?: any;
  pageId?: string;
  formId?: string;
  useProductMethod?: boolean; // استخدام طريقة المنتج بدلاً من صفحة عادية
  debugMode?: boolean; // وضع التصحيح
  ignoreMetaobjectErrors?: boolean; // تجاهل أخطاء metaobject
  debugInfo?: any; // معلومات تصحيح إضافية
}

// أداة مساعدة للتنفيذ مع إعادة المحاولة
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError;
  let response;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = Math.min(100 * Math.pow(2, attempt), 2000);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries}, waiting ${delay}ms before retry`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      response = await fetch(url, options);
      
      // إعادة المحاولة فقط على أخطاء الخادم (5xx)
      if (response.status >= 500 && response.status < 600 && attempt < maxRetries - 1) {
        console.log(`Server error: ${response.status}, will retry`);
        continue;
      }
      
      return response;
    } catch (error) {
      console.error(`Fetch attempt ${attempt + 1} failed:`, error);
      lastError = error;
      
      // إعادة المحاولة فقط على أخطاء الشبكة
      if (error.name !== 'TypeError' && error.name !== 'NetworkError') {
        throw error;
      }
    }
  }
  
  throw lastError || new Error('All fetch attempts failed');
}

/**
 * نشر محتوى من خلال وصف المنتج كبديل عن صفحة عادية (لتجنب مشاكل الصلاحيات)
 */
async function publishViaProductDescription(
  shop: string,
  accessToken: string,
  title: string,
  content: string,
  formId: string,
  debugMode: boolean
): Promise<any> {
  console.log(`Publishing content via product description - shop: ${shop}, title: ${title}, formId: ${formId}`);
  
  try {
    // 1. إنشاء منتج جديد (أو تحديث موجود) مع المحتوى
    const productData = {
      product: {
        title: `CODFORM Landing: ${title || 'Form Landing Page'}`,
        body_html: content,
        vendor: "CODFORM",
        product_type: "Form Landing Page",
        status: "active", // يجعل المنتج نشطًا
        tags: `codform, form-landing-page, form-${formId}`,
        variants: [
          {
            price: "0.00", // سعر صفر
            inventory_quantity: 0, // لا مخزون
            inventory_management: "shopify", // إدارة مخزون Shopify
          }
        ],
        metafields: [
          {
            namespace: "codform",
            key: "form_id",
            value: formId,
            type: "single_line_text_field"
          }
        ]
      }
    };
    
    // البحث عن منتج موجود أولاً
    const searchUrl = `https://${shop}/admin/api/2023-10/products.json?title=${encodeURIComponent(`CODFORM Landing: ${title || 'Form Landing Page'}`)}`;
    
    const searchResponse = await fetchWithRetry(searchUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken
      }
    });
    
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      throw new Error(`Error searching for product: ${searchResponse.status} - ${errorText}`);
    }
    
    const searchData = await searchResponse.json();
    const existingProduct = searchData.products && searchData.products.length > 0 
      ? searchData.products[0] 
      : null;
    
    let productId;
    let responseData;
    
    if (existingProduct) {
      // تحديث منتج موجود
      productId = existingProduct.id;
      console.log(`Updating existing product: ${productId}`);
      
      const updateUrl = `https://${shop}/admin/api/2023-10/products/${productId}.json`;
      const updateResponse = await fetchWithRetry(updateUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken
        },
        body: JSON.stringify(productData)
      });
      
      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        throw new Error(`Error updating product: ${updateResponse.status} - ${errorText}`);
      }
      
      responseData = await updateResponse.json();
    } else {
      // إنشاء منتج جديد
      console.log("Creating new product for landing page");
      
      const createUrl = `https://${shop}/admin/api/2023-10/products.json`;
      const createResponse = await fetchWithRetry(createUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken
        },
        body: JSON.stringify(productData)
      });
      
      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Error creating product: ${createResponse.status} - ${errorText}`);
      }
      
      responseData = await createResponse.json();
      productId = responseData.product.id;
    }
    
    // إنشاء رابط المنتج
    const productUrl = `https://${shop}/products/${responseData.product.handle}`;
    console.log(`Product published successfully, URL: ${productUrl}`);
    
    // إنشاء البيانات المرجعة
    return {
      success: true,
      type: "product",
      title: responseData.product.title,
      id: productId,
      handle: responseData.product.handle,
      url: productUrl,
      published_at: responseData.product.published_at,
      debug: debugMode ? {
        method: "product",
        productId,
        formId
      } : undefined
    };
    
  } catch (error) {
    console.error("Error publishing via product description:", error);
    throw error;
  }
}

// وظيفة Edge Function الرئيسية
serve(async (req) => {
  // التعامل مع طلبات CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // استخراج بيانات الطلب
    const requestData: PagePublishRequest = await req.json();
    const { 
      shop, 
      accessToken, 
      title, 
      content, 
      metaobjects, 
      pageId,
      formId,
      useProductMethod = false,
      debugMode = false,
      ignoreMetaobjectErrors = false,
      debugInfo
    } = requestData;
    
    console.log(`Publishing page - shop: ${shop}, title: ${title}, useProductMethod: ${useProductMethod}`);
    
    // التحقق من البيانات المطلوبة
    if (!shop || !accessToken) {
      throw new Error("Shop and accessToken are required");
    }
    
    // إضافة رقم عشوائي للتتبع
    const requestId = `req_publish_${Math.random().toString(36).substring(2, 10)}`;
    console.log(`[${requestId}] Processing publish request`);
    
    // إذا كان وضع المنتج مفعل، استخدم طريقة المنتج
    if (useProductMethod) {
      console.log(`[${requestId}] Using product method as requested`);
      const productResult = await publishViaProductDescription(
        shop, 
        accessToken, 
        title || '', 
        content || '', 
        formId || '', 
        debugMode
      );
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "تم نشر الصفحة بنجاح (وضع المنتج)",
          data: productResult,
          debug: debugMode ? {
            mode: "product",
            strategy: "fallback",
            metaobjectEnabled: false,
            requestId,
            originalDebugInfo: debugInfo
          } : undefined
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // طريقة النشر العادية
    console.log(`[${requestId}] Using standard page publishing method`);
    
    // محاولة النشر باستخدام Metaobject
    try {
      // هنا يمكن إضافة منطق النشر باستخدام Metaobject
      
      // ارجع رسالة خطأ لإجبار استخدام الطريقة البديلة
      throw new Error("Metaobject publishing not fully implemented");
      
    } catch (error) {
      console.warn(`[${requestId}] Metaobject publishing failed, falling back to product method:`, error);
      
      // استخدام طريقة المنتج كبديل
      const productResult = await publishViaProductDescription(
        shop, 
        accessToken, 
        title || '', 
        content || '', 
        formId || '', 
        debugMode
      );
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "تم نشر الصفحة بنجاح (وضع المنتج كبديل)",
          data: productResult,
          originalError: error.message,
          debug: debugMode ? {
            mode: "product",
            strategy: "auto_fallback",
            error: error.message,
            metaobjectEnabled: false,
            requestId,
            originalDebugInfo: debugInfo
          } : undefined
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
  } catch (error) {
    console.error("Error in shopify-publish-page:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error occurred",
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
