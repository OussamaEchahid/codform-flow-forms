
import { redirect } from "@remix-run/node";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export async function loader({ request }) {
  // إذا كان هناك معلمة shop، قم بالتوجيه إلى مسار المصادقة
  const url = new URL(request.url);
  const shopifyReferrer = url.searchParams.get("shop");
  
  if (shopifyReferrer) {
    console.log("Redirecting to auth with shop:", shopifyReferrer);
    return redirect(`/auth?shop=${shopifyReferrer}`);
  }
  
  // خلاف ذلك، عرض المكون
  return null;
}

export default function Index() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // التحقق مما إذا كان هناك معلمة shop في العنوان
    const params = new URLSearchParams(window.location.search);
    const shop = params.get("shop");
    
    if (shop) {
      // التأكد من استخدام العنوان الكامل بدلاً من التوجيه النسبي
      console.log("Client-side redirect to auth with shop:", shop);
      window.location.href = `/auth?shop=${shop}`;
    }
  }, [navigate]);
  
  // استيراد وعرض المكون الأصلي Index
  const OriginalIndex = require("../../src/pages/Index").default;
  return <OriginalIndex />;
}
