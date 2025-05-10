
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { useAuth } from '@/lib/auth';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { useI18n } from '@/lib/i18n';
import { useShopify } from '@/hooks/useShopify';
import FormBuilderDashboard from '@/components/form/builder/FormBuilderDashboard';
import FormBuilderEditor from '@/components/form/builder/FormBuilderEditor';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const FormBuilderPage = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { user, shopifyConnected, shop } = useAuth();
  const { t, language } = useI18n();
  const { fetchForms } = useFormTemplates();
  const { tokenError, failSafeMode, toggleFailSafeMode } = useShopify();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'editor'>(formId ? 'editor' : 'dashboard');
  const [bypassEnabled, setBypassEnabled] = useState(false);
  const [dbTriggerInitialized, setDbTriggerInitialized] = useState(false);
  
  // Allow access if either authenticated with user or connected with Shopify
  const hasAccess = !!user || shopifyConnected;
  
  // Check localStorage as fallback
  const localStorageConnected = localStorage.getItem('shopify_connected') === 'true';
  const actualHasAccess = hasAccess || localStorageConnected || bypassEnabled;

  // Initialize database trigger for automatic timestamp updates
  useEffect(() => {
    const initDbTrigger = async () => {
      if (dbTriggerInitialized) {
        console.log('Database trigger already initialized, skipping');
        return;
      }
      
      try {
        console.log('Initializing database trigger...');
        // Call edge function to initialize database trigger
        const { data, error } = await supabase.functions.invoke('create-db-trigger', {});
        
        if (error) {
          console.error('Error initializing database trigger:', error);
          toast.error('خطأ في تهيئة قاعدة البيانات');
        } else {
          console.log('Database trigger initialization result:', data);
          setDbTriggerInitialized(true);
        }
      } catch (err) {
        console.error('Failed to initialize database trigger:', err);
      }
    };

    // Only run on initial page load
    initDbTrigger();
  }, []); // Empty dependency array ensures it runs once
  
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
      
      {/* Simplified Connection Status Banner */}
      {(tokenError || failSafeMode) && (
        <div className="absolute top-0 left-0 right-0 z-50">
          <Alert variant="warning" className="flex items-center py-1 px-4 bg-amber-50 border-amber-200 mb-0 rounded-none">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span className="ml-2 text-amber-700 text-sm">
              {language === 'ar' 
                ? 'مشكلة في اتصال Shopify، تم تفعيل وضع الدعم الاحتياطي' 
                : 'Shopify connection issue. Fail-safe mode activated'}
            </span>
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
      
      {/* Debug info - only in development */}
      {process.env.NODE_ENV !== 'production' && !formId && (
        <div className="fixed bottom-2 right-2 p-2 bg-gray-100 text-xs rounded opacity-70 hover:opacity-100">
          <div>Debug: {shopifyConnected ? 'Connected' : 'Not connected'}</div>
          <div>DB Trigger: {dbTriggerInitialized ? 'Initialized' : 'Not initialized'}</div>
        </div>
      )}
    </div>
  );
};

export default FormBuilderPage;
