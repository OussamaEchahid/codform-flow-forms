import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Save, FileCheck, Palette, FileText } from 'lucide-react';
import FormPreview from './FormPreview';
import FormTemplatesDialog from './FormTemplatesDialog';
import FieldEditor from './FieldEditor';
import { FormField } from '@/lib/form-utils';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { FormData, useFormTemplates, formTemplates } from '@/lib/hooks/useFormTemplates';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import StepEditor from './builder/StepEditor';
import FieldTypeList from './builder/FieldTypeList';
import FieldListEditor from './builder/FieldListEditor';
import FormStyleDialog from './builder/FormStyleDialog';
import FormSettings from './builder/FormSettings';
import useFormBuilder from '@/hooks/useFormBuilder';

interface FormBuilderProps {
  initialFormData: FormData;
}

const FormBuilder: React.FC<FormBuilderProps> = ({ initialFormData }) => {
  const navigate = useNavigate();
  const { language } = useI18n();
  const { saveForm, publishForm } = useFormTemplates();
  
  // States from custom hook
  const {
    formTitle,
    setFormTitle,
    formDescription,
    setFormDescription,
    formSteps,
    setFormSteps,
    currentPreviewStep,
    setCurrentPreviewStep,
    currentEditStep,
    setCurrentEditStep,
    previewRefresh,
    setPreviewRefresh,
    formStyle,
    handleStyleChange,
    addFieldToStep,
    formDirection,
    toggleFormDirection
  } = useFormBuilder({ initialFormData });
  
  // UI state management
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isFieldEditorOpen, setIsFieldEditorOpen] = useState(false);
  const [isStyleDialogOpen, setIsStyleDialogOpen] = useState(false);
  const [currentEditingField, setCurrentEditingField] = useState<FormField | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const handleSaveForm = async () => {
    setIsSaving(true);
    const saved = await saveForm(initialFormData.id, {
      title: formTitle,
      description: formDescription,
      data: formSteps
    });
    setIsSaving(false);
    
    if (saved) {
      toast.success(language === 'ar' ? 'تم حفظ النموذج بنجاح' : 'Form saved successfully');
    }
  };

  const handlePublishForm = async () => {
    setIsPublishing(true);
    const published = await publishForm(initialFormData.id, !initialFormData.is_published);
    setIsPublishing(false);
    
    if (published) {
      navigate('/form-builder');
    }
  };
  
  const applyTemplate = (templateId: number) => {
    const template = formTemplates.find(t => t.id === templateId);
    if (template) {
      setFormSteps(template.data);
      setFormTitle(template.title);
      setFormDescription(template.description);
      setIsTemplateDialogOpen(false);
      setPreviewRefresh(prev => prev + 1);
      toast.success(`${language === 'ar' ? 'تم تطبيق قالب' : 'Applied template'} ${template.title} ${language === 'ar' ? 'بنجاح' : 'successfully'}`);
    }
  };

  const editField = (field: FormField) => {
    setCurrentEditingField(field);
    setIsFieldEditorOpen(true);
  };

  const saveField = (updatedField: FormField) => {
    const updatedSteps = [...formSteps];
    const stepIndex = currentEditStep;
    const fieldIndex = updatedSteps[stepIndex].fields.findIndex(f => f.id === updatedField.id);
    
    if (fieldIndex !== -1) {
      updatedSteps[stepIndex].fields[fieldIndex] = updatedField;
      setFormSteps(updatedSteps);
    }
    
    setIsFieldEditorOpen(false);
    setCurrentEditingField(null);
    setPreviewRefresh(prev => prev + 1);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleSaveForm}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <span className="animate-spin">
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                    <span>{language === 'ar' ? 'جاري الحفظ' : 'Saving...'}</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>{language === 'ar' ? 'حفظ' : 'Save'}</span>
                  </>
                )}
              </Button>
              <Button 
                variant={initialFormData.is_published ? "secondary" : "default"}
                onClick={handlePublishForm}
                disabled={isPublishing}
                className="flex items-center gap-2"
              >
                {isPublishing ? (
                  <span className="animate-spin">
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                ) : (
                  <FileCheck size={16} />
                )}
                <span>
                  {initialFormData.is_published 
                    ? (language === 'ar' ? 'إلغاء النشر' : 'Unpublish') 
                    : (language === 'ar' ? 'نشر النموذج' : 'Publish Form')}
                </span>
              </Button>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsStyleDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Palette size={16} />
                {language === 'ar' ? 'تخصيص المظهر' : 'Customize Appearance'}
              </Button>
              
              <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <FileText size={16} />
                    {language === 'ar' ? 'قوالب النماذج' : 'Form Templates'}
                  </Button>
                </DialogTrigger>
                <FormTemplatesDialog 
                  open={isTemplateDialogOpen}
                  onSelect={applyTemplate} 
                  onClose={() => setIsTemplateDialogOpen(false)} 
                />
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="steps">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="steps">{language === 'ar' ? 'الخطوات' : 'Steps'}</TabsTrigger>
                <TabsTrigger value="settings">{language === 'ar' ? 'الإعدادات' : 'Settings'}</TabsTrigger>
                <TabsTrigger value="design">{language === 'ar' ? 'التصميم' : 'Design'}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="steps" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <StepEditor 
                    formSteps={formSteps}
                    currentEditStep={currentEditStep}
                    setCurrentEditStep={setCurrentEditStep}
                    setFormSteps={setFormSteps}
                    setPreviewRefresh={setPreviewRefresh}
                  />
                  
                  <FieldTypeList onAddField={addFieldToStep} />
                </div>
                
                <FieldListEditor 
                  formSteps={formSteps}
                  currentEditStep={currentEditStep}
                  setFormSteps={setFormSteps}
                  setPreviewRefresh={setPreviewRefresh}
                  onEditField={editField}
                />
              </TabsContent>
              
              <TabsContent value="settings" className="mt-6">
                <FormSettings 
                  formTitle={formTitle}
                  setFormTitle={setFormTitle}
                  formDescription={formDescription}
                  setFormDescription={setFormDescription}
                  formDirection={formDirection}
                  onToggleDirection={toggleFormDirection}
                />
              </TabsContent>
              
              <TabsContent value="design" className="mt-6">
                <FormSettings 
                  formTitle={formTitle}
                  setFormTitle={setFormTitle}
                  formDescription={formDescription}
                  setFormDescription={setFormDescription}
                  formDirection={formDirection}
                  onToggleDirection={toggleFormDirection}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <div className="lg:col-span-5">
        <div className="sticky top-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-500">{language === 'ar' ? 'معاينة مباشرة' : 'Live Preview'}</div>
            <h3 className="text-lg font-medium text-right">{language === 'ar' ? 'معاينة النموذج' : 'Form Preview'}</h3>
          </div>
          
          <FormPreview 
            key={previewRefresh}
            formTitle={formTitle}
            formDescription={formDescription}
            currentStep={currentPreviewStep}
            totalSteps={formSteps.length}
            formStyle={formStyle}
            fields={formSteps[currentPreviewStep - 1]?.fields || []}
            formDirection={formDirection}
          >
            <div></div>
          </FormPreview>
          
          <div className="mt-4 flex justify-end">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setCurrentPreviewStep(prev => Math.max(prev - 1, 1))}
                disabled={currentPreviewStep === 1}
              >
                {language === 'ar' ? 'السابق' : 'Previous'}
              </Button>
              
              {currentPreviewStep < formSteps.length ? (
                <Button 
                  variant="default"
                  style={{ backgroundColor: formStyle.primaryColor }}
                  onClick={() => setCurrentPreviewStep(prev => Math.min(prev + 1, formSteps.length))}
                >
                  {language === 'ar' ? 'التالي' : 'Next'}
                </Button>
              ) : (
                <Button 
                  variant="default"
                  style={{ backgroundColor: formStyle.primaryColor }}
                >
                  {language === 'ar' ? 'إرسال الطلب' : 'Submit Order'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {isFieldEditorOpen && currentEditingField && (
        <FieldEditor
          field={currentEditingField}
          onSave={saveField}
          onClose={() => setIsFieldEditorOpen(false)}
        />
      )}
      
      <FormStyleDialog 
        open={isStyleDialogOpen}
        setOpen={setIsStyleDialogOpen}
        formStyle={formStyle}
        handleStyleChange={handleStyleChange}
      />
    </div>
  );
};

export default FormBuilder;
