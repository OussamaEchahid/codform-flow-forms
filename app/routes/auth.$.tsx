
import { authenticate, login } from "../shopify.server";
import { redirect } from "@remix-run/node";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// مكون واجهة المستخدم لصفحة المصادقة
export function AuthRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shop = params.get("shop");
    
    // عرض رسالة في وحدة التحكم للتشخيص
    console.log("Auth page loaded with params:", Object.fromEntries(params.entries()));
    
    // إذا لم تكن هناك استجابة من الخادم خلال 20 ثانية، إعادة توجيه المستخدم
    const timeoutId = setTimeout(() => {
      console.log("No server response detected after timeout, redirecting to dashboard");
      navigate('/dashboard', { replace: true });
    }, 20000);
    
    return () => clearTimeout(timeoutId);
  }, [location.search, navigate]);
  
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50" dir="rtl">
      <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">جاري المصادقة مع Shopify</h1>
        <div className="flex justify-center mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
        <p className="mb-4">الرجاء الانتظار بينما نكمل عملية الاتصال مع متجر Shopify الخاص بك...</p>
        <p className="text-sm text-gray-500">إذا استمرت هذه الصفحة لأكثر من دقيقة، انقر على الزر أدناه للعودة.</p>
        
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
        >
          العودة إلى لوحة التحكم
        </button>
      </div>
    </div>
  );
}

export const loader = async ({ request }) => {
  console.log("Server Auth route hit with URL:", request.url);
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || "bestform-app.myshopify.com"; // Default to known shop if none provided
  const force = url.searchParams.get("force") === "true";
  const debug = url.searchParams.get("debug") === "true";
  const hmac = url.searchParams.get("hmac");
  const code = url.searchParams.get("code");
  
  // سجل جميع المعلومات للتشخيص
  console.log("Auth route complete parameters:", {
    shop,
    hmac: hmac ? "present" : "missing",
    code: code ? "present" : "missing",
    timestamp: url.searchParams.get("timestamp"),
    host: url.searchParams.get("host"),
    state: url.searchParams.get("state"),
    force,
    url: request.url,
    method: request.method,
    path: url.pathname
  });
  
  // قم بتنظيف عنوان URL الخاص بالمتجر إذا كان يحتوي على بروتوكول
  if (shop) {
    try {
      // إذا كان يبدأ بـ http:// أو https:// خذ فقط اسم النطاق
      if (shop.startsWith('http')) {
        const shopUrl = new URL(shop);
        shop = shopUrl.hostname;
        console.log("Cleaned shop parameter:", shop);
      }
      
      // تأكد من أن المتجر ينتهي بـ myshopify.com
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
    // استبدال معلمة متجر في عنوان URL بالقيمة المنظفة
    if (url.searchParams.has("shop") && shop) {
      url.searchParams.set("shop", shop);
      // إنشاء طلب جديد بعنوان URL محدث
      request = new Request(url.toString(), request);
    } else if (!url.searchParams.has("shop") && shop) {
      // Add shop parameter if missing
      url.searchParams.set("shop", shop);
      request = new Request(url.toString(), request);
    }

    // إضافة تأخير قصير لضمان أن الخادم جاهز لمعالجة الطلب
    await new Promise(resolve => setTimeout(resolve, 500));

    // إذا كان لدينا رمز وhmac، فنحن في استدعاء OAuth
    if (code && hmac) {
      console.log("OAuth callback detected with code and hmac");
      // محاولة المصادقة مع Shopify
      try {
        console.log("Authenticating with code:", code);
        const { session } = await authenticate.admin(request);
        console.log("Authentication successful for shop:", session.shop);
        
        // بعد المصادقة الناجحة، قم بتوجيه المستخدم مباشرة إلى لوحة التحكم
        const redirectUrl = `/dashboard?shopify_connected=true&shop=${encodeURIComponent(session.shop)}&auth_success=true&timestamp=${Date.now()}&session_id=${session.id}`;
        console.log("Redirecting to:", redirectUrl);
        
        return redirect(redirectUrl, {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
            "X-Auth-Result": "success"
          }
        });
      } catch (authError) {
        console.error("Authentication error:", authError);
        
        // في حالة فشل المصادقة، حاول استخدام طريقة احتياطية
        try {
          // حاول الاتصال بوظيفة الحافة لإكمال المصادقة
          const edgeFunctionUrl = `https://nhqrngdzuatdnfkihtud.functions.supabase.co/shopify-callback?${url.search.substring(1)}`;
          console.log("Trying edge function callback:", edgeFunctionUrl);
          
          return redirect(`/api/shopify-callback?${url.search.substring(1)}`, {
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
              "Pragma": "no-cache",
              "Expires": "0"
            }
          });
        } catch (fallbackError) {
          console.error("Fallback error:", fallbackError);
          return redirect(`/dashboard?auth_error=true&error=${encodeURIComponent(authError.message || 'Unknown error')}&shop=${encodeURIComponent(shop || '')}`);
        }
      }
    } 
    // إذا كان لدينا متجر فقط، نبدأ تدفق OAuth
    else if (shop || force) {
      try {
        console.log("Starting authentication flow for shop:", shop);
        
        // محاولة بدء تدفق تسجيل الدخول
        const response = await login(request);
        
        // تسجيل عنوان إعادة التوجيه الذي تم إنشاؤه بواسطة وظيفة login
        console.log("Login redirect URL:", response.headers.get("Location"));
        
        return response;
      } catch (loginError) {
        console.error("Login error:", loginError);
        
        // خطة بديلة عندما يفشل OAuth الخاص بـ Shopify - محاولة إعادة التوجيه المباشر
        console.log("Using fallback direct OAuth redirect");
        
        // احصل على عنوان URL للتطبيق الحالي أو استخدم الافتراضي
        const appUrl = process.env.SHOPIFY_APP_URL || "https://codform-flow-forms.lovable.app";
        const scopes = "write_products,read_products,read_orders,write_orders,write_script_tags,read_themes,write_themes,read_content,write_content";
        const redirectUri = `${appUrl}/api/shopify-callback`;
        const state = Date.now().toString();
        
        // إنشاء مباشر لعنوان URL الخاص بـ OAuth
        const shopifyAuthUrl = `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY || "7e4608874bbcc38afa1953948da28407"}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
        
        console.log("Fallback auth URL:", shopifyAuthUrl);
        
        return redirect(shopifyAuthUrl);
      }
    }
    
    // في حالة عدم وجود معلمة متجر
    return redirect("/dashboard?auth_error=true&error=no_shop_parameter");
  } catch (error) {
    console.error("Authentication error:", error.message);
    console.error("Stack trace:", error.stack);
    
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
    return redirect(`/dashboard?shopify_connected=true&shop=${encodeURIComponent(session.shop)}&auth_success=true&from_action=true`);
  } catch (error) {
    console.error("Authentication action error:", error);
    return redirect("/dashboard?auth_error=true&error=action_failed");
  }
};

// استخدم هذا المكون لتقديم الصفحة
export default AuthRoute;
