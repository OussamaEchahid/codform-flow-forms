
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function ShopifyCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(location.search);
      const shop = params.get('shop');
      const code = params.get('code');
      const hmac = params.get('hmac');
      
      if (!shop || !code || !hmac) {
        toast.error("معلمات المصادقة مفقودة");
        navigate('/shopify', { replace: true });
        return;
      }
      
      try {
        // Call our Supabase Edge Function to complete OAuth
        const response = await fetch(
          `https://nhqrngdzuatdnfkihtud.functions.supabase.co/shopify-callback?${location.search.substring(1)}`,
          { method: 'GET' }
        );
        
        if (!response.ok) {
          throw new Error("Failed to complete authentication");
        }
        
        // Store shop information in localStorage
        localStorage.setItem('shopify_store', shop);
        localStorage.setItem('shopify_connected', 'true');
        
        // Remove temporary data
        localStorage.removeItem('shopify_temp_store');
        
        toast.success(`تم الاتصال بمتجر ${shop} بنجاح`);
        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error("Error handling callback:", error);
        toast.error("فشل إكمال عملية المصادقة");
        navigate('/shopify', { replace: true });
      }
    };
    
    handleCallback();
  }, [location.search, navigate]);
  
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50" dir="rtl">
      <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">جاري إكمال المصادقة</h1>
        <div className="flex justify-center mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
        <p className="mb-4">الرجاء الانتظار بينما نكمل عملية المصادقة...</p>
      </div>
    </div>
  );
}
