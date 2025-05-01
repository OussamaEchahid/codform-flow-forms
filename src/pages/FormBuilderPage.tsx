
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { useI18n } from '@/lib/i18n';
import FormBuilderDashboard from '@/components/form/builder/FormBuilderDashboard';
import FormBuilderEditor from '@/components/form/builder/FormBuilderEditor';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

const FormBuilderPage = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { user, shopifyConnected, shop } = useAuth();
  const { t, language } = useI18n();
  const { fetchForms, getFormById } = useFormTemplates();
  const isMobile = useIsMobile();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Determine which component to show based on presence of formId
  const showEditor = !!formId;
  
  useEffect(() => {
    console.log("FormBuilderPage mounted with formId:", formId);
    
    const validateForm = async () => {
      if (formId) {
        try {
          const form = await getFormById(formId);
          if (!form) {
            console.error("Form validation failed: Form not found");
            setFormError(language === 'ar' ? 'لم يتم العثور على النموذج' : 'Form not found');
            setTimeout(() => navigate('/forms'), 3000);
          } else {
            console.log("Form validation successful:", form);
            setFormError(null);
          }
        } catch (err) {
          console.error("Error validating form:", err);
          setFormError(language === 'ar' ? 'خطأ في التحقق من النموذج' : 'Error validating form');
        }
      }
    };
    
    // Just set the page as ready after a short initialization period
    const timeoutId = setTimeout(() => {
      validateForm();
      setPageReady(true);
    }, 300);
    
    if (!showEditor) {
      fetchForms();
    }
    
    return () => clearTimeout(timeoutId);
  }, [showEditor, fetchForms, formId, getFormById, navigate, language]);

  // Handle manual connection button click
  const handleConnectShopify = () => {
    // Prevent multiple clicks
    if (isRedirecting) {
      toast.info(language === 'ar' 
        ? 'جاري بالفعل إعادة التوجيه، يرجى الانتظار...' 
        : 'Already redirecting, please wait...');
      return;
    }
    
    setIsRedirecting(true);
    
    // Clear all locally stored data to ensure clean reconnection
    localStorage.removeItem('shopify_store');
    localStorage.removeItem('shopify_connected');
    localStorage.removeItem('shopify_reconnect_attempts');
    localStorage.removeItem('shopify_last_connect_time');
    localStorage.removeItem('shopify_last_redirect_time');
    localStorage.removeItem('shopify_temp_store');
    
    // Show message to user
    toast.info(language === 'ar' 
      ? 'جاري إعادة توجيهك للاتصال بـ Shopify...'
      : 'Redirecting to connect to Shopify...');
    
    // Add a longer delay to prevent rapid redirections
    setTimeout(() => {
      // Use direct location change to break any potential redirect loops
      window.location.href = '/shopify';
    }, 1500);
  };

  if (!user) {
    return <div className="text-center py-8">{language === 'ar' ? 'يرجى تسجيل الدخول للوصول إلى منشئ النماذج' : 'Please login to access the form builder'}</div>;
  }

  if (!pageReady) {
    return (
      <div className="flex min-h-screen justify-center items-center bg-[#F8F9FB]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#9b87f5]"></div>
      </div>
    );
  }

  if (formError) {
    return (
      <div className="flex min-h-screen bg-[#F8F9FB] justify-center items-center">
        <div className="bg-white shadow rounded-lg p-8 w-full max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-medium mb-2 text-red-600">
            {language === 'ar' ? 'خطأ في تحميل النموذج' : 'Error Loading Form'}
          </h3>
          <p className="text-gray-700 mb-4">
            {formError}
          </p>
          <Button 
            onClick={() => navigate('/forms')}
            className="bg-[#9b87f5] hover:bg-[#8a74e8]"
          >
            {language === 'ar' ? 'العودة إلى النماذج' : 'Return to Forms'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      
      {/* Shopify connection warning - show on editor screen only */}
      {showEditor && !shopifyConnected && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <Alert className="bg-yellow-100 text-yellow-800 shadow-lg p-6 text-center m-4 border-yellow-300">
            <div className="flex items-center justify-center gap-2 mb-4">
              <AlertCircle className="h-6 w-6" /> 
              <h2 className="text-xl font-bold">{language === 'ar' 
                ? 'تنبيه: الاتصال بـ Shopify مطلوب' 
                : 'Alert: Shopify Connection Required'}</h2>
            </div>
            <AlertDescription className="mb-4 text-lg">
              {language === 'ar' 
                ? 'يجب الاتصال بـ Shopify لاستخدام ميزات التكامل. يرجى النقر على الزر أدناه للاتصال.' 
                : 'Connecting to Shopify is required to use integration features. Please click the button below to connect.'}
            </AlertDescription>
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
                  {language === 'ar' ? 'الاتصال بـ Shopify' : 'Connect to Shopify'}
                </>
              )}
            </Button>
          </Alert>
        </div>
      )}
      
      <div className="flex-1">
        {showEditor ? (
          <FormBuilderEditor />
        ) : (
          <FormBuilderDashboard />
        )}
      </div>
    </div>
  );
};

export default FormBuilderPage;
