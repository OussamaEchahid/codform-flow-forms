
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { useI18n } from '@/lib/i18n';
import { useShopify } from '@/hooks/useShopify';
import FormBuilderDashboard from '@/components/form/builder/FormBuilderDashboard';
import FormBuilderEditor from '@/components/form/builder/FormBuilderEditor';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const FormBuilderPage = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { user, shopifyConnected, shop } = useAuth();
  const { t, language } = useI18n();
  const { fetchForms } = useFormTemplates();
  const { tokenError, failSafeMode, toggleFailSafeMode } = useShopify();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'editor'>(formId ? 'editor' : 'dashboard');
  const [bypassEnabled, setBypassEnabled] = useState(false);
  
  // Allow access if either authenticated with user or connected with Shopify
  const hasAccess = !!user || shopifyConnected;
  
  // Check localStorage as fallback
  const localStorageConnected = localStorage.getItem('shopify_connected') === 'true';
  const actualHasAccess = hasAccess || localStorageConnected || bypassEnabled;
  
  // Handle connection issues automatically
  useEffect(() => {
    if (tokenError) {
      console.log("Token error detected, enabling bypass");
      setBypassEnabled(true);
      
      if (!failSafeMode) {
        toggleFailSafeMode(true);
        console.log("Enabling fail-safe mode automatically");
      }
    }
  }, [tokenError, failSafeMode, toggleFailSafeMode]);
  
  useEffect(() => {
    if (formId) {
      setActiveTab('editor');
    } else {
      fetchForms();
      setActiveTab('dashboard');
    }
  }, [formId, fetchForms]);

  // Always enable bypass access in development mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setBypassEnabled(true);
    }
  }, []);
  
  const enableBypass = () => {
    setBypassEnabled(true);
    localStorage.setItem('bypass_auth', 'true');
    toast.success(language === 'ar' 
      ? 'تم تفعيل وضع التجاوز. يمكنك الاستمرار في إدارة النماذج' 
      : 'Bypass mode activated. You can continue managing forms.');
  };

  if (!actualHasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="max-w-md w-full p-6 bg-white rounded shadow-md">
          <div className="text-center py-4">
            <h2 className="text-xl font-bold mb-4">
              {language === 'ar' 
                ? 'الوصول مقيد' 
                : 'Access Restricted'}
            </h2>
            <p className="mb-6">
              {language === 'ar' 
                ? 'يرجى تسجيل الدخول أو الاتصال بمتجر Shopify للوصول إلى منشئ النماذج' 
                : 'Please login or connect a Shopify store to access the form builder'}
            </p>
            
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={() => navigate('/shopify')}
                className="w-full"
              >
                {language === 'ar' ? 'الاتصال بمتجر Shopify' : 'Connect Shopify Store'}
              </Button>
              
              <Button
                variant="outline"
                onClick={enableBypass}
                className="w-full"
              >
                {language === 'ar' ? 'متابعة على أي حال' : 'Continue Anyway'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      
      {/* Connection issue warning banner */}
      {(tokenError || failSafeMode) && (
        <div className="absolute top-0 left-0 right-0 z-50 px-4 py-2">
          <Alert variant="warning" className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">
              {language === 'ar' ? 'تحذير اتصال' : 'Connection Warning'}
            </AlertTitle>
            <AlertDescription className="text-amber-700">
              {language === 'ar' 
                ? 'هناك مشكلة في اتصال Shopify، تم تفعيل وضع الدعم الاحتياطي. يمكنك الاستمرار في إدارة النماذج ولكن بعض الوظائف قد لا تعمل بشكل صحيح.' 
                : 'There is an issue with the Shopify connection. Fail-safe mode has been activated. You can continue managing forms but some features may not work properly.'}
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      <div className="flex-1 overflow-x-hidden">
        {activeTab === 'dashboard' ? (
          <FormBuilderDashboard />
        ) : (
          <FormBuilderEditor formId={formId} />
        )}
      </div>
    </div>
  );
};

export default FormBuilderPage;
