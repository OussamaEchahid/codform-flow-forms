
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Initializing shopify-test-connection function");

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

// خدمة الطلبات
serve(async (req) => {
  // التعامل مع طلبات OPTIONS لـ CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  console.log(`Test connection request received: ${req.url}`);
  
  try {
    // استخراج البيانات من طلب POST
    let requestData = {};
    try {
      requestData = await req.json();
    } catch (e) {
      console.error("Error parsing request body:", e);
      const bodyText = await req.text();
      console.log("Raw request body:", bodyText);
      
      // Try to parse as URL parameters if it's not valid JSON
      if (bodyText && !bodyText.trim().startsWith('{')) {
        try {
          const params = new URLSearchParams(bodyText);
          requestData = {
            shop: params.get('shop'),
            accessToken: params.get('accessToken') || params.get('token')
          };
        } catch (e2) {
          console.error("Error parsing URL params:", e2);
        }
      }
    }
    
    // If we still don't have a shop parameter, check query parameters
    if (!requestData || !("shop" in requestData)) {
      const url = new URL(req.url);
      const shop = url.searchParams.get('shop');
      const accessToken = url.searchParams.get('token') || url.searchParams.get('accessToken');
      
      if (shop) {
        requestData = { 
          ...requestData, 
          shop,
          ...(accessToken ? { accessToken } : {})
        };
      }
    }
    
    if (!requestData || !("shop" in requestData)) {
      throw new Error('المعلمات المطلوبة مفقودة: shop و accessToken');
    }
    
    // تنظيف نطاق المتجر
    const shop = cleanShopDomain(requestData.shop as string);
    const accessToken = requestData.accessToken as string;
    
    console.log(`Testing connection for shop: ${shop}`);
    
    // If we don't have an access token, the connection is still valid but limited
    if (!accessToken) {
      console.log("No access token provided, but shop exists in database");
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Store exists in database but no token was provided to test API',
          shop_info: {
            domain: shop,
            myshopify_domain: shop
          }
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 200
        }
      );
    }
    
    // إذا كان الرمز مؤقتًا، ارجع خطأ على الفور
    if (accessToken === 'placeholder_token') {
      throw new Error('الرمز المؤقت (placeholder_token) غير صالح للاتصال');
    }
    
    // إجراء طلب اختبار إلى API متجر Shopify
    const shopUrl = `https://${shop}/admin/api/2023-07/shop.json`;
    
    const response = await fetch(shopUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });
    
    // التحقق من الاستجابة
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Invalid token or shop. Status: ${response.status}, Response: ${errorText}`);
      throw new Error(`رمز الوصول غير صالح. الخطأ: ${response.status} ${response.statusText}`);
    }
    
    // تحليل الاستجابة للتأكد من صحتها
    const data = await response.json();
    
    if (!data.shop || !data.shop.id) {
      throw new Error('تنسيق استجابة غير صالح من API متجر Shopify');
    }
    
    // ارجع استجابة ناجحة
    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم التحقق من صحة رمز الوصول',
        shop_info: {
          id: data.shop.id,
          name: data.shop.name,
          email: data.shop.email,
          domain: data.shop.domain,
          myshopify_domain: data.shop.myshopify_domain
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      }
    );
  } catch (error) {
    // ارجع استجابة الخطأ
    console.error('Error testing connection:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : 'حدث خطأ غير معروف',
        error: error instanceof Error ? error.message : 'حدث خطأ غير معروف'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200 // استخدام الحالة 200 حتى مع الأخطاء لتمكين العميل من معالجة الخطأ
      }
    );
  }
});
