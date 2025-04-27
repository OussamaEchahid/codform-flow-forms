
import { authenticate } from "../shopify.server";
import { redirect } from "@remix-run/node";

export const loader = async ({ request }) => {
  console.log("Auth route hit with URL:", request.url);
  const url = new URL(request.url);
  let shop = url.searchParams.get("shop");
  
  // تنظيف رابط المتجر إذا كان يحتوي على بروتوكول
  if (shop) {
    try {
      // إذا كان يبدأ بـ http:// أو https://، نأخذ اسم النطاق فقط
      if (shop.startsWith('http')) {
        const shopUrl = new URL(shop);
        shop = shopUrl.hostname;
        console.log("Cleaned shop parameter:", shop);
      }
      
      // التأكد من أن المتجر ينتهي بـ myshopify.com
      if (!shop.endsWith('myshopify.com')) {
        console.log("Shop domain does not end with myshopify.com:", shop);
        if (!shop.includes('.')) {
          shop = `${shop}.myshopify.com`;
          console.log("Added myshopify.com to shop:", shop);
        }
      }
    } catch (e) {
      console.error("Error cleaning shop URL:", e);
    }
  }
  
  console.log("Processing auth for shop:", shop);
  
  try {
    // محاولة المصادقة مع Shopify
    const { session } = await authenticate.admin(request);
    console.log("Authentication successful for shop:", session.shop);
    
    // بعد نجاح المصادقة، إعادة توجيه المستخدم مباشرة إلى لوحة التحكم
    return redirect(`/dashboard?shopify_connected=true&shop=${encodeURIComponent(session.shop)}&auth_success=true&timestamp=${Date.now()}`);
  } catch (error) {
    console.log("Authentication error:", error.message);
    
    // إذا كان لدينا متجرًا في العنوان، فهذا يعني أننا في بداية عملية المصادقة
    if (shop) {
      try {
        // بدء عملية مصادقة Shopify
        console.log("Starting authentication flow for shop:", shop);
        
        // استبدل معلمة المتجر في URL بالقيمة المنظفة
        if (url.searchParams.has("shop")) {
          url.searchParams.set("shop", shop);
          request = new Request(url.toString(), request);
        }
        
        return await login(request);
      } catch (loginError) {
        console.error("Login error:", loginError);
      }
    }
    
    // في حالة خطأ المصادقة وعدم وجود متجر، إعادة توجيه المستخدم إلى الصفحة الرئيسية
    return redirect("/?auth_error=true");
  }
};

// استيراد دالة تسجيل الدخول
import { login } from "../shopify.server";

// تتعامل هذه الدالة مع عمليات ما بعد المصادقة بواسطة Shopify
export const action = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    return redirect(`/dashboard?shopify_connected=true&shop=${encodeURIComponent(session.shop)}`);
  } catch (error) {
    console.error("Authentication action error:", error);
    return redirect("/?auth_error=true");
  }
};
