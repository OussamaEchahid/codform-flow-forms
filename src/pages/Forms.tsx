
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
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // إلغاء كامل لآلية إعادة التوجيه التلقائي
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsPageReady(true);
      
      // إذا كان المستخدم متصل بالفعل، فلا نعرض أي تحذيرات
      if (shopifyConnected && shop) {
        setShowConnectWarning(false);
        console.log('Connected to Shopify shop:', shop);
      } else {
        // إظهار التحذير للاتصال اليدوي فقط
        setShowConnectWarning(true);
        console.log('Not connected to Shopify, showing manual connect button');
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [language, shopifyConnected, shop]);
  
  // التعامل مع النقر اليدوي على زر "الاتصال بـ Shopify"
  const handleConnectShopify = () => {
    // منع النقرات المتكررة
    if (isRedirecting) {
      toast.info(language === 'ar' 
        ? 'جاري بالفعل إعادة التوجيه، يرجى الانتظار...' 
        : 'Already redirecting, please wait...');
      return;
    }
    
    setIsRedirecting(true);
    
    // مسح كافة البيانات المخزنة محليًا للتأكد من عدم وجود بيانات قديمة
    localStorage.removeItem('shopify_store');
    localStorage.removeItem('shopify_connected');
    localStorage.removeItem('shopify_reconnect_attempts');
    localStorage.removeItem('shopify_last_connect_time');
    localStorage.removeItem('shopify_last_redirect_time');
    localStorage.removeItem('shopify_temp_store');
    
    // عرض رسالة للمستخدم
    toast.info(language === 'ar' 
      ? 'جاري إعادة توجيهك للاتصال بـ Shopify...'
      : 'Redirecting to connect to Shopify...');
    
    // التوجيه إلى صفحة الاتصال بـ Shopify بعد تأخير قصير
    setTimeout(() => {
      navigate('/shopify');
    }, 1000);
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
        <div className="fixed top-0 left-0 right-0 bg-yellow-100 text-yellow-800 z-50 shadow-lg p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <AlertCircle className="h-6 w-6" /> 
            <h2 className="text-xl font-bold">{language === 'ar' 
              ? 'تنبيه: هناك مشكلة في الاتصال بـ Shopify' 
              : 'Alert: Shopify Connection Issue'}</h2>
          </div>
          <p className="mb-4 text-lg">{language === 'ar' 
            ? 'هناك مشكلة في الاتصال بـ Shopify. يرجى النقر على الزر أدناه لإعادة الاتصال يدويًا.' 
            : 'There is an issue with your Shopify connection. Please click the button below to reconnect manually.'}</p>
          <Button 
            onClick={handleConnectShopify}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 rounded-md text-lg font-medium"
            size="lg"
            disabled={isRedirecting}
          >
            {isRedirecting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                {language === 'ar' ? 'جاري التوجيه...' : 'Redirecting...'}
              </div>
            ) : (
              <>
                <RefreshCw className="h-5 w-5 mr-2" />
                {language === 'ar' ? 'إعادة الاتصال بـ Shopify' : 'Reconnect to Shopify'}
              </>
            )}
          </Button>
          <p className="mt-4 text-sm">{language === 'ar' 
            ? 'سيتم مسح بيانات الاتصال السابقة وتوجيهك إلى صفحة Shopify للبدء من جديد' 
            : 'Previous connection data will be cleared and you will be redirected to Shopify page to start fresh'}</p>
        </div>
      )}
      
      <div className={`flex-1 ${showConnectWarning ? 'pt-40' : ''}`}>
        <FormBuilderDashboard />
      </div>
    </div>
  );
};

export default Forms;
