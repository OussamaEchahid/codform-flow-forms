
import { redirect } from "@remix-run/node";

export async function loader({ request }) {
  const url = new URL(request.url);
  const shopifyReferrer = url.searchParams.get("shop");
  const hmac = url.searchParams.get("hmac");
  const timestamp = url.searchParams.get("timestamp");
  
  // إذا كان هناك متجر في الـ URL أو أي معلمات أخرى من Shopify، قم بتوجيه المستخدم إلى مسار المصادقة
  if (shopifyReferrer || hmac || timestamp) {
    console.log("Redirecting to auth with shop parameters");
    const params = new URLSearchParams(url.search);
    return redirect(`/auth?${params.toString()}`);
  }
  
  // إذا لم يكن هناك متجر، قم بتوجيه المستخدم إلى لوحة التحكم
  // هذا سيسمح لنا بالتحكم في المزيد من المنطق في لوحة التحكم
  return redirect('/dashboard');
}
