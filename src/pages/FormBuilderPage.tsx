
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  const { user, shopifyConnected, shop } = useAuth();
  const { t, language } = useI18n();
  const { fetchForms } = useFormTemplates();
  const isMobile = useIsMobile();
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'editor'>(formId ? 'editor' : 'dashboard');
  
  useEffect(() => {
    if (formId) {
      setActiveTab('editor');
    } else {
      fetchForms();
      setActiveTab('dashboard');
    }
  }, [formId, fetchForms]);

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

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      
      {/* Shopify connection warning - show on all screens regardless of device */}
      {formId && (
        <div className="fixed top-0 left-0 right-0 z-50">
          {!shopifyConnected && (
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
          )}
        </div>
      )}
      
      {activeTab === 'dashboard' ? (
        <FormBuilderDashboard />
      ) : (
        <FormBuilderEditor formId={formId} />
      )}
    </div>
  );
};

export default FormBuilderPage;
