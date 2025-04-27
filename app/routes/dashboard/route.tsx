
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../../shopify.server";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  
  // التحقق من وجود جلسة صالحة
  if (!session) {
    return json({ 
      shopifyConnected: false,
      error: "Not authenticated" 
    }, { status: 401 });
  }
  
  // إرجاع بيانات الجلسة لاستخدامها في الواجهة
  return json({ 
    shopifyConnected: true,
    shop: session.shop 
  });
};

export default function ShopifyDashboard() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // توجيه المستخدم إلى لوحة التحكم الأصلية
    navigate("/dashboard");
  }, [navigate]);
  
  return null;
}
