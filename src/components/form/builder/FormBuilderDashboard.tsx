
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

// لمنع العمليات المتكررة
let isFormCreationInProgress = false;
let redirectionTimer: ReturnType<typeof setTimeout> | null = null;

const FormBuilderDashboard = () => {
  const { t, language } = useI18n();
  const { forms, isLoading, fetchForms, createDefaultForm, createFormFromTemplate } = useFormTemplates();
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [creationAttempted, setCreationAttempted] = useState(false);
  const { shopifyConnected, shop, refreshShopifyConnection } = useAuth();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // تحميل بيانات النماذج مرة واحدة فقط عند بدء التشغيل
  useEffect(() => {
    if (initialLoadComplete) return;

    console.log('FormBuilderDashboard - Initial load started');
    
    const initializeDashboard = async () => {
      try {
        // محاولة تحديث حالة الاتصال أولاً
        if (refreshShopifyConnection) {
          refreshShopifyConnection();
        }
        
        console.log('Fetching forms...');
        await fetchForms();
        console.log('Forms fetched successfully');
      } catch (err) {
        console.error("Error during dashboard initialization:", err);
      } finally {
        setInitialLoadComplete(true);
      }
    };
    
    // إعادة تعيين المتغير العام لضمان عدم وجود تضارب
    isFormCreationInProgress = false;
    
    // مسح أي مؤقتات سابقة
    if (redirectionTimer) {
      clearTimeout(redirectionTimer);
      redirectionTimer = null;
    }
    
    initializeDashboard();
    
    return () => {
      if (redirectionTimer) {
        clearTimeout(redirectionTimer);
      }
    };
  }, [fetchForms, refreshShopifyConnection]);

  // إنشاء نموذج جديد مع ضمانات إضافية
  const handleCreateForm = async () => {
    // منع النقرات المتعددة والعمليات المتزامنة
    if (isCreatingForm || isFormCreationInProgress) {
      console.log("Form creation already in progress");
      toast.info(language === 'ar' ? 'جارٍ إنشاء النموذج، يرجى الانتظار...' : 'Form creation in progress, please wait...');
      return;
    }
    
    try {
      // تعيين المؤشرات المحلية والعالمية
      setIsCreatingForm(true);
      isFormCreationInProgress = true;
      setCreationAttempted(true);
      
      console.log("Creating default form...");
      toast.loading(language === 'ar' ? 'جارٍ إنشاء النموذج...' : 'Creating form...');
      
      const newForm = await createDefaultForm();
      
      if (newForm && newForm.id) {
        console.log("New form created with ID:", newForm.id);
        toast.success(language === 'ar' ? 'تم إنشاء النموذج بنجاح' : 'Form created successfully');
        
        // إصلاح مشكلة إعادة التوجيه عن طريق استخدام تأخير أطول وإعادة التحميل الكامل
        redirectionTimer = setTimeout(() => {
          // استخدام وظيفة التنقل المحسنة
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
      // إضافة تأخير قبل إعادة تعيين حالة الإنشاء لمنع النقرات المزدوجة
      setTimeout(() => {
        setIsCreatingForm(false);
        // انتظر فترة أطول قبل السماح بطلب إنشاء جديد
        setTimeout(() => {
          isFormCreationInProgress = false;
        }, 1000);
      }, 1000);
    }
  };

  // معالجة تحديد النموذج مع معالجة أخطاء أكثر قوة
  const handleSelectForm = useCallback((formId: string) => {
    if (!formId) {
      console.error("Invalid form ID");
      toast.error(language === 'ar' ? 'معرّف النموذج غير صالح' : 'Invalid form ID');
      return;
    }
    
    // منع النقرات المتعددة
    if (isFormCreationInProgress) {
      console.log("Navigation already in progress");
      toast.info(language === 'ar' ? 'جارٍ التنقل، يرجى الانتظار...' : 'Navigation in progress, please wait...');
      return;
    }
    
    isFormCreationInProgress = true;
    
    console.log(`Navigating to form editor for form ${formId}`);
    toast.loading(language === 'ar' ? 'جارٍ تحميل النموذج...' : 'Loading form...');
    
    // استخدام وظيفة التنقل المحسنة مع تأخير لضمان عرض رسالة التحميل
    setTimeout(() => {
      navigateToFormBuilder(formId);
      
      // إعادة تعيين العلامة بعد 3 ثوانٍ للسماح بالتنقل مرة أخرى
      setTimeout(() => {
        isFormCreationInProgress = false;
      }, 3000);
    }, 300);
  }, [language]);

  // معالج تحديد القالب مع ضمانات
  const handleSelectTemplate = async (templateId: number) => {
    if (isCreatingForm || isFormCreationInProgress) {
      console.log("Form creation already in progress");
      toast.info(language === 'ar' ? 'جارٍ إنشاء النموذج، يرجى الانتظار...' : 'Form creation in progress, please wait...');
      return;
    }
    
    try {
      setIsCreatingForm(true);
      isFormCreationInProgress = true;
      setCreationAttempted(true);
      console.log("Selected template ID:", templateId);
      toast.loading(language === 'ar' ? 'جارٍ إنشاء النموذج من القالب...' : 'Creating form from template...');
      
      const newForm = await createFormFromTemplate(templateId);
      
      if (newForm && newForm.id) {
        console.log("New form created from template:", newForm);
        toast.success(language === 'ar' ? 'تم إنشاء النموذج بنجاح' : 'Form created successfully');
        
        // تأخير قصير قبل التنقل للسماح بعرض رسالة النجاح
        redirectionTimer = setTimeout(() => {
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
      // إضافة تأخير قبل إعادة تعيين حالة الإنشاء
      setTimeout(() => {
        setIsCreatingForm(false);
        setIsTemplateDialogOpen(false);
        
        // انتظر فترة أطول قبل السماح بطلب إنشاء جديد
        setTimeout(() => {
          isFormCreationInProgress = false;
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
              disabled={isCreatingForm}
            >
              {t('useTemplate')}
            </Button>
            <Button 
              onClick={handleCreateForm} 
              className="bg-[#9b87f5] hover:bg-[#7E69AB]"
              disabled={isCreatingForm || isFormCreationInProgress}
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
        
        {/* عرض رسالة إذا تمت محاولة إنشاء النموذج لكن فشلت */}
        {creationAttempted && !isCreatingForm && isFormCreationInProgress && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800">
              {language === 'ar' 
                ? 'إذا لم يتم توجيهك بعد إنشاء النموذج، يرجى النقر فوق "إنشاء نموذج جديد" مرة أخرى بعد بضع ثوانٍ.'
                : 'If you were not redirected after form creation, please try clicking "Create New Form" again after a few seconds.'}
            </p>
          </div>
        )}
      </div>
      
      {/* مربع حوار اختيار القالب */}
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
