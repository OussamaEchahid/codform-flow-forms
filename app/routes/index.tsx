
import { redirect } from "@remix-run/node";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'sonner';

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

export default function Index() {
  const navigate = useNavigate();
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shop = params.get("shop");
    const authError = params.get("auth_error");
    
    if (authError) {
      toast.error('حدث خطأ في المصادقة مع Shopify. يرجى المحاولة مرة أخرى.');
    }
    
    if (shop) {
      console.log("Shop detected in URL, redirecting to auth:", shop);
      // توجيه مباشر إلى مسار المصادقة مع متغير المتجر
      window.location.href = `/auth?shop=${shop}`;
    } else {
      // بدون معلمات متجر، انتقل إلى لوحة التحكم
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);
  
  return null;
}
