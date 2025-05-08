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
  const { language } = useI18n();
  const { forms, isLoading, fetchForms, createFormFromTemplate, createDefaultForm } = useFormTemplates();
  
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [localForms, setLocalForms] = useState(initialForms || []);
  const [hasLoadedForms, setHasLoadedForms] = useState(false);

  // Fetch forms on component mount
  useEffect(() => {
    const loadForms = async () => {
      try {
        await fetchForms();
        setHasLoadedForms(true);
      } catch (error) {
        console.error("Error loading forms:", error);
        toast.error(language === 'ar' ? 'خطأ في تحميل النماذج' : 'Error loading forms');
      }
    };

    loadForms();
  }, [forceRefresh]);

  // Update local forms when the forms from hook change, ensuring uniqueness by ID
  useEffect(() => {
    if (hasLoadedForms && forms && forms.length > 0) {
      // Remove duplicates by ID
      const uniqueForms = Array.from(
        new Map(forms.map(form => [form.id, form])).values()
      );
      
      setLocalForms(uniqueForms);
    }
  }, [forms, hasLoadedForms]);

  const handleCreateForm = async () => {
    try {
      const newForm = await createDefaultForm();
      if (newForm) {
        // Navigate to form builder with the new form ID
        navigate(`/form-builder/${newForm.id}`);
      }
    } catch (error) {
      console.error("Error creating form:", error);
      toast.error(language === 'ar' ? 'خطأ في إنشاء نموذج جديد' : 'Error creating new form');
    }
  };

  const handleSelectForm = (formId: string) => {
    navigate(`/form-builder/${formId}`);
  };

  const handleSelectTemplate = async (templateId: number) => {
    try {
      setIsTemplateDialogOpen(false);
      const newForm = await createFormFromTemplate(templateId);
      
      if (newForm) {
        // Navigate to form builder with the new form ID
        navigate(`/form-builder/${newForm.id}`);
      }
    } catch (error) {
      console.error("Error creating form from template:", error);
      toast.error(
        language === 'ar'
          ? 'خطأ في إنشاء نموذج من القالب'
          : 'Error creating form from template'
      );
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {language === 'ar' ? 'النماذج' : 'Forms'}
          </h1>
          <p className="text-gray-500">
            {language === 'ar' ? 'إدارة نماذج الدفع عند الاستلام' : 'Manage your Cash On Delivery forms'}
          </p>
        </div>
        
        <div className="flex space-x-3 rtl:space-x-reverse">
          <Button 
            variant="outline"
            onClick={() => setIsTemplateDialogOpen(true)}
          >
            {language === 'ar' ? 'استخدام قالب' : 'Use Template'}
          </Button>
          
          <Button onClick={handleCreateForm}>
            <Plus className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {language === 'ar' ? 'إنشاء نموذج جديد' : 'Create New Form'}
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
