
import { redirect } from "@remix-run/node";

export async function loader({ request }) {
  const url = new URL(request.url);
  let shopifyReferrer = url.searchParams.get("shop");
  const hmac = url.searchParams.get("hmac");
  const timestamp = url.searchParams.get("timestamp");
  const code = url.searchParams.get("code");
  
  console.log("Root route accessed with params:", { shopifyReferrer, hmac, code, timestamp });
  
  // تنظيف رابط المتجر إذا كان يحتوي على البروتوكول
  if (shopifyReferrer) {
    try {
      // إذا كان يبدأ بـ http:// أو https://، نأخذ اسم النطاق فقط
      if (shopifyReferrer.startsWith('http')) {
        const shopUrl = new URL(shopifyReferrer);
        shopifyReferrer = shopUrl.hostname;
        console.log("Cleaned shop parameter:", shopifyReferrer);
      }
    } catch (e) {
      console.error("Error cleaning shop URL:", e);
    }
  }
  
  // إذا كان لدينا معلمة متجر، نقوم أولاً بتوجيه المستخدم إلى صفحة shopify
  if (shopifyReferrer) {
    console.log("Redirecting to /shopify with shop parameter:", shopifyReferrer);
    
    // تأكد من تضمين جميع معلمات عنوان URL في إعادة التوجيه
    const params = new URLSearchParams();
    params.set("shop", shopifyReferrer);
    if (hmac) params.set("hmac", hmac);
    if (timestamp) params.set("timestamp", timestamp);
    if (code) params.set("code", code);
    
    return redirect(`/shopify?${params.toString()}`);
  }
  
  // إذا كان لدينا معلمات مصادقة Shopify أخرى (hmac، code)، نقوم بإعادة التوجيه إلى مسار المصادقة
  if (hmac || code) {
    console.log("Redirecting to auth with authentication parameters");
    const params = new URLSearchParams(url.search);
    return redirect(`/auth?${params.toString()}`);
  }
  
  // لجميع الحالات الأخرى، قم بإعادة التوجيه إلى لوحة التحكم
  console.log("No Shopify parameters found, redirecting to dashboard");
  return redirect('/dashboard');
}
