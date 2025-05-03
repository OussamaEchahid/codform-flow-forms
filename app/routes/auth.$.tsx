
import { authenticate, login } from "../shopify.server";
import { redirect } from "@remix-run/node";
import { cleanShopifyDomain } from "../lib/shopify/types";

export const loader = async ({ request }) => {
  console.log("Server Auth route hit with URL:", request.url);
  const url = new URL(request.url);
  let shop = url.searchParams.get("shop");
  
  // سجل جميع المعلومات للتشخيص
  console.log("Auth route complete parameters:", {
    shop,
    hmac: url.searchParams.get("hmac"),
    code: url.searchParams.get("code"),
    timestamp: url.searchParams.get("timestamp"),
    host: url.searchParams.get("host"),
    state: url.searchParams.get("state"),
    allParams: Object.fromEntries(url.searchParams.entries()),
    headers: Object.fromEntries(request.headers.entries()),
    url: request.url,
    method: request.method,
    path: url.pathname
  });
  
  // قم بتنظيف عنوان URL الخاص بالمتجر باستخدام الوظيفة المساعدة
  if (shop) {
    try {
      shop = cleanShopifyDomain(shop);
      console.log("Cleaned shop parameter:", shop);
    } catch (e) {
      console.error("Error cleaning shop URL:", e);
    }
  }
  
  console.log("Processing auth for shop:", shop);
  
  try {
    // استبدال معلمة متجر في عنوان URL بالقيمة المنظفة
    if (url.searchParams.has("shop") && shop) {
      url.searchParams.set("shop", shop);
      // إنشاء طلب جديد بعنوان URL محدث
      request = new Request(url.toString(), request);
    }

    const code = url.searchParams.get("code");
    const hmac = url.searchParams.get("hmac");
    
    // إذا كان لدينا رمز وhmac، فنحن في استدعاء OAuth
    if (code && hmac) {
      console.log("OAuth callback detected with code and hmac");
      // محاولة المصادقة مع Shopify
      try {
        console.log("Authenticating with code:", code);
        const { session } = await authenticate.admin(request);
        console.log("Authentication successful for shop:", session.shop);
        
        // بعد المصادقة الناجحة، قم بتوجيه المستخدم مباشرة إلى لوحة التحكم
        const redirectUrl = `/dashboard?shopify_connected=true&shop=${encodeURIComponent(session.shop)}&auth_success=true&timestamp=${Date.now()}&session_id=${session.id}&new_connection=true`;
        console.log("Redirecting to:", redirectUrl);
        
        return redirect(redirectUrl, {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
          }
        });
      } catch (authError) {
        console.error("Authentication error:", authError);
        return redirect(`/dashboard?auth_error=true&error=${encodeURIComponent(authError.message)}&shop=${encodeURIComponent(shop || '')}`);
      }
    } 
    // إذا كان لدينا متجر فقط، نبدأ تدفق OAuth
    else if (shop) {
      try {
        console.log("Starting authentication flow for shop:", shop);
        
        // حفظ متجر في ملف تعريف ارتباط مؤقت
        const response = await login(request);
        
        // تسجيل عنوان إعادة التوجيه الذي تم إنشاؤه بواسطة وظيفة login
        console.log("Login redirect URL:", response.headers.get("Location"));
        
        return response;
      } catch (loginError) {
        console.error("Login error:", loginError);
        return redirect(`/dashboard?auth_error=true&error=${encodeURIComponent(loginError.message)}&shop=${encodeURIComponent(shop || '')}`);
      }
    }
    
    // في حالة عدم وجود معلمة متجر
    return redirect("/dashboard?auth_error=true&error=no_shop_parameter");
  } catch (error) {
    console.error("Authentication error:", error.message);
    console.error("Stack trace:", error.stack);
    
    // إذا كان لدينا متجر في عنوان URL، فهذا يعني أننا في بداية عملية المصادقة
    if (shop) {
      try {
        // ابدأ تدفق مصادقة Shopify
        console.log("Attempting to login for shop:", shop);
        const response = await login(request);
        
        // تسجيل عنوان إعادة التوجيه الذي تم إنشاؤه
        console.log("Login redirect URL on error recovery:", response.headers.get("Location"));
        
        return response;
      } catch (loginError) {
        console.error("Login error:", loginError);
        // في حالة خطأ تسجيل الدخول، قدم معلومات مفصلة
        return redirect(`/dashboard?auth_error=true&error=${encodeURIComponent(loginError.message)}&shop=${encodeURIComponent(shop || '')}`);
      }
    }
    
    // في حالة خطأ المصادقة وعدم وجود متجر، قم بإعادة توجيه المستخدم إلى الصفحة الرئيسية
    return redirect("/dashboard?auth_error=true&error=authentication_failed");
  }
};

// تتعامل هذه الدالة مع عمليات ما بعد المصادقة من قبل Shopify
export const action = async ({ request }) => {
  try {
    console.log("POST auth action called with URL:", request.url);
    const { session } = await authenticate.admin(request);
    console.log("POST auth action successful for shop:", session.shop);
    return redirect(`/dashboard?shopify_connected=true&shop=${encodeURIComponent(session.shop)}&auth_success=true&from_action=true&new_connection=true`);
  } catch (error) {
    console.error("Authentication action error:", error);
    return redirect("/dashboard?auth_error=true&error=action_failed");
  }
};
