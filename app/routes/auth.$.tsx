
import { authenticate } from "../shopify.server";
import { redirect } from "@remix-run/node";

export const loader = async ({ request }) => {
  console.log("Auth route hit with URL:", request.url);
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  
  try {
    // محاولة المصادقة مع Shopify
    const { session } = await authenticate.admin(request);
    console.log("Authentication successful for shop:", session.shop);
    
    // بعد المصادقة الناجحة، قم بتوجيه المستخدم مباشرة إلى لوحة التحكم
    return redirect(`/dashboard?shopify_connected=true&shop=${encodeURIComponent(session.shop)}`);
  } catch (error) {
    console.error("Authentication error:", error);
    
    // إذا كان هناك متجر في العنوان، فهذا يعني أننا في بداية عملية المصادقة
    if (shop) {
      try {
        // بدء تدفق المصادقة مع Shopify
        return await login(request);
      } catch (loginError) {
        console.error("Login error:", loginError);
      }
    }
    
    // في حالة وجود خطأ في المصادقة ولا يوجد متجر، أعد توجيه المستخدم إلى الصفحة الرئيسية
    return redirect("/?auth_error=true");
  }
};

// استيراد وظيفة login
import { login } from "../shopify.server";

// هذه الوظيفة تعالج العمليات التي تتم بعد مصادقة شوبيفاي
export const action = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    return redirect(`/dashboard?shopify_connected=true&shop=${encodeURIComponent(session.shop)}`);
  } catch (error) {
    console.error("Authentication action error:", error);
    return redirect("/?auth_error=true");
  }
};
