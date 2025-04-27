
import { authenticate } from "../shopify.server";
import { redirect } from "@remix-run/node";

export const loader = async ({ request }) => {
  console.log("Auth route hit with URL:", request.url);
  
  try {
    const { session } = await authenticate.admin(request);
    console.log("Authentication successful, redirecting to dashboard");
    
    // بعد المصادقة، قم بالتوجيه إلى لوحة التحكم
    return redirect("/dashboard");
  } catch (error) {
    console.error("Authentication error:", error);
    // في حالة وجود خطأ في المصادقة، قم بالتوجيه إلى الصفحة الرئيسية
    return redirect("/?auth_error=true");
  }
};
