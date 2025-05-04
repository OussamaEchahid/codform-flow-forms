
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Loader, AlertCircle } from 'lucide-react';
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

const FormBuilderDashboard = () => {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const { forms, isLoading, fetchForms, createDefaultForm, createFormFromTemplate } = useFormTemplates();
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = React.useState(false);
  const [isCreatingForm, setIsCreatingForm] = React.useState(false);
  const [connectionBypassMode, setConnectionBypassMode] = React.useState(false);
  const { user, shop, shopifyConnected } = useAuth();
  const { tokenError, testConnection } = useShopify();
  const [connectionTestDone, setConnectionTestDone] = React.useState(false);
  const [connectionOK, setConnectionOK] = React.useState(false);
  
  // Test connection silently on component load
  React.useEffect(() => {
    const checkConnection = async () => {
      try {
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
  }, [testConnection]);
  
  // Fallback check for local storage 
  const localStorageConnected = localStorage.getItem('shopify_connected') === 'true';
  const localStorageShop = localStorage.getItem('shopify_store');
  const actualShop = shop || localStorageShop;
  
  // Allow access even with connection issues to improve reliability
  // This is true if we have a valid shop reference from any source
  const hasValidShopConnection = (shopifyConnected || localStorageConnected) && !!actualShop;
  
  // Allow operation in bypass mode when there's a connection problem but shop reference exists
  const canOperateInBypassMode = !!actualShop && (tokenError || !connectionOK) && connectionTestDone;

  const handleCreateForm = async () => {
    try {
      // If not authenticated at all and no bypass mode, show error
      if (!hasValidShopConnection && !canOperateInBypassMode && !connectionBypassMode) {
        toast.error(language === 'ar' 
          ? 'يجب تسجيل الدخول أو الاتصال بمتجر Shopify لإنشاء نموذج' 
          : 'You must be logged in or have a Shopify store connected to create a form');
        return;
      }
      
      // If we have connection issue and no shop reference, show error
      if (!actualShop) {
        toast.error(language === 'ar' 
          ? 'يجب ربط متجر Shopify لإنشاء نموذج' 
          : 'You must connect a Shopify store to create a form');
        return;
      }
      
      setIsCreatingForm(true);
      
      console.log("Creating default form...");
      console.log("Current user:", user || "Using Shopify connection");
      console.log("Current shop:", actualShop);
      console.log("Operating in bypass mode:", connectionBypassMode || canOperateInBypassMode);
      
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
            <div className="mt-2 flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-amber-300 text-amber-800 hover:bg-amber-100"
                onClick={() => {
                  setConnectionBypassMode(true);
                  toast.info(language === 'ar' 
                    ? 'تم تفعيل وضع التجاوز. يمكنك الاستمرار في إدارة النماذج.' 
                    : 'Bypass mode activated. You can continue managing forms.');
                }}
              >
                {language === 'ar' ? 'متابعة على أي حال' : 'Continue anyway'}
              </Button>
            </div>
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
          </div>
        )}
        
        <FormList 
          forms={forms} 
          isLoading={isLoading}
          onSelectForm={handleSelectForm}
        />
        
        {forms.length === 0 && !isLoading && (
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
