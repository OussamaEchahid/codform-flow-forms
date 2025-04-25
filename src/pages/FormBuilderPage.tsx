import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { FileText } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useFormTemplates, FormData } from '@/lib/hooks/useFormTemplates';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/dialog';
import { useI18n } from '@/lib/i18n';
import FormTemplatesDialog from '@/components/form/FormTemplatesDialog';
import FieldEditor from '@/components/form/FieldEditor';
import { FormField, FormStep, formTemplates } from '@/lib/form-utils';
import FormBuilderHeader from '@/components/form-builder/FormBuilderHeader';
import FormBuilderContent from '@/components/form-builder/FormBuilderContent';
import FormBuilderSidebar from '@/components/form-builder/FormBuilderSidebar';

const availableFieldTypes = [
  { type: 'text', label: 'حقل نص', icon: <FileText size={16} /> },
  { type: 'email', label: 'بريد إلكتروني', icon: <FileText size={16} /> },
  { type: 'phone', label: 'رقم هاتف', icon: <FileText size={16} /> },
  { type: 'textarea', label: 'نص متعدد الأسطر', icon: <FileText size={16} /> },
];

const FormBuilderPage = () => {
  const { formId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { language } = useI18n();
  const { 
    forms, 
    isLoading, 
    fetchForms, 
    createDefaultForm, 
    createFormFromTemplate,
    saveForm,
    publishForm
  } = useFormTemplates();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'editor'>(formId ? 'editor' : 'dashboard');
  const [currentForm, setCurrentForm] = useState<FormData | null>(null);
  const [isStyleDialogOpen, setIsStyleDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [formStyle, setFormStyle] = useState({
    primaryColor: '#9b87f5',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    buttonStyle: 'rounded',
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [formElements, setFormElements] = useState<Array<{
    type: string;
    id: string;
    label: string;
    required?: boolean;
    placeholder?: string;
    content?: string;
    style?: {
      backgroundColor?: string;
      color?: string;
      fontSize?: string;
      borderRadius?: string;
      borderWidth?: string;
      borderColor?: string;
    };
  }>>([
    { type: 'title', id: 'title-1', label: language === 'ar' ? 'املأ النموذج للدفع عند الاستلام' : 'Fill the form for cash on delivery' },
    { type: 'text', id: 'name-1', label: language === 'ar' ? 'الاسم الكامل' : 'Full name', required: true, placeholder: language === 'ar' ? 'الاسم الكامل' : 'Full name' },
    { type: 'phone', id: 'phone-1', label: language === 'ar' ? 'رقم الهاتف' : 'Phone number', required: true, placeholder: language === 'ar' ? 'رقم الهاتف' : 'Phone number' },
    { type: 'text', id: 'city-1', label: language === 'ar' ? 'المدينة' : 'City', required: true, placeholder: language === 'ar' ? 'المدينة' : 'City' },
    { type: 'textarea', id: 'address-1', label: language === 'ar' ? 'العنوان' : 'Address', required: true, placeholder: language === 'ar' ? 'العنوان' : 'address' },
    { type: 'cart-items', id: 'cart-1', label: language === 'ar' ? 'المنتج' : 'Product item' },
    { type: 'submit', id: 'submit-1', label: language === 'ar' ? 'شراء بالدفع عند الاستلام' : 'Buy with Cash on Delivery' }
  ]);
  const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isFieldEditorOpen, setIsFieldEditorOpen] = useState(false);
  const [currentEditingField, setCurrentEditingField] = useState<FormField | null>(null);
  const [formTitle, setFormTitle] = useState(language === 'ar' ? 'نموذج جديد' : 'New Form');
  const [formDescription, setFormDescription] = useState('');
  const [formSteps, setFormSteps] = useState<FormStep[]>([
    {
      id: '1',
      title: 'Step 1',
      fields: []
    }
  ]);
  const [currentPreviewStep, setCurrentPreviewStep] = useState(1);
  const [currentEditStep, setCurrentEditStep] = useState(0);

  useEffect(() => {
    if (formId) {
      setActiveTab('editor');
    } else {
      fetchForms();
      setActiveTab('dashboard');
    }
  }, [formId, fetchForms]);

  const handleCreateForm = async () => {
    const newForm = await createDefaultForm();
    if (newForm) {
      navigate(`/form-builder/${newForm.id}`);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success(language === 'ar' ? 'تم حفظ النموذج بنجاح' : 'Form saved successfully');
    }, 1000);
  };

  const handlePublish = () => {
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      toast.success(language === 'ar' ? 'تم نشر النموذج بنجاح' : 'Form published successfully');
    }, 1000);
  };

  const handleSelectTemplate = useCallback(async (templateId: number) => {
    const template = formTemplates.find(t => t.id === templateId);
    if (template) {
      toast.success(language === 'ar' ? `تم اختيار قالب ${template.title}` : `Selected template ${template.title}`);
      
      setActiveTab('editor');
      setIsTemplateDialogOpen(false);
    }
  }, [language, activeTab]);

  if (!user) {
    return <div className="text-center py-8">
      {language === 'ar' ? 'يرجى تسجيل الدخول للوصول إلى منشئ النماذج' : 'Please login to access the form builder'}
    </div>;
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      <main className="flex-1">
        <FormBuilderHeader
          onSave={handleSave}
          onPublish={handlePublish}
          onStyleClick={() => setIsStyleDialogOpen(true)}
          onTemplateClick={() => setIsTemplateDialogOpen(true)}
          isSaving={isSaving}
          isPublishing={isPublishing}
          isPublished={currentForm?.is_published || false}
        />
        
        <div className="grid grid-cols-12 gap-6 p-6">
          <FormBuilderContent
            steps={formSteps}
            currentEditStep={currentEditStep}
            onStepSelect={setCurrentEditStep}
            onAddStep={() => {}}
            availableFieldTypes={availableFieldTypes}
            onAddField={() => {}}
            formTitle={formTitle}
            formDescription={formDescription}
            onTitleChange={setFormTitle}
            onDescriptionChange={setFormDescription}
            formStyle={formStyle}
            onStyleChange={() => {}}
          />
          
          <FormBuilderSidebar
            formTitle={formTitle}
            formDescription={formDescription}
            currentStep={currentPreviewStep}
            totalSteps={formSteps.length}
            formStyle={formStyle}
            fields={[]}
            onStepChange={setCurrentPreviewStep}
          />
        </div>
      </main>

      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <FormTemplatesDialog 
          onSelect={handleSelectTemplate} 
          onClose={() => setIsTemplateDialogOpen(false)}
        />
      </Dialog>

      {isFieldEditorOpen && currentEditingField && (
        <FieldEditor
          field={currentEditingField}
          onSave={() => {}}
          onClose={() => setIsFieldEditorOpen(false)}
        />
      )}
    </div>
  );
};

export default FormBuilderPage;
