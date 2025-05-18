
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Store, RefreshCcw, ExternalLink } from "lucide-react";
import { shopifyConnectionService } from "@/services/ShopifyConnectionService";
import { toast } from "sonner";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);
  
  const handleResetConnection = async () => {
    try {
      await shopifyConnectionService.forceResetConnection();
      toast.success("تم إعادة تعيين حالة الاتصال بنجاح");
      
      // توجيه إلى صفحة الاتصال بعد إعادة التعيين
      window.location.href = '/shopify-connect';
    } catch (error) {
      console.error("Error resetting connection:", error);
      toast.error("فشل في إعادة تعيين حالة الاتصال");
    }
  };

  const navigateToDirectConnect = () => {
    // الانتقال المباشر إلى صفحة الاتصال
    window.location.href = '/shopify-connect';
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4" dir="rtl">
      <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">404</h1>
        <p className="text-xl text-gray-600 mb-6">عفوًا! الصفحة غير موجودة</p>
        <p className="text-sm text-gray-500 mb-3">
          لم يتم العثور على الصفحة التي تبحث عنها: <span className="font-mono">{location.pathname}</span>
        </p>
        
        {location.pathname.includes('shopify') && (
          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-amber-800 text-sm">
              يبدو أنك تحاول الوصول إلى صفحة متعلقة بشوبيفاي. يمكنك استخدام أحد الخيارات أدناه للوصول إلى صفحة الاتصال.
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          <Button 
            onClick={navigateToDirectConnect}
            variant="default" 
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <Store className="mr-2 h-4 w-4" /> اتصال بشوبيفاي (مباشر)
          </Button>
          
          <hr className="my-3" />
          
          <Button asChild variant="default" className="w-full">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" /> الصفحة الرئيسية
            </Link>
          </Button>
          
          <Button 
            asChild 
            variant="outline" 
            className="w-full" 
            onClick={() => window.open("https://codform-flow-forms.lovable.app/shopify-connect", "_blank")}
          >
            <div>
              <ExternalLink className="mr-2 h-4 w-4" /> فتح اتصال شوبيفاي في نافذة جديدة
            </div>
          </Button>
          
          <Button variant="outline" className="w-full" onClick={handleResetConnection}>
            <RefreshCcw className="mr-2 h-4 w-4" /> إعادة تعيين اتصال Shopify
          </Button>
          
          <Button asChild variant="ghost" className="w-full" onClick={() => window.history.back()}>
            <div>
              <ArrowLeft className="mr-2 h-4 w-4" /> العودة للصفحة السابقة
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
