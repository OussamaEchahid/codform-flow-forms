
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../../shopify.server";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    // محاولة المصادقة مع Shopify
    const { admin, session } = await authenticate.admin(request);
    
    // جلسة صالحة، إرجاع معلومات المتجر
    return json({ 
      shopifyConnected: true,
      shop: session.shop 
    });
  } catch (error) {
    console.log("Not authenticated with Shopify, allowing access anyway");
    // حتى لو لم تكن هناك جلسة Shopify، نسمح بالوصول إلى لوحة التحكم
    return json({ 
      shopifyConnected: false
    }, { status: 200 });
  }
};

export default function ShopifyDashboard() {
  const navigate = useNavigate();
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shopifyConnected = params.get("shopify_connected");
    const shop = params.get("shop");
    
    if (shopifyConnected === "true" && shop) {
      toast.success(`تم الاتصال بمتجر ${shop} بنجاح`);
    }
    
    // توجيه المستخدم إلى لوحة التحكم الأصلية
    navigate("/dashboard", { replace: true });
  }, [navigate]);
  
  return null;
}
