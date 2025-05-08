
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import FormTemplatesDialog from '@/components/form/FormTemplatesDialog';
import FormList from '@/components/form/FormList';
import { toast } from 'sonner';

interface FormBuilderDashboardProps {
  initialForms?: any[];
  forceRefresh?: boolean;
}

const FormBuilderDashboard: React.FC<FormBuilderDashboardProps> = ({ 
  initialForms = [],
  forceRefresh = false
}) => {
  const navigate = useNavigate();
  const { forms, isLoading, fetchForms, createFormFromTemplate, createDefaultForm } = useFormTemplates();
  
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [localForms, setLocalForms] = useState(initialForms || []);
  const [hasLoadedForms, setHasLoadedForms] = useState(false);
  const [isCreatingForm, setIsCreatingForm] = useState(false);

  // Fetch forms on component mount
  useEffect(() => {
    const loadForms = async () => {
      try {
        await fetchForms();
        setHasLoadedForms(true);
      } catch (error) {
        console.error("Error loading forms:", error);
        toast.error('خطأ في تحميل النماذج');
      }
    };

    // If we have initial forms, use those first, then fetch
    if (initialForms && initialForms.length > 0) {
      setLocalForms(initialForms);
      if (forceRefresh) {
        loadForms();
      }
    } else {
      loadForms();
    }
  }, [forceRefresh, fetchForms, initialForms]);

  // Update local forms when the forms from hook change
  useEffect(() => {
    if (hasLoadedForms && forms && forms.length > 0) {
      // Remove duplicates based on form ID
      const uniqueForms = Array.from(
        new Map(forms.map(form => [form.id, form])).values()
      );
      setLocalForms(uniqueForms);
      console.log("Updated local forms with deduplicated data:", uniqueForms.length);
    }
  }, [forms, hasLoadedForms]);

  const handleCreateForm = async () => {
    try {
      // Prevent multiple clicks
      if (isCreatingForm) {
        console.log("Form creation already in progress, ignoring click");
        return;
      }
      
      console.log("Starting form creation process...");
      setIsCreatingForm(true);
      
      const loadingToast = toast.loading('جاري إنشاء نموذج جديد...');
      
      const newForm = await createDefaultForm();
      toast.dismiss(loadingToast);
      
      if (newForm && newForm.id) {
        console.log("Form created successfully, navigating to:", newForm.id);
        
        // Show success toast
        toast.success('تم إنشاء النموذج بنجاح');
        
        // Add a sufficient delay to ensure form state is properly initialized
        setTimeout(() => {
          navigate(`/form-builder/${newForm.id}`);
          // Reset creation state after navigation
          setIsCreatingForm(false);
        }, 1000); // Increased delay to ensure form state is initialized
      } else {
        console.error("Form creation failed, no ID returned");
        toast.error('خطأ في إنشاء نموذج جديد');
        setIsCreatingForm(false);
      }
    } catch (error) {
      console.error("Error creating form:", error);
      toast.error('خطأ في إنشاء نموذج جديد');
      setIsCreatingForm(false);
    }
  };

  const handleSelectForm = (formId: string) => {
    console.log("Selecting form:", formId);
    if (formId) {
      navigate(`/form-builder/${formId}`);
    } else {
      console.error("Cannot select form: Invalid form ID");
      toast.error('معرف النموذج غير صالح');
    }
  };

  const handleSelectTemplate = async (templateId: number) => {
    try {
      if (isCreatingForm) {
        console.log("Form creation already in progress, ignoring template selection");
        return;
      }
      
      setIsTemplateDialogOpen(false);
      setIsCreatingForm(true);
      
      const loadingToast = toast.loading('جاري إنشاء نموذج من القالب...');
      
      console.log("Creating form from template:", templateId);
      const newForm = await createFormFromTemplate(templateId);
      toast.dismiss(loadingToast);
      
      if (newForm && newForm.id) {
        console.log("Template form created successfully, navigating to:", newForm.id);
        
        toast.success('تم إنشاء النموذج من القالب بنجاح');
        
        // Add a sufficient delay to ensure form state is properly initialized
        setTimeout(() => {
          navigate(`/form-builder/${newForm.id}`);
          // Reset creation state after navigation
          setIsCreatingForm(false);
        }, 1000); // Increased delay to ensure form state is initialized
      } else {
        console.error("Template form creation failed, no ID returned");
        toast.error('خطأ في إنشاء نموذج من القالب');
        setIsCreatingForm(false);
      }
    } catch (error) {
      console.error("Error creating form from template:", error);
      toast.error('خطأ في إنشاء نموذج من القالب');
      setIsCreatingForm(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">النماذج</h1>
          <p className="text-gray-500">إدارة نماذج الدفع عند الاستلام</p>
        </div>
        
        <div className="flex space-x-3 rtl:space-x-reverse">
          <Button 
            variant="outline"
            onClick={() => setIsTemplateDialogOpen(true)}
            disabled={isCreatingForm}
          >
            استخدام قالب
          </Button>
          
          <Button 
            onClick={handleCreateForm} 
            disabled={isLoading || isCreatingForm}
          >
            <Plus className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
            إنشاء نموذج جديد
          </Button>
        </div>
      </div>
      
      <FormList 
        forms={localForms} 
        isLoading={isLoading && !localForms.length} 
        onSelectForm={handleSelectForm}
      />
      
      <FormTemplatesDialog
        open={isTemplateDialogOpen}
        onSelect={handleSelectTemplate}
        onClose={() => setIsTemplateDialogOpen(false)}
      />
    </div>
  );
};

export default FormBuilderDashboard;
