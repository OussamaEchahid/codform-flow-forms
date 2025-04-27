
import { authenticate } from "../shopify.server";
import { redirect } from "@remix-run/node";

export const loader = async ({ request }) => {
  console.log("Auth route hit with URL:", request.url);
  
  try {
    const { session } = await authenticate.admin(request);
    console.log("Authentication successful for shop:", session.shop);
    
    // بعد المصادقة الناجحة، قم بالتوجيه مباشرة إلى لوحة التحكم مع معلومة نجاح الاتصال
    return redirect("/dashboard?shopify_connected=true");
  } catch (error) {
    console.error("Authentication error:", error);
    // في حالة وجود خطأ في المصادقة، أعد توجيه المستخدم إلى الصفحة الرئيسية
    return redirect("/?auth_error=true");
  }
};
