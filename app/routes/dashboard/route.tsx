
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shopifyConnected = url.searchParams.get("shopify_connected");
  const shop = url.searchParams.get("shop");
  
  try {
    // محاولة المصادقة مع Shopify
    const { admin, session } = await authenticate.admin(request);
    
    // جلسة صالحة، إرجاع معلومات المتجر
    return json({ 
      shopifyConnected: true,
      shop: session.shop 
    });
  } catch (error) {
    console.log("Not authenticated with Shopify, checking if coming from auth flow");
    
    // إذا كنا قادمين من مسار المصادقة مع معلمات متجر ناجحة
    if (shopifyConnected === "true" && shop) {
      return json({ 
        shopifyConnected: true,
        shop: shop
      });
    }
    
    // حتى لو لم تكن هناك جلسة Shopify، نسمح بالوصول إلى لوحة التحكم
    return json({ 
      shopifyConnected: false
    }, { status: 200 });
  }
};
