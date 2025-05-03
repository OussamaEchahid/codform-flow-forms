
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import FormTemplatesDialog from '@/components/form/FormTemplatesDialog';
import FormList from '@/components/form/FormList';
import { Dialog } from '@/components/ui/dialog';

const FormBuilderDashboard = () => {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const { forms, isLoading, fetchForms, createDefaultForm, createFormFromTemplate } = useFormTemplates();
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = React.useState(false);

  const handleCreateForm = async () => {
    try {
      console.log("Creating default form...");
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
    }
  };

  const handleSelectForm = (formId: string) => {
    navigate(`/form-builder/${formId}`);
  };

  const handleSelectTemplate = async (templateId: number) => {
    try {
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
    }
    setIsTemplateDialogOpen(false);
  };

  return (
    <div className="flex-1 p-8">
      <div className="max-w-[1400px] mx-auto">
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
            >
              {language === 'ar' ? 'استخدام قالب' : 'Use Template'}
            </Button>
            <Button 
              onClick={handleCreateForm} 
              className="bg-[#9b87f5] hover:bg-[#7E69AB]"
            >
              <Plus className="mr-2 h-4 w-4" />
              {language === 'ar' ? 'إنشاء نموذج جديد' : 'Create New Form'}
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
