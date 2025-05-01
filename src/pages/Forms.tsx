
import React, { useEffect, useState } from 'react';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import FormBuilderDashboard from '@/components/form/builder/FormBuilderDashboard';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

const Forms = () => {
  const { user, shopifyConnected, shop } = useAuth();
  const { language } = useI18n();
  const navigate = useNavigate();
  const [isPageReady, setIsPageReady] = useState(false);
  const [showConnectWarning, setShowConnectWarning] = useState(false);
  
  // تعطيل إعادة التوجيه التلقائي وبدلاً من ذلك إظهار زر للاتصال اليدوي
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsPageReady(true);
      
      // تمكين رسالة الاتصال اليدوي عند الضرورة
      if (shopifyConnected && shop) {
        // إذا كانت هناك بيانات اتصال، نفترض أنها صالحة ولا نظهر أي تحذير
        setShowConnectWarning(false);
      } else {
        // فقط في حالة عدم وجود بيانات اتصال، أظهر تحذيرًا للاتصال اليدوي
        const reconnectAttempts = localStorage.getItem('shopify_reconnect_attempts') || '0';
        const attempts = parseInt(reconnectAttempts);
        
        // تعيين علامة للإشارة إلى أن هناك حاجة للاتصال اليدوي
        setShowConnectWarning(true);
        
        // تجنب عرض نفس الإشعار عدة مرات
        if (attempts === 0) {
          toast.warning(language === 'ar'
            ? 'يبدو أن هناك مشكلة في الاتصال بـ Shopify. يرجى النقر على زر الاتصال يدويًا.'
            : 'There is an issue with the Shopify connection. Please click connect button manually.');
          
          // زيادة عداد المحاولات
          localStorage.setItem('shopify_reconnect_attempts', '1');
        }
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [language, shopifyConnected, shop]);
  
  // التعامل مع النقر اليدوي على زر "الاتصال بـ Shopify"
  const handleConnectShopify = () => {
    // إعادة تعيين البيانات المخزنة قبل الانتقال
    localStorage.removeItem('shopify_store');
    localStorage.removeItem('shopify_connected');
    localStorage.removeItem('shopify_reconnect_attempts');
    localStorage.removeItem('shopify_last_connect_time');
    localStorage.removeItem('shopify_last_redirect_time');
    localStorage.removeItem('shopify_temp_store');
    
    // تحديث وقت آخر محاولة اتصال
    localStorage.setItem('shopify_last_connect_time', Date.now().toString());
    
    // التوجيه إلى صفحة الاتصال بـ Shopify
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
          <div className="flex items-center justify-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5" /> 
            <p className="font-bold">{language === 'ar' 
              ? 'تحذير: مشكلة في الاتصال بـ Shopify' 
              : 'Warning: Shopify connection issue'}</p>
          </div>
          <p className="mb-3">{language === 'ar' 
            ? 'هناك مشكلة في الاتصال بـ Shopify. قم بالنقر على الزر أدناه لإعادة الاتصال يدويًا.' 
            : 'There is an issue with the Shopify connection. Click the button below to reconnect manually.'}</p>
          <Button 
            onClick={handleConnectShopify}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-md"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {language === 'ar' ? 'إعادة الاتصال بـ Shopify' : 'Reconnect to Shopify'}
          </Button>
          <p className="mt-3 text-xs">{language === 'ar' 
            ? 'ملاحظة: سيتم مسح بيانات الاتصال السابقة وبدء عملية اتصال جديدة' 
            : 'Note: Previous connection data will be cleared and a new connection process will start'}</p>
        </div>
      )}
      
      <FormBuilderDashboard />
    </div>
  );
};

export default Forms;
