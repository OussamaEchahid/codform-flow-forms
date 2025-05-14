
import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Store, RefreshCcw, ExternalLink, Info, AlertTriangle } from "lucide-react";
import { shopifyConnectionService } from "@/services/ShopifyConnectionService";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const NotFound = () => {
  const location = useLocation();
  const [isEmbedError, setIsEmbedError] = useState(false);
  const [formId, setFormId] = useState<string | null>(null);
  const [isFormIDValid, setIsFormIDValid] = useState(false);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    
    // Check if this is an embed error
    if (location.pathname.includes('/embed/')) {
      setIsEmbedError(true);
      // Extract the form ID from the URL
      const embedPathMatch = location.pathname.match(/\/embed\/([a-f0-9-]+)/i);
      if (embedPathMatch && embedPathMatch[1]) {
        const extractedFormId = embedPathMatch[1];
        setFormId(extractedFormId);
        
        // Check if the form ID is in the correct UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        setIsFormIDValid(uuidRegex.test(extractedFormId));
      }
    }
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
        
        {isEmbedError && (
          <div className="space-y-4 mb-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="font-medium">خطأ في تحميل النموذج</AlertTitle>
              <AlertDescription>
                <p className="mt-1">
                  لا يمكن تحميل النموذج بالمعرف: {formId || 'غير معروف'}
                </p>
                {!isFormIDValid && formId && (
                  <p className="mt-2 text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                    <strong>تنسيق معرّف النموذج غير صحيح.</strong> يجب أن يكون بتنسيق UUID كامل مثل: 
                    <span className="block font-mono mt-1 text-xs">6942b35d-ad06-40fb-8f70-86230d20b0fd</span>
                  </p>
                )}
              </AlertDescription>
            </Alert>
            
            <Alert variant="default" className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle className="font-medium text-blue-800">المسار الصحيح للنماذج المضمنة</AlertTitle>
              <AlertDescription className="text-blue-700">
                <p className="mt-1">
                  يجب استخدام الرابط بالصيغة التالية:
                </p>
                <code className="block font-mono mt-1 text-xs bg-white p-2 rounded border border-blue-200 overflow-x-auto">
                  https://codform-flow-forms.lovable.app/embed/{'<معرف-النموذج>'}
                </code>
                
                <p className="mt-3 text-sm">
                  تأكد من أن:
                </p>
                <ul className="list-disc mr-5 text-sm mt-1 space-y-1">
                  <li>معرّف النموذج بتنسيق UUID صحيح</li>
                  <li>النموذج منشور في قاعدة البيانات</li>
                  <li>المسار يحتوي على '/embed/' وليس '/forms/' أو أي مسار آخر</li>
                </ul>
              </AlertDescription>
            </Alert>
            
            <Button 
              asChild
              variant="default" 
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <a href="https://codform-flow-forms.lovable.app/forms" target="_blank" rel="noopener noreferrer">
                <Store className="mr-2 h-4 w-4" /> الذهاب إلى صفحة النماذج
              </a>
            </Button>
          </div>
        )}
        
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
          >
            <a href="https://codform-flow-forms.lovable.app/shopify-connect" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" /> فتح اتصال شوبيفاي في نافذة جديدة
            </a>
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
