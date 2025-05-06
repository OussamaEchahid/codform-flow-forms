
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Store, RefreshCcw } from "lucide-react";
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4" dir="rtl">
      <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">404</h1>
        <p className="text-xl text-gray-600 mb-6">عفوًا! الصفحة غير موجودة</p>
        <p className="text-sm text-gray-500 mb-8">
          لم يتم العثور على الصفحة التي تبحث عنها: <span className="font-mono">{location.pathname}</span>
        </p>
        
        <div className="space-y-3">
          <Button asChild variant="default" className="w-full">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" /> الصفحة الرئيسية
            </Link>
          </Button>
          
          <Button asChild variant="default" className="w-full">
            <Link to="/shopify-connect">
              <Store className="mr-2 h-4 w-4" /> اتصال Shopify
            </Link>
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
