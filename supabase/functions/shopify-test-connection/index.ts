
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

// فحص حالة الامتداد في متجر Shopify
async function checkExtensionStatus(shop: string, accessToken: string): Promise<any> {
  try {
    console.log(`Checking extension status for shop: ${shop}`);
    
    // التحقق من وجود الامتداد في قائمة المتجر المثبتة
    const themesUrl = `https://${shop}/admin/api/2023-07/themes.json`;
    
    const themesResponse = await fetch(themesUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });
    
    if (!themesResponse.ok) {
      const errorText = await themesResponse.text();
      console.error(`Failed to fetch themes. Status: ${themesResponse.status}, Response: ${errorText}`);
      return { theme: false, error: `Error fetching themes: ${themesResponse.status}` };
    }
    
    const themesData = await themesResponse.json();
    const activeTheme = themesData.themes.find((theme: any) => theme.role === 'main');
    
    if (!activeTheme) {
      console.error(`No active theme found for shop: ${shop}`);
      return { theme: false, error: "No active theme found" };
    }
    
    console.log(`Active theme ID: ${activeTheme.id}`);
    
    // التحقق من وجود ملفات الامتداد في السمة النشطة
    const assetsUrl = `https://${shop}/admin/api/2023-07/themes/${activeTheme.id}/assets.json`;
    
    const assetsResponse = await fetch(assetsUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });
    
    if (!assetsResponse.ok) {
      const errorText = await assetsResponse.text();
      console.error(`Failed to fetch assets. Status: ${assetsResponse.status}, Response: ${errorText}`);
      return { theme: false, error: `Error fetching assets: ${assetsResponse.status}` };
    }
    
    const assetsData = await assetsResponse.json();
    
    // البحث عن ملفات الامتداد المهمة
    const hasCodeformJs = assetsData.assets.some((asset: any) => 
      asset.key.includes('codform-core.js'));
    
    const hasLiquidSnippet = assetsData.assets.some((asset: any) => 
      asset.key.includes('codform') && asset.key.endsWith('.liquid'));
    
    const themeSectionFound = assetsData.assets.some((asset: any) => 
      asset.key.includes('codform') && asset.key.includes('section'));
    
    const extensionStatus = {
      theme: true,
      assets: {
        js: hasCodeformJs,
        liquid: hasLiquidSnippet,
        section: themeSectionFound
      },
      active: hasCodeformJs && hasLiquidSnippet,
      themeId: activeTheme.id
    };
    
    console.log(`Extension check results:`, extensionStatus);
    return extensionStatus;
  } catch (error) {
    console.error(`Error checking extension status: ${error instanceof Error ? error.message : String(error)}`);
    return { 
      theme: false, 
      active: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
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
    const requestData = await req.json();
    
    if (!requestData.shop || !requestData.accessToken) {
      throw new Error('المعلمات المطلوبة مفقودة: shop و accessToken');
    }
    
    // تنظيف نطاق المتجر
    const shop = cleanShopDomain(requestData.shop);
    const accessToken = requestData.accessToken;
    const checkExtensions = requestData.checkExtensions === true;
    const forceExtensionCheck = requestData.forceExtensionCheck === true;
    
    console.log(`Testing connection for shop: ${shop}`);
    
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
    
    let extensionsStatus = null;
    
    // التحقق من حالة الامتدادات إذا تم طلب ذلك
    if (checkExtensions || forceExtensionCheck) {
      extensionsStatus = await checkExtensionStatus(shop, accessToken);
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
        },
        extensions: extensionsStatus
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
