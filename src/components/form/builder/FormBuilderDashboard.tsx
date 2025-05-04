
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Loader, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import FormTemplatesDialog from '@/components/form/FormTemplatesDialog';
import FormList from '@/components/form/FormList';
import { Dialog } from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useShopify } from '@/hooks/useShopify';
import { shopifyConnectionManager } from '@/lib/shopify/connection-manager';
import { supabase } from '@/integrations/supabase/client';

const FormBuilderDashboard = () => {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const { forms, isLoading: formsLoading, fetchForms, createDefaultForm, createFormFromTemplate } = useFormTemplates();
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [connectionBypassMode, setConnectionBypassMode] = useState(() => {
    return localStorage.getItem('bypass_auth') === 'true';
  });
  const { user, shop, shopifyConnected } = useAuth();
  const { 
    tokenError, 
    testConnection, 
    failSafeMode, 
    toggleFailSafeMode, 
    isLoading: shopifyLoading,
    isRetrying,
    pendingSyncForms,
    resyncPendingForms
  } = useShopify();
  const [connectionTestDone, setConnectionTestDone] = useState(false);
  const [connectionOK, setConnectionOK] = useState(false);
  const [lastConnectionTest, setLastConnectionTest] = useState(0);
  
  // Test connection silently on component load with throttling
  useEffect(() => {
    const checkConnection = async () => {
      // Skip if we've tested in the last 30 seconds
      const now = Date.now();
      if (now - lastConnectionTest < 30000) {
        return;
      }
      
      try {
        setLastConnectionTest(now);
        const connected = await testConnection();
        setConnectionOK(connected);
        console.log("Silent connection test result:", connected);
      } catch (err) {
        console.log("Silent connection test error:", err);
        setConnectionOK(false);
      } finally {
        setConnectionTestDone(true);
      }
    };
    
    checkConnection();
  }, [testConnection, lastConnectionTest]);
  
  // Fallback check for local storage 
  const localStorageConnected = localStorage.getItem('shopify_connected') === 'true';
  const localStorageShop = localStorage.getItem('shopify_store');
  const actualShop = shop || localStorageShop;
  
  // Allow access even with connection issues to improve reliability
  // This is true if we have a valid shop reference from any source
  const hasValidShopConnection = (shopifyConnected || localStorageConnected) && !!actualShop;
  
  // Allow operation in bypass mode when there's a connection problem but shop reference exists
  const canOperateInBypassMode = !!actualShop && (tokenError || !connectionOK) && connectionTestDone;
  
  // Handle retry connection
  const handleConnectionRetry = async () => {
    try {
      toast.loading(language === 'ar' ? 'جاري الاتصال...' : 'Connecting...');
      const result = await testConnection(true);
      
      if (result) {
        toast.success(language === 'ar' 
          ? `تم الاتصال بمتجر: ${actualShop}` 
          : `Connected to store: ${actualShop}`);
        setConnectionOK(true);
      } else {
        toast.error(language === 'ar' 
          ? 'فشل الاتصال، تم تفعيل وضع التجاوز' 
          : 'Connection failed, bypass mode activated');
        setConnectionBypassMode(true);
        toggleFailSafeMode(true);
      }
    } catch (error) {
      console.error("Connection retry error:", error);
      toast.error(language === 'ar' 
        ? 'حدث خطأ أثناء الاتصال' 
        : 'Error connecting');
      setConnectionBypassMode(true);
      toggleFailSafeMode(true);
    }
  };
  
  // Enable bypass mode
  const enableBypass = () => {
    setConnectionBypassMode(true);
    localStorage.setItem('bypass_auth', 'true');
    toggleFailSafeMode(true);
    toast.info(language === 'ar' 
      ? 'تم تفعيل وضع التجاوز. يمكنك الاستمرار في إدارة النماذج.' 
      : 'Bypass mode activated. You can continue managing forms.');
  };

  const handleCreateForm = async () => {
    try {
      // If not authenticated at all and no bypass mode, show error
      if (!hasValidShopConnection && !canOperateInBypassMode && !connectionBypassMode) {
        toast.error(language === 'ar' 
          ? 'يجب تسجيل الدخول أو الاتصال بمتجر Shopify لإنشاء نموذج' 
          : 'You must be logged in or have a Shopify store connected to create a form');
        return;
      }
      
      // If we have connection issue but no shop reference, we need to force bypass
      if (!actualShop) {
        // Try to get shop from localStorage as last resort
        const lastShop = localStorage.getItem('shopify_store') || localStorage.getItem('shopify_last_url_shop');
        
        if (lastShop) {
          console.log("No shop in context but found in localStorage:", lastShop);
          // Enable bypass mode with the last known shop
          setConnectionBypassMode(true);
          localStorage.setItem('bypass_auth', 'true');
          localStorage.setItem('shopify_store', lastShop);
          localStorage.setItem('shopify_connected', 'true');
          
          toast.info(language === 'ar' 
            ? `تم تفعيل وضع التجاوز مع متجر ${lastShop}` 
            : `Bypass mode activated with shop ${lastShop}`);
        } else {
          toast.error(language === 'ar' 
            ? 'يجب ربط متجر Shopify لإنشاء نموذج' 
            : 'You must connect a Shopify store to create a form');
          return;
        }
      }
      
      setIsCreatingForm(true);
      
      console.log("Creating default form...");
      console.log("Current user:", user || "Using Shopify connection");
      console.log("Current shop:", actualShop);
      console.log("Operating in bypass mode:", connectionBypassMode || canOperateInBypassMode);
      
      // First, ensure schema is up-to-date before attempting form creation
      try {
        const { data: schemaResponse, error: schemaError } = await supabase.functions.invoke('update-schema', {
          body: { force_update: true }
        });
        
        if (schemaError) {
          console.warn("Schema update had issues, but continuing anyway:", schemaError);
        } else {
          console.log("Schema update completed:", schemaResponse);
        }
      } catch (schemaUpdateError) {
        console.warn("Schema update failed, but continuing anyway:", schemaUpdateError);
      }
      
      // Give the schema update some time to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newForm = await createDefaultForm();
      if (newForm) {
        console.log("New form created:", newForm);
        navigate(`/form-builder/${newForm.id}`);
      } else {
        console.error("Form creation failed: no form returned");
        toast.error(language === 'ar' ? 'حدث خطأ أثناء إنشاء النموذج' : 'Error creating form');
      }
    } catch (error: any) {
      console.error("Form creation error:", error);
      toast.error(`${language === 'ar' ? 'خطأ في إنشاء النموذج' : 'Form creation error'}: ${error.message}`);
    } finally {
      setIsCreatingForm(false);
    }
  };

  const handleSelectForm = (formId: string) => {
    navigate(`/form-builder/${formId}`);
  };

  const handleSelectTemplate = async (templateId: number) => {
    try {
      setIsCreatingForm(true);
      console.log("Selected template ID:", templateId);
      const newForm = await createFormFromTemplate(templateId);
      if (newForm) {
        console.log("New form created from template:", newForm);
        navigate(`/form-builder/${newForm.id}`);
        toast.success(language === 'ar' ? 'تم إنشاء النموذج بنجاح' : 'Form created successfully');
      } else {
        console.error("Template form creation failed: no form returned");
        toast.error(language === 'ar' ? 'فشل إنشاء النموذج' : 'Failed to create form');
      }
    } catch (error: any) {
      console.error("Template selection error:", error);
      toast.error(`${language === 'ar' ? 'خطأ في اختيار القالب' : 'Template selection error'}: ${error.message}`);
    } finally {
      setIsCreatingForm(false);
      setIsTemplateDialogOpen(false);
    }
  };
  
  // Handle resyncing pending forms
  const handleResyncForms = async () => {
    await resyncPendingForms();
  };

  return (
    <div className="flex-1 p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Connection issue warning banner */}
        {connectionTestDone && !connectionOK && hasValidShopConnection && (
          <Alert variant="warning" className="mb-6 bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">
              {language === 'ar' ? 'تحذير اتصال' : 'Connection Warning'}
            </AlertTitle>
            <AlertDescription className="text-amber-700">
              {language === 'ar' 
                ? 'هناك مشكلة في اتصال Shopify، لكن يمكنك الاستمرار في إدارة النماذج. بعض الوظائف قد لا تعمل بشكل صحيح.' 
                : 'There is an issue with the Shopify connection, but you can continue managing forms. Some features may not work properly.'}
            </AlertDescription>
            <div className="mt-2 flex flex-wrap gap-2 justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-amber-300 text-amber-800 hover:bg-amber-100"
                disabled={isRetrying || shopifyLoading}
                onClick={handleConnectionRetry}
              >
                {isRetrying || shopifyLoading ? (
                  <Loader className="mr-2 h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-3 w-3" />
                )}
                {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="border-amber-300 text-amber-800 hover:bg-amber-100"
                onClick={enableBypass}
              >
                {language === 'ar' ? 'متابعة على أي حال' : 'Continue anyway'}
              </Button>
            </div>
          </Alert>
        )}
        
        {/* Pending syncs banner */}
        {pendingSyncForms.length > 0 && (
          <Alert variant="default" className="mb-6 bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">
              {language === 'ar' ? 'نماذج معلقة للمزامنة' : 'Pending Forms Sync'}
            </AlertTitle>
            <AlertDescription className="text-blue-700">
              {language === 'ar' 
                ? `لديك ${pendingSyncForms.length} من النماذج المعلقة للمزامنة مع متجر Shopify.` 
                : `You have ${pendingSyncForms.length} forms pending synchronization with your Shopify store.`}
            </AlertDescription>
            <div className="mt-2 flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-blue-300 text-blue-800 hover:bg-blue-100"
                onClick={handleResyncForms}
                disabled={shopifyLoading}
              >
                {shopifyLoading ? (
                  <Loader className="mr-2 h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-3 w-3" />
                )}
                {language === 'ar' ? 'مزامنة الآن' : 'Sync Now'}
              </Button>
            </div>
          </Alert>
        )}
        
        {/* Success banner for active connection */}
        {connectionTestDone && connectionOK && hasValidShopConnection && (
          <Alert variant="default" className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">
              {language === 'ar' ? 'متصل بنجاح' : 'Connected Successfully'}
            </AlertTitle>
            <AlertDescription className="text-green-700">
              {language === 'ar' 
                ? `أنت متصل بنجاح بمتجر ${actualShop}` 
                : `You are successfully connected to store ${actualShop}`}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {language === 'ar' ? 'النماذج' : 'Forms'}
            </h1>
            <p className="text-gray-600">
              {language === 'ar' ? 'إدارة نماذج الدفع عند الاستلام' : 'Manage your Cash On Delivery forms'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsTemplateDialogOpen(true)} 
              variant="outline"
              disabled={isCreatingForm}
            >
              {language === 'ar' ? 'استخدام قالب' : 'Use Template'}
            </Button>
            <Button 
              onClick={handleCreateForm} 
              className="bg-[#9b87f5] hover:bg-[#7E69AB]"
              disabled={isCreatingForm}
            >
              {isCreatingForm ? (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {language === 'ar' ? 'إنشاء نموذج جديد' : 'Create New Form'}
            </Button>
          </div>
        </div>
        
        {/* Auth and Shop Debug Info (only in development) */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="mb-4 p-2 bg-gray-100 text-xs rounded">
            <div>User ID: {user?.id || 'Not logged in'}</div>
            <div>Shop: {actualShop || 'No shop connected'}</div>
            <div>AuthContext Connected: {shopifyConnected ? 'Yes' : 'No'}</div>
            <div>localStorage Connected: {localStorageConnected ? 'Yes' : 'No'}</div>
            <div>Has Valid Shop: {hasValidShopConnection ? 'Yes' : 'No'}</div>
            <div>Connection Test: {connectionTestDone ? (connectionOK ? 'Success' : 'Failed') : 'Pending'}</div>
            <div>Bypass Mode: {connectionBypassMode ? 'Enabled' : 'Disabled'}</div>
            <div>Can Operate in Bypass: {canOperateInBypassMode ? 'Yes' : 'No'}</div>
            <div>Fail-Safe Mode: {failSafeMode ? 'Enabled' : 'Disabled'}</div>
            <div>Pending Syncs: {pendingSyncForms.length}</div>
          </div>
        )}
        
        <FormList 
          forms={forms} 
          isLoading={formsLoading}
          onSelectForm={handleSelectForm}
        />
        
        {forms.length === 0 && !formsLoading && (
          <div className="text-center p-10 border rounded-lg bg-white">
            <p className="text-gray-500 mb-2">
              {language === 'ar' ? 'لا توجد نماذج متاحة' : 'No forms available'}
            </p>
            <p className="text-sm text-gray-400">
              {language === 'ar' 
                ? 'أنشئ نموذجًا جديدًا أو استخدم قالبًا للبدء' 
                : 'Create a new form or use a template to get started'}
            </p>
          </div>
        )}
      </div>
      
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <FormTemplatesDialog 
          open={isTemplateDialogOpen}
          onSelect={handleSelectTemplate} 
          onClose={() => setIsTemplateDialogOpen(false)}
        />
      </Dialog>
    </div>
  );
};

export default FormBuilderDashboard;
