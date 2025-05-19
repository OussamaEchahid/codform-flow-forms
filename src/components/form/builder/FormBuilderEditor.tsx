
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FormStyleEditor from '@/components/form/builder/FormStyleEditor';
import FormElementList from '@/components/form/builder/FormElementList';
import FormElementEditor from '@/components/form/builder/FormElementEditor';
import FormPreviewPanel from '@/components/form/builder/FormPreviewPanel';
import FloatingButtonEditor from '@/components/form/builder/FloatingButtonEditor';
import ShopifyIntegration from '@/components/form/builder/ShopifyIntegration';
import FormHeader from '@/components/form/builder/FormHeader';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { useFormStore } from '@/hooks/useFormStore';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import { FormField } from '@/lib/form-utils';

// Add the new import for FormTitleSection
import FormTitleSection, { TitleConfig } from './FormTitleSection';

interface FormBuilderEditorProps {
  formId: string;
}

const defaultFormStyle = {
  primaryColor: '#9b87f5',
  borderRadius: '0.5rem',
  fontSize: '1rem',
  buttonStyle: 'rounded',
};

const FormBuilderEditor = ({ formId }: FormBuilderEditorProps) => {
  const { language } = useI18n();
  const { saveForm, forms } = useFormTemplates();
  const formStore = useFormStore();
  const { floatingButton, updateFloatingButton } = useFormStore();
  const [form, setForm] = useState<any>({ 
    title: 'New Form', 
    description: '', 
    data: [], 
    style: defaultFormStyle 
  });
  const [cachedTitle, setCachedTitle] = useState(form.title);
  const [cachedDescription, setCachedDescription] = useState(form.description || '');
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null);
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Add new state for stable title configuration
  const [titleConfig, setTitleConfig] = useState<TitleConfig>({
    title: form.title,
    description: form.description || '',
    backgroundColor: form.style?.primaryColor || '#9b87f5',
    textColor: '#ffffff',
    descriptionColor: 'rgba(255, 255, 255, 0.9)',
    textAlign: language === 'ar' ? 'right' : 'left',
    fontSize: '24px',
    descriptionFontSize: '14px'
  });

  // Fetch the form data when component mounts
  useEffect(() => {
    const fetchForm = async () => {
      if (formId) {
        setIsLoading(true);
        try {
          // Find the form in the forms array using the formId
          const formData = forms.find(f => f.id === formId);
          
          if (formData) {
            setForm(formData);
          } else {
            console.error('Form not found with ID:', formId);
            toast.error(language === 'ar' ? 'لم يتم العثور على النموذج' : 'Form not found');
          }
        } catch (error) {
          console.error('Error fetching form:', error);
          toast.error(language === 'ar' ? 'حدث خطأ أثناء جلب بيانات النموذج' : 'Error fetching form data');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchForm();
  }, [formId, forms, language]);

  // Add effect to initialize title config when form data is loaded
  useEffect(() => {
    if (form && !isLoading) {
      // Try to find existing form-title field
      const existingTitleField = form.data
        .flatMap((step: any) => step.fields)
        .find((field: FormField) => field.type === 'form-title');
      
      if (existingTitleField) {
        setTitleConfig({
          title: existingTitleField.label || form.title,
          description: existingTitleField.helpText || form.description || '',
          backgroundColor: existingTitleField.style?.backgroundColor || form.style?.primaryColor || '#9b87f5',
          textColor: existingTitleField.style?.color || '#ffffff',
          descriptionColor: existingTitleField.style?.descriptionColor || 'rgba(255, 255, 255, 0.9)',
          textAlign: (existingTitleField.style?.textAlign as 'left' | 'center' | 'right') || 
                    (language === 'ar' ? 'right' : 'left'),
          fontSize: existingTitleField.style?.fontSize || '24px',
          descriptionFontSize: existingTitleField.style?.descriptionFontSize || '14px'
        });
      } else {
        setTitleConfig({
          title: form.title,
          description: form.description || '',
          backgroundColor: form.style?.primaryColor || '#9b87f5',
          textColor: '#ffffff',
          descriptionColor: 'rgba(255, 255, 255, 0.9)',
          textAlign: language === 'ar' ? 'right' : 'left',
          fontSize: '24px',
          descriptionFontSize: '14px'
        });
      }
      
      // Also update cached values
      setCachedTitle(form.title);
      setCachedDescription(form.description || '');
    }
  }, [form, isLoading, language]);

  const currentStepFields = form.data[currentStep - 1]?.fields || [];

  const handleAddElement = (elementType: string) => {
    // Create a new element based on the type
    const newElement: FormField = {
      id: `field-${Date.now()}`,
      type: elementType,
      label: language === 'ar' ? 'عنصر جديد' : 'New Element',
      required: false,
      // Add any other default properties needed based on element type
    };
    
    const updatedData = [...form.data];
    if (!updatedData[currentStep - 1]) {
      updatedData[currentStep - 1] = {
        id: currentStep.toString(),
        title: `Step ${currentStep}`,
        fields: []
      };
    }
    updatedData[currentStep - 1].fields.push(newElement);
    setForm({ ...form, data: updatedData });
    setPreviewRefreshKey(prev => prev + 1);
  };

  const handleElementReorder = (newElements: FormField[]) => {
    const updatedData = [...form.data];
    updatedData[currentStep - 1] = {
      ...updatedData[currentStep - 1],
      fields: newElements
    };
    setForm({ ...form, data: updatedData });
    setPreviewRefreshKey(prev => prev + 1);
  };

  const editElement = (index: number) => {
    setSelectedElementIndex(index);
  };

  const deleteElement = (index: number) => {
    const updatedData = [...form.data];
    updatedData[currentStep - 1].fields.splice(index, 1);
    setForm({ ...form, data: updatedData });
    setSelectedElementIndex(null);
    setPreviewRefreshKey(prev => prev + 1);
  };

  const duplicateElement = (index: number) => {
    const updatedData = [...form.data];
    const elementToDuplicate = updatedData[currentStep - 1].fields[index];
    const duplicatedElement = { ...elementToDuplicate };
    updatedData[currentStep - 1].fields.splice(index + 1, 0, duplicatedElement);
    setForm({ ...form, data: updatedData });
    setPreviewRefreshKey(prev => prev + 1);
  };

  const updateElement = (index: number, updatedElement: FormField) => {
    const updatedData = [...form.data];
    updatedData[currentStep - 1].fields[index] = updatedElement;
    setForm({ ...form, data: updatedData });
    setSelectedElementIndex(null);
    setPreviewRefreshKey(prev => prev + 1);
  };

  // Handler for title config changes
  const handleTitleConfigChange = useCallback((newConfig: TitleConfig) => {
    setTitleConfig(newConfig);
    setForm({
      ...form,
      title: newConfig.title,
      description: newConfig.description
    });
    // Trigger preview refresh
    setPreviewRefreshKey(prev => prev + 1);
  }, [form]);

  // Handle form data saving with title config
  const handleFormSave = async () => {
    setIsSaving(true);
    
    try {
      // Clone current form state to avoid direct mutations
      const formToSave = { ...form };
      
      // Update form title and description
      formToSave.title = titleConfig.title;
      formToSave.description = titleConfig.description;
      
      // Remove any existing form-title fields from all steps
      formToSave.data = formToSave.data.map((step: any) => ({
        ...step,
        fields: step.fields.filter((field: FormField) => field.type !== 'form-title')
      }));
      
      // Save the updated form - fixed to pass formId as first parameter
      await saveForm(formId, formToSave);
      
      setCachedTitle(formToSave.title);
      setCachedDescription(formToSave.description || '');
      
      toast.success(language === 'ar' 
        ? 'تم حفظ النموذج بنجاح' 
        : 'Form saved successfully');
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error(language === 'ar' 
        ? 'حدث خطأ أثناء حفظ النموذج' 
        : 'Error saving form');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStyleChange = (newStyle: any) => {
    setForm({ ...form, style: newStyle });
    setPreviewRefreshKey(prev => prev + 1);
  };

  const handleFloatingButtonUpdate = (config: any) => {
    updateFloatingButton(config);
    setPreviewRefreshKey(prev => prev + 1);
  };

  return (
    <div className="p-4 md:p-6 max-w-screen-2xl mx-auto">
      <FormHeader 
        onSave={handleFormSave}
        onPublish={() => {}}
        onStyleOpen={() => {}}
        onTemplateOpen={() => {}}
        onFloatingButtonOpen={() => {}}
        isSaving={isSaving}
        isPublishing={false}
        isPublished={false}
      />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* Add the new FormTitleSection component */}
          <FormTitleSection 
            titleConfig={titleConfig}
            onTitleChange={handleTitleConfigChange}
            formPrimaryColor={form.style?.primaryColor || '#9b87f5'}
            borderRadius={form.style?.borderRadius || '0.5rem'}
          />
          
          <FormStyleEditor 
            formStyle={form.style || defaultFormStyle}
            onStyleChange={handleStyleChange}
            onSave={handleFormSave}
          />

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className={language === 'ar' ? 'text-right' : ''}>
                {language === 'ar' ? 'محتوى النموذج' : 'Form Content'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="elements" className="w-full">
                <TabsList className="w-full grid grid-cols-2 mb-6">
                  <TabsTrigger value="elements">{language === 'ar' ? 'عناصر النموذج' : 'Form Elements'}</TabsTrigger>
                  <TabsTrigger value="steps">{language === 'ar' ? 'خطوات النموذج' : 'Form Steps'}</TabsTrigger>
                </TabsList>

                <TabsContent value="elements" className="p-1">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1 border rounded-lg p-4 bg-gray-50">
                      <FormElementList 
                        onAddElement={handleAddElement}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <FormElementEditor 
                        elements={currentStepFields}
                        selectedIndex={selectedElementIndex}
                        onSelectElement={setSelectedElementIndex}
                        onEditElement={editElement}
                        onDeleteElement={deleteElement}
                        onDuplicateElement={duplicateElement}
                        onReorderElements={handleElementReorder}
                        onUpdateElement={updateElement}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="steps" className="p-1">
                  <div>Steps Content</div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <FloatingButtonEditor 
            floatingButton={floatingButton}
            onChange={handleFloatingButtonUpdate}
          />
          
          <ShopifyIntegration 
            formId={formId}
          />
        </div>
        
        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-4">
            <FormPreviewPanel 
              formTitle={form.title}
              formDescription={form.description || ''}
              currentStep={currentStep}
              totalSteps={form.data.length}
              formStyle={form.style || defaultFormStyle}
              fields={currentStepFields}
              refreshKey={previewRefreshKey}
              floatingButton={floatingButton}
              customTitleConfig={titleConfig}
            />
          </div>
        </div>
      </div>

      <div>Dialogs and Modals</div>
    </div>
  );
};

export default FormBuilderEditor;
