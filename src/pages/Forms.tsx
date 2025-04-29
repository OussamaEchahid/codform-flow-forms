
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import FormTemplatesDialog from '@/components/form/FormTemplatesDialog';
import FormList from '@/components/form/FormList';

const Forms = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const { 
    forms, 
    isLoading, 
    fetchForms, 
    createDefaultForm, 
    createFormFromTemplate 
  } = useFormTemplates();
  
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = React.useState(false);
  
  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const handleCreateForm = async () => {
    const newForm = await createDefaultForm();
    if (newForm) {
      navigate(`/form-builder/${newForm.id}`);
    }
  };

  const handleSelectForm = (formId: string) => {
    navigate(`/form-builder/${formId}`);
  };

  const handleSelectTemplate = async (templateId: number) => {
    const newForm = await createFormFromTemplate(templateId);
    if (newForm) {
      navigate(`/form-builder/${newForm.id}`);
    }
    setIsTemplateDialogOpen(false);
  };

  if (!user) {
    return <div className="text-center py-8">{language === 'ar' ? 'يرجى تسجيل الدخول للوصول إلى قسم النماذج' : 'Please login to access forms'}</div>;
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
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
        </div>
        
        <FormTemplatesDialog 
          open={isTemplateDialogOpen}
          onSelect={handleSelectTemplate} 
          onClose={() => setIsTemplateDialogOpen(false)}
        />
      </div>
    </div>
  );
};

export default Forms;
