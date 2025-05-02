
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

const FormBuilderDashboard = () => {
  const { t, language } = useI18n();
  const { forms, isLoading, fetchForms, createDefaultForm, createFormFromTemplate } = useFormTemplates();
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [creationAttempted, setCreationAttempted] = useState(false);
  const { shopifyConnected, shop, refreshShopifyConnection } = useAuth();

  // Refresh forms list when component mounts
  useEffect(() => {
    console.log('FormBuilderDashboard - Component mounted');
    
    // Try to refresh the connection status first
    if (refreshShopifyConnection) {
      refreshShopifyConnection();
    }
    
    // Log auth state for debugging
    console.log('FormBuilderDashboard - Auth state:', { shopifyConnected, shop });
    
    // Fetch forms regardless of connection status
    fetchForms().catch(err => {
      console.error("Error fetching forms:", err);
    });
    
    // Reset creation attempt flag when component mounts
    setCreationAttempted(false);
    
  }, [fetchForms, shopifyConnected, shop, refreshShopifyConnection]);

  // Handle form creation with additional safeguards
  const handleCreateForm = async () => {
    if (isCreatingForm) {
      console.log("Form creation already in progress, ignoring duplicate request");
      return;
    }
    
    try {
      setIsCreatingForm(true);
      setCreationAttempted(true);
      console.log("Creating default form...");
      
      const newForm = await createDefaultForm();
      
      if (newForm && newForm.id) {
        console.log("New form created with ID:", newForm.id);
        toast.success(language === 'ar' ? 'تم إنشاء النموذج بنجاح' : 'Form created successfully');
        
        // Short delay before navigation to allow toast to show
        setTimeout(() => {
          // Force navigation with full page refresh
          navigateToFormBuilder(newForm.id);
        }, 300);
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
      // Add a delay before resetting the creation state to prevent double-clicks
      setTimeout(() => {
        setIsCreatingForm(false);
      }, 1000);
    }
  };

  // Handle form selection with more robust error handling
  const handleSelectForm = useCallback((formId: string) => {
    if (!formId) {
      console.error("Invalid form ID");
      toast.error(language === 'ar' ? 'معرّف النموذج غير صالح' : 'Invalid form ID');
      return;
    }
    
    console.log(`Navigating to form editor for form ${formId}`);
    toast.info(language === 'ar' ? 'جاري تحميل النموذج...' : 'Loading form...');
    
    // Navigate using our helper function
    navigateToFormBuilder(formId);
  }, [language]);

  // Template selection handler with safeguards
  const handleSelectTemplate = async (templateId: number) => {
    if (isCreatingForm) {
      console.log("Form creation already in progress, ignoring template selection");
      return;
    }
    
    try {
      setIsCreatingForm(true);
      setCreationAttempted(true);
      console.log("Selected template ID:", templateId);
      
      const newForm = await createFormFromTemplate(templateId);
      
      if (newForm && newForm.id) {
        console.log("New form created from template:", newForm);
        toast.success(language === 'ar' ? 'تم إنشاء النموذج بنجاح' : 'Form created successfully');
        
        // Short delay before navigation to allow toast to show
        setTimeout(() => {
          navigateToFormBuilder(newForm.id);
        }, 300);
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
              disabled={isCreatingForm}
            >
              {t('useTemplate')}
            </Button>
            <Button 
              onClick={handleCreateForm} 
              className="bg-[#9b87f5] hover:bg-[#7E69AB]"
              disabled={isCreatingForm}
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
        
        <FormList 
          forms={forms} 
          isLoading={isLoading}
          onSelectForm={handleSelectForm}
        />
        
        {forms.length === 0 && !isLoading && (
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
                ? 'إذا لم يتم توجيهك بعد إنشاء النموذج، يرجى النقر فوق "إنشاء نموذج جديد" مرة أخرى.'
                : 'If you were not redirected after form creation, please try clicking "Create New Form" again.'}
            </p>
          </div>
        )}
      </div>
      
      {/* Dialog for template selection */}
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
