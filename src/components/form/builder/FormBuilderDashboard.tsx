
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import FormTemplatesDialog from '@/components/form/FormTemplatesDialog';
import FormList from '@/components/form/FormList';
import { Dialog } from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth';
import { navigateToFormBuilder } from '@/lib/form-navigation';

// Global variable to prevent duplicate operations
let isFormActionInProgress = false;

const FormBuilderDashboard = () => {
  const { t, language } = useI18n();
  const { forms, isLoading, fetchForms, createDefaultForm, createFormFromTemplate } = useFormTemplates();
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [creationAttempted, setCreationAttempted] = useState(false);
  const { user, shop, shopifyConnected } = useAuth();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Load forms data once
  useEffect(() => {
    if (initialLoadComplete) return;
    
    console.log('FormBuilderDashboard - Initial load started');
    
    const initializeDashboard = async () => {
      try {
        console.log('Fetching forms...');
        await fetchForms();
        console.log('Forms fetched successfully');
      } catch (err) {
        console.error("Error during dashboard initialization:", err);
      } finally {
        setInitialLoadComplete(true);
      }
    };
    
    // Reset global variable to ensure no conflicts
    isFormActionInProgress = false;
    
    initializeDashboard();
  }, [fetchForms]);

  // Create new form with additional safeguards
  const handleCreateForm = async () => {
    // Prevent multiple clicks
    if (isCreatingForm || isFormActionInProgress) {
      console.log("Form creation already in progress");
      toast.info(language === 'ar' ? 'جارٍ إنشاء النموذج، يرجى الانتظار...' : 'Form creation in progress, please wait...');
      return;
    }
    
    // Verify user is logged in
    if (!user) {
      console.error("User not authenticated");
      toast.error(language === 'ar' ? 'يرجى تسجيل الدخول للمتابعة' : 'Please login to continue');
      return;
    }
    
    try {
      // Set indicators
      setIsCreatingForm(true);
      isFormActionInProgress = true;
      setCreationAttempted(true);
      
      console.log("Creating default form...");
      toast.loading(language === 'ar' ? 'جارٍ إنشاء النموذج...' : 'Creating form...');
      
      // Store shop ID in localStorage before creating form
      if (shop) {
        localStorage.setItem('shopify_store', shop);
        localStorage.setItem('shopify_connected', 'true');
      }
      
      const newForm = await createDefaultForm();
      
      if (newForm && newForm.id) {
        console.log("New form created with ID:", newForm.id);
        toast.success(language === 'ar' ? 'تم إنشاء النموذج بنجاح' : 'Form created successfully');
        
        // Use timeout to ensure toast is displayed before navigation
        setTimeout(() => {
          // Use enhanced navigation function
          console.log("Navigating to form builder:", newForm.id);
          navigateToFormBuilder(newForm.id);
        }, 500);
      } else {
        console.error("Form creation failed: no valid form ID returned");
        toast.error(language === 'ar' ? 'حدث خطأ أثناء إنشاء النموذج' : 'Error creating form');
      }
    } catch (error: any) {
      console.error("Form creation error:", error);
      toast.error(
        language === 'ar' 
          ? `خطأ في إنشاء النموذج: ${error.message || 'خطأ غير معروف'}` 
          : `Form creation error: ${error.message || 'Unknown error'}`
      );
    } finally {
      // Add delay before resetting creation state
      setTimeout(() => {
        setIsCreatingForm(false);
        // Wait longer before allowing another creation request
        setTimeout(() => {
          isFormActionInProgress = false;
        }, 1000);
      }, 1000);
    }
  };

  // Handle form selection with robust error handling
  const handleSelectForm = useCallback((formId: string) => {
    if (!formId) {
      console.error("Invalid form ID");
      toast.error(language === 'ar' ? 'معرّف النموذج غير صالح' : 'Invalid form ID');
      return;
    }
    
    // Prevent multiple clicks
    if (isFormActionInProgress) {
      console.log("Navigation already in progress");
      toast.info(language === 'ar' ? 'جارٍ التنقل، يرجى الانتظار...' : 'Navigation in progress, please wait...');
      return;
    }
    
    isFormActionInProgress = true;
    
    console.log(`Navigating to form editor for form ${formId}`);
    toast.loading(language === 'ar' ? 'جارٍ تحميل النموذج...' : 'Loading form...');
    
    // Verify the user is logged in before navigation
    if (!user) {
      toast.error(language === 'ar' ? 'يرجى تسجيل الدخول للمتابعة' : 'Please login to continue');
      isFormActionInProgress = false;
      return;
    }
    
    // Store the user ID and shop connection in localStorage before navigation
    if (user) {
      localStorage.setItem('user_id', user.id);
    }
    
    if (shop) {
      localStorage.setItem('shopify_store', shop);
      localStorage.setItem('shopify_connected', shopifyConnected ? 'true' : 'false');
    }
    
    // Use enhanced navigation with delay to ensure loading message shows
    setTimeout(() => {
      navigateToFormBuilder(formId);
      
      // Reset flag after 3 seconds to allow navigation again
      setTimeout(() => {
        isFormActionInProgress = false;
      }, 3000);
    }, 300);
  }, [language, user, shop, shopifyConnected]);

  // Template selection handler with safeguards
  const handleSelectTemplate = async (templateId: number) => {
    if (isCreatingForm || isFormActionInProgress) {
      console.log("Form creation already in progress");
      toast.info(language === 'ar' ? 'جارٍ إنشاء النموذج، يرجى الانتظار...' : 'Form creation in progress, please wait...');
      return;
    }
    
    // Verify user is logged in
    if (!user) {
      console.error("User not authenticated");
      toast.error(language === 'ar' ? 'يرجى تسجيل الدخول للمتابعة' : 'Please login to continue');
      return;
    }
    
    try {
      setIsCreatingForm(true);
      isFormActionInProgress = true;
      setCreationAttempted(true);
      console.log("Selected template ID:", templateId);
      toast.loading(language === 'ar' ? 'جارٍ إنشاء النموذج من القالب...' : 'Creating form from template...');
      
      // Store shop ID in localStorage before creating form
      if (shop) {
        localStorage.setItem('shopify_store', shop);
        localStorage.setItem('shopify_connected', 'true');
      }
      
      const newForm = await createFormFromTemplate(templateId);
      
      if (newForm && newForm.id) {
        console.log("New form created from template:", newForm);
        toast.success(language === 'ar' ? 'تم إنشاء النموذج بنجاح' : 'Form created successfully');
        
        // Short delay before navigation to allow success toast to appear
        setTimeout(() => {
          navigateToFormBuilder(newForm.id);
        }, 500);
      } else {
        console.error("Template form creation failed: no form returned");
        toast.error(language === 'ar' ? 'فشل إنشاء النموذج' : 'Failed to create form');
      }
    } catch (err: any) {
      console.error("Template selection error:", err);
      toast.error(
        language === 'ar' 
          ? `خطأ في اختيار القالب: ${err.message || 'خطأ غير معروف'}` 
          : `Template selection error: ${err.message || 'Unknown error'}`
      );
    } finally {
      // Add delay before resetting creation state
      setTimeout(() => {
        setIsCreatingForm(false);
        setIsTemplateDialogOpen(false);
        
        // Wait longer before allowing another create request
        setTimeout(() => {
          isFormActionInProgress = false;
        }, 1000);
      }, 1000);
    }
  };

  return (
    <div className="flex-1 p-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {t('forms')}
            </h1>
            <p className="text-gray-600">
              {language === 'ar' ? 'إدارة نماذج الدفع عند الاستلام' : 'Manage your Cash On Delivery forms'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsTemplateDialogOpen(true)} 
              variant="outline"
              disabled={isCreatingForm || !user}
            >
              {t('useTemplate')}
            </Button>
            <Button 
              onClick={handleCreateForm} 
              className="bg-[#9b87f5] hover:bg-[#7E69AB]"
              disabled={isCreatingForm || isFormActionInProgress || !user}
            >
              {isCreatingForm ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  {t('formCreating')}
                </div>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('createNewForm')}
                </>
              )}
            </Button>
          </div>
        </div>
        
        {!user && (
          <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-6">
            <p className="font-medium">
              {language === 'ar' ? 'يرجى تسجيل الدخول لإنشاء وتعديل النماذج' : 'Please login to create and edit forms'}
            </p>
          </div>
        )}
        
        <FormList 
          forms={forms} 
          isLoading={isLoading || !initialLoadComplete}
          onSelectForm={handleSelectForm}
        />
        
        {forms.length === 0 && !isLoading && initialLoadComplete && (
          <div className="text-center p-10 border rounded-lg bg-white">
            <p className="text-gray-500 mb-2">
              {t('noForms')}
            </p>
            <p className="text-sm text-gray-400">
              {t('createFormPrompt')}
            </p>
          </div>
        )}
        
        {/* Show message if form creation was attempted but failed */}
        {creationAttempted && !isCreatingForm && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800">
              {language === 'ar' 
                ? 'إذا لم يتم توجيهك بعد إنشاء النموذج، يرجى النقر فوق "إنشاء نموذج جديد" مرة أخرى بعد بضع ثوانٍ.'
                : 'If you were not redirected after form creation, please try clicking "Create New Form" again after a few seconds.'}
            </p>
          </div>
        )}
      </div>
      
      {/* Template selection dialog */}
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
