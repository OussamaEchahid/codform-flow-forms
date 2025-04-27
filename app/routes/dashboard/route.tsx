
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shopifyConnected = url.searchParams.get("shopify_connected");
  const shop = url.searchParams.get("shop");
  const authSuccess = url.searchParams.get("auth_success");
  const sessionId = url.searchParams.get("session_id");
  const authError = url.searchParams.get("auth_error");
  const errorMessage = url.searchParams.get("error");
  const timestamp = url.searchParams.get("timestamp");
  
  console.log("Dashboard route accessed with params:", { 
    shopifyConnected, 
    shop, 
    authSuccess,
    sessionId,
    authError,
    errorMessage,
    timestamp,
    allParams: Object.fromEntries(url.searchParams.entries()),
    fullUrl: request.url,
    headers: Object.fromEntries(request.headers.entries())
  });
  
  try {
    // محاولة المصادقة مع Shopify
    const { admin, session } = await authenticate.admin(request);
    
    console.log("Successfully authenticated with Shopify for shop:", session.shop);
    
    // إذا كانت المصادقة ناجحة، قم بإعادة معلومات المتجر
    return json({ 
      shopifyConnected: true,
      shop: session.shop,
      sessionFound: true,
      sessionId: session.id,
      timestamp: Date.now()
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      }
    });
  } catch (error) {
    console.log("Not authenticated with Shopify, checking if coming from auth flow");
    
    // إذا كنا آتين من مسار المصادقة مع معلمات متجر ناجحة
    if (shopifyConnected === "true" && shop) {
      console.log("Coming from successful auth flow with shop:", shop);
      return json({ 
        shopifyConnected: true,
        shop: shop,
        fromAuthFlow: true,
        sessionId: sessionId,
        authSuccess: authSuccess === "true",
        timestamp: timestamp || Date.now()
      }, {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        }
      });
    }
    
    // تحقق مما إذا كان هناك خطأ في المصادقة
    if (authError === "true") {
      console.log("Authentication error detected:", errorMessage);
      return json({ 
        shopifyConnected: false,
        authError: true,
        errorMessage: errorMessage || "خطأ مصادقة غير معروف",
        errorDetails: error instanceof Error ? error.message : "Unknown error",
        noSession: true,
        timestamp: Date.now()
      }, { 
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        }
      });
    }
    
    // حتى إذا لم تكن هناك جلسة Shopify، اسمح بالوصول إلى لوحة التحكم
    // هذا يسمح للمستخدم بمشاهدة لوحة التحكم بدون تسجيل الدخول
    console.log("Allowing access to dashboard without Shopify session");
    return json({ 
      shopifyConnected: false,
      noSession: true,
      timestamp: Date.now()
    }, { 
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      }
    });
  }
};
