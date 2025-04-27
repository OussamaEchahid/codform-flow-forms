
import { redirect } from "@remix-run/node";

export async function loader({ request }) {
  const url = new URL(request.url);
  const shopifyReferrer = url.searchParams.get("shop");
  
  if (shopifyReferrer) {
    console.log("Redirecting to auth with shop:", shopifyReferrer);
    // إذا كان هناك متجر في الـ URL، قم بتوجيه المستخدم إلى مسار المصادقة
    return redirect(`/auth?shop=${shopifyReferrer}`);
  }
  
  // إذا لم يكن هناك متجر، قم بتوجيه المستخدم إلى لوحة التحكم
  // هذا سيسمح لنا بالتحكم في المزيد من المنطق في لوحة التحكم
  return redirect('/dashboard');
}

// لا نحتاج إلى مكون واجهة مستخدم لأننا نقوم بالتوجيه مباشرة
