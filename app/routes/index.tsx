
import { redirect } from "@remix-run/node";

export async function loader({ request }) {
  const url = new URL(request.url);
  const shopifyReferrer = url.searchParams.get("shop");
  const hmac = url.searchParams.get("hmac");
  const timestamp = url.searchParams.get("timestamp");
  const code = url.searchParams.get("code");
  
  console.log("Root route accessed with params:", { shopifyReferrer, hmac, code, timestamp });
  
  // إذا كان هناك معلمة متجر شوبيفاي، قم بتوجيه المستخدم إلى مسار ShopifyRedirect أولاً
  if (shopifyReferrer) {
    console.log("Redirecting to /shopify with shop parameter");
    const params = new URLSearchParams();
    params.set("shop", shopifyReferrer);
    if (hmac) params.set("hmac", hmac);
    if (timestamp) params.set("timestamp", timestamp);
    if (code) params.set("code", code);
    
    return redirect(`/shopify?${params.toString()}`);
  }
  
  // إذا كان هناك معلمات شوبيفاي أخرى (hmac، code)، توجيه إلى مسار المصادقة
  if (hmac || code) {
    console.log("Redirecting to auth with authentication parameters");
    const params = new URLSearchParams(url.search);
    return redirect(`/auth?${params.toString()}`);
  }
  
  // في الحالات الأخرى، توجيه المستخدم إلى لوحة التحكم
  console.log("No Shopify parameters found, redirecting to dashboard");
  return redirect('/dashboard');
}
