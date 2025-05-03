
import { redirect } from "@remix-run/node";
import { cleanShopifyDomain } from "../lib/shopify/types";

export async function loader({ request }) {
  const url = new URL(request.url);
  let shopifyReferrer = url.searchParams.get("shop");
  const hmac = url.searchParams.get("hmac");
  const timestamp = url.searchParams.get("timestamp");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const host = url.searchParams.get("host");
  const session = url.searchParams.get("session");
  
  console.log("Root route accessed with params:", { 
    shopifyReferrer, hmac, code, timestamp, state, host, session,
    allParams: Object.fromEntries(url.searchParams.entries()),
    fullUrl: request.url,
    headers: Object.fromEntries(request.headers.entries())
  });
  
  // تنظيف عنوان URL للمتجر باستخدام الوظيفة المساعدة
  if (shopifyReferrer) {
    try {
      shopifyReferrer = cleanShopifyDomain(shopifyReferrer);
      console.log("Cleaned shop parameter:", shopifyReferrer);
    } catch (e) {
      console.error("Error cleaning shop URL:", e);
    }
  }
  
  // إذا كان لدينا معلمة متجر، أولاً قم بإعادة توجيه المستخدم مباشرة إلى صفحة المصادقة
  if (shopifyReferrer) {
    console.log("Redirecting directly to auth with shop parameter:", shopifyReferrer);
    
    // تأكد من تضمين جميع معلمات عنوان URL في إعادة التوجيه
    const params = new URLSearchParams();
    params.set("shop", shopifyReferrer);
    params.set("force_update", "true"); // علامة للإشارة إلى تحديث إجباري للمتجر
    
    if (hmac) params.set("hmac", hmac);
    if (timestamp) params.set("timestamp", timestamp);
    if (code) params.set("code", code);
    if (state) params.set("state", state);
    if (host) params.set("host", host);
    if (session) params.set("session", session);
    
    // توجيه مباشر إلى نقطة النهاية للمصادقة على الخادم مع جميع المعلمات
    return redirect(`/auth?${params.toString()}&new_connection=true`, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      }
    });
  }
  
  // إذا كان لدينا معلمات مصادقة Shopify أخرى (hmac، code)، قم بإعادة التوجيه إلى مسار المصادقة
  if (hmac || code) {
    console.log("Redirecting to auth with authentication parameters");
    const params = new URLSearchParams(url.search);
    params.append("new_connection", "true");
    params.append("force_update", "true"); // علامة للإشارة إلى تحديث إجباري للمتجر
    return redirect(`/auth?${params.toString()}`, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      }
    });
  }
  
  // لجميع الحالات الأخرى، قم بإعادة التوجيه إلى لوحة التحكم
  console.log("No Shopify parameters found, redirecting to dashboard");
  return redirect('/dashboard');
}
