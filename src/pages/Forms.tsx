
import React, { useEffect, useState } from 'react';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import FormBuilderDashboard from '@/components/form/builder/FormBuilderDashboard';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Forms = () => {
  const { user, shopifyConnected } = useAuth();
  const { language } = useI18n();
  const navigate = useNavigate();
  const [isPageReady, setIsPageReady] = useState(false);
  const [showConnectWarning, setShowConnectWarning] = useState(false);
  
  // أضف تأخيرًا صغيرًا للتأكد من تحديث حالة المصادقة
  useEffect(() => {
    let checkShop = localStorage.getItem('shopify_store');
    let checkConnected = localStorage.getItem('shopify_connected');
    
    const timeoutId = setTimeout(() => {
      setIsPageReady(true);
      
      // التحقق مما إذا كانت هناك مشكلة متكررة في الاتصال
      const reconnectAttempts = localStorage.getItem('shopify_reconnect_attempts') || '0';
      const attempts = parseInt(reconnectAttempts);
      
      // إذا تم اكتشاف أكثر من 3 محاولات خلال وقت قصير، نعرض تحذيرًا بدلاً من إعادة التوجيه
      if (attempts > 3) {
        const lastTime = localStorage.getItem('shopify_last_connect_time') || '0';
        const timeSince = Date.now() - parseInt(lastTime);
        
        // إذا كان هناك عدة محاولات في أقل من دقيقة
        if (timeSince < 60000) {
          setShowConnectWarning(true);
          toast.warning(language === 'ar'
            ? 'هناك مشكلة في الاتصال بـ Shopify. يرجى النقر على زر الاتصال يدويًا.'
            : 'There is an issue with the Shopify connection. Please click connect button manually.');
        } else {
          // إعادة تعيين العداد بعد مرور وقت كافٍ
          localStorage.setItem('shopify_reconnect_attempts', '0');
        }
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [language]);
  
  // التعامل مع النقر اليدوي على زر "الاتصال بـ Shopify"
  const handleConnectShopify = () => {
    // تسجيل محاولة الاتصال
    localStorage.setItem('shopify_last_connect_time', Date.now().toString());
    navigate('/shopify');
  };

  if (!isPageReady) {
    return (
      <div className="flex min-h-screen justify-center items-center bg-[#F8F9FB]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#9b87f5]"></div>
      </div>
    );
  }

  if (!user) {
    return <div className="text-center py-8">{language === 'ar' ? 'يرجى تسجيل الدخول للوصول إلى قسم النماذج' : 'Please login to access forms'}</div>;
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      
      {showConnectWarning && (
        <div className="fixed top-0 left-0 right-0 p-4 bg-yellow-100 text-yellow-800 z-50 text-center">
          <p className="mb-2">{language === 'ar' 
            ? 'هناك مشكلة في الاتصال بـ Shopify. قم بالنقر على الزر أدناه لإعادة الاتصال يدويًا.' 
            : 'There is an issue with the Shopify connection. Click the button below to reconnect manually.'}</p>
          <button 
            onClick={handleConnectShopify}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-1 rounded-md text-sm"
          >
            {language === 'ar' ? 'اتصال بـ Shopify' : 'Connect to Shopify'}
          </button>
        </div>
      )}
      
      <FormBuilderDashboard />
    </div>
  );
};

export default Forms;
