
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Store, RefreshCcw, ExternalLink } from "lucide-react";
import { shopifyConnectionService } from "@/services/ShopifyConnectionService";
import { toast } from "sonner";
import { useI18n } from '@/lib/i18n';

const NotFound = () => {
  const location = useLocation();
  const { language } = useI18n();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);
  
  const handleResetConnection = async () => {
    try {
      await shopifyConnectionService.forceResetConnection();
      toast.success(language === 'ar' ? "تم إعادة تعيين حالة الاتصال بنجاح" : "Connection status reset successfully");
      
      // Redirect to connection page after reset
      window.location.href = '/shopify-connect';
    } catch (error) {
      console.error("Error resetting connection:", error);
      toast.error(language === 'ar' ? "فشل في إعادة تعيين حالة الاتصال" : "Failed to reset connection status");
    }
  };

  const navigateToDirectConnect = () => {
    // Direct navigation to connection page
    window.location.href = '/shopify-connect';
  };
  
  // Check if the path is an orders-related path
  const isOrdersPath = location.pathname.includes('/orders');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">404</h1>
        <p className="text-xl text-gray-600 mb-6">
          {language === 'ar' ? 'عفوًا! الصفحة غير موجودة' : 'Sorry! Page not found'}
        </p>
        <p className="text-sm text-gray-500 mb-3">
          {language === 'ar' 
            ? `لم يتم العثور على الصفحة التي تبحث عنها: ` 
            : `The page you were looking for was not found: `}
          <span className="font-mono">{location.pathname}</span>
        </p>
        
        {isOrdersPath && (
          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-amber-800 text-sm">
              {language === 'ar'
                ? 'يبدو أنك تحاول الوصول إلى صفحة متعلقة بالطلبات. يمكنك الوصول إلى صفحة الطلبات من القائمة الجانبية.'
                : 'It looks like you are trying to access an orders page. You can access the orders section from the sidebar menu.'}
            </p>
          </div>
        )}
        
        {location.pathname.includes('shopify') && (
          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-amber-800 text-sm">
              {language === 'ar'
                ? 'يبدو أنك تحاول الوصول إلى صفحة متعلقة بشوبيفاي. يمكنك استخدام أحد الخيارات أدناه للوصول إلى صفحة الاتصال.'
                : 'It looks like you are trying to access a Shopify related page. You can use one of the options below to access the connection page.'}
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          <Button asChild variant="default" className="w-full">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" /> 
              {language === 'ar' ? 'الصفحة الرئيسية' : 'Home Page'}
            </Link>
          </Button>
          
          <Button asChild variant="default" className="w-full bg-blue-600 hover:bg-blue-700">
            <Link to="/dashboard">
              <Home className="mr-2 h-4 w-4" /> 
              {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
            </Link>
          </Button>
          
          {isOrdersPath && (
            <Button asChild variant="default" className="w-full bg-purple-600 hover:bg-purple-700">
              <Link to="/orders">
                <Store className="mr-2 h-4 w-4" /> 
                {language === 'ar' ? 'صفحة الطلبات' : 'Orders Page'}
              </Link>
            </Button>
          )}
          
          {location.pathname.includes('shopify') && (
            <>
              <Button 
                onClick={navigateToDirectConnect}
                variant="default" 
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <Store className="mr-2 h-4 w-4" /> 
                {language === 'ar' ? 'اتصال بشوبيفاي (مباشر)' : 'Connect to Shopify (Direct)'}
              </Button>
              
              <hr className="my-3" />
              
              <Button variant="outline" className="w-full" onClick={handleResetConnection}>
                <RefreshCcw className="mr-2 h-4 w-4" /> 
                {language === 'ar' ? 'إعادة تعيين اتصال Shopify' : 'Reset Shopify Connection'}
              </Button>
              
              <Button 
                asChild 
                variant="outline" 
                className="w-full" 
                onClick={() => window.open("https://codform-flow-forms.lovable.app/shopify-connect", "_blank")}
              >
                <div>
                  <ExternalLink className="mr-2 h-4 w-4" /> 
                  {language === 'ar' ? 'فتح اتصال شوبيفاي في نافذة جديدة' : 'Open Shopify Connection in new window'}
                </div>
              </Button>
            </>
          )}
          
          <Button asChild variant="ghost" className="w-full" onClick={() => window.history.back()}>
            <div>
              <ArrowLeft className="mr-2 h-4 w-4" /> 
              {language === 'ar' ? 'العودة للصفحة السابقة' : 'Back to previous page'}
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
