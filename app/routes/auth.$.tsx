
import { authenticate } from "../shopify.server";
import { redirect } from "@remix-run/node";

export const loader = async ({ request }) => {
  console.log("Auth route hit with URL:", request.url);
  
  try {
    const { session } = await authenticate.admin(request);
    console.log("Authentication successful for shop:", session.shop);
    
    // بعد المصادقة الناجحة، قم بإنشاء حساب تلقائي للمتجر وتوجيهه مباشرة إلى لوحة التحكم
    return redirect(`/dashboard?shopify_connected=true&shop=${encodeURIComponent(session.shop)}`);
  } catch (error) {
    console.error("Authentication error:", error);
    // في حالة وجود خطأ في المصادقة، أعد توجيه المستخدم إلى الصفحة الرئيسية
    return redirect("/?auth_error=true");
  }
};

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
