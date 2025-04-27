
import { authenticate } from "../shopify.server";
import { redirect } from "@remix-run/node";

export const loader = async ({ request }) => {
  console.log("Auth route hit with URL:", request.url);
  
  try {
    const { session } = await authenticate.admin(request);
    console.log("Authentication successful for shop:", session.shop);
    
    // بعد المصادقة، قم بالتوجيه إلى لوحة التحكم مع معلومة نجاح الاتصال بشوبيفاي
    return redirect("/dashboard?shopify_connected=true");
  } catch (error) {
    console.error("Authentication error:", error);
    // في حالة وجود خطأ في المصادقة، قم بالتوجيه إلى الصفحة الرئيسية مع رسالة خطأ
    return redirect("/?auth_error=true");
  }
};
