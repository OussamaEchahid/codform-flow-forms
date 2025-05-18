
import React, { useState, useEffect } from 'react';
import { useFormStore } from '@/hooks/useFormStore';
import { FormData, useFormTemplates } from '@/lib/hooks/useFormTemplates';
import FormPreviewPanel from '@/components/form/builder/FormPreviewPanel';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import FormElementEditor from '@/components/form/builder/FormElementEditor';
import FormSettingsPanel from '@/components/form/builder/FormSettingsPanel';
import { createEmptyField, FormField } from '@/lib/form-utils';
import { v4 as uuidv4 } from 'uuid';

interface FormBuilderEditorProps {
  formId: string;
}

const FormBuilderEditor: React.FC<FormBuilderEditorProps> = ({ formId }) => {
  const { language } = useI18n();
  const { formState, setFormState, resetFormState } = useFormStore();
  const { getForm, saveForm, publishForm } = useFormTemplates();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [previewRefresh, setPreviewRefresh] = useState(0);
  const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null);
  
  // Load form data from API
  useEffect(() => {
    const loadFormData = async () => {
      setLoading(true);
      
      try {
        const formData = await getForm(formId);
        if (formData) {
          // Ensure form has all required data
          const processedForm = processFormData(formData);
          
          // Update form state
          setFormState({
            id: formData.id,
            title: formData.title,
            description: formData.description,
            data: formData.data,
            isPublished: formData.is_published,
            shop_id: formData.shop_id,
            style: {
              primaryColor: formData.primaryColor || formData.style?.primaryColor || '#9b87f5',
              borderRadius: formData.borderRadius || formData.style?.borderRadius || '0.5rem',
              fontSize: formData.fontSize || formData.style?.fontSize || '1rem',
              buttonStyle: formData.buttonStyle || formData.style?.buttonStyle || 'rounded'
            }
          });
          
          setError('');
        } else {
          setError(language === 'ar' 
            ? 'تعذر العثور على النموذج'
            : 'Form not found');
        }
      } catch (err) {
        console.error('Error loading form:', err);
        setError(language === 'ar'
          ? 'حدث خطأ أثناء تحميل النموذج'
          : 'Error loading form');
      } finally {
        setLoading(false);
      }
    };
    
    loadFormData();
  }, [formId, getForm, language, setFormState]);
  
  // Process form data to ensure it has all required fields
  const processFormData = (form: FormData): FormData => {
    // Check if form has title field
    const allFields: FormField[] = form.data.flatMap(step => step.fields);
    const hasTitleField = allFields.some(field => field.type === 'form-title');
    
    // If there's no title field, add one to the start of the first step
    if (!hasTitleField && form.data.length > 0) {
      const titleField: FormField = {
        id: `form-title-${Date.now()}`,
        type: 'form-title',
        label: form.title,
        helpText: form.description || '',
        style: {
          color: '#ffffff',
          backgroundColor: form.style?.primaryColor || form.primaryColor || '#9b87f5',
          fontSize: '24px',
          fontWeight: 'bold',
          textAlign: language === 'ar' ? 'right' : 'left',
          descriptionColor: 'rgba(255, 255, 255, 0.9)',
          descriptionFontSize: '14px',
          showTitle: true,
          showDescription: !!form.description
        }
      };
      
      // Add title field to first step
      form.data[0].fields = [titleField, ...form.data[0].fields];
    }
    
    return form;
  };
  
  // Handle save form
  const handleSaveForm = async (data: {
    title: string;
    description: string;
    style: {
      primaryColor: string;
      borderRadius: string;
      fontSize: string;
      buttonStyle: string;
    };
    fields: FormField[];
  }) => {
    setSaving(true);
    
    try {
      // Update title field with new values if it exists
      const updatedData = [...formState.data];
      const allFields: FormField[] = formState.data.flatMap(step => step.fields);
      const titleField = allFields.find(field => field.type === 'form-title');
      
      if (titleField) {
        // Find which step contains the title field
        for (let i = 0; i < updatedData.length; i++) {
          const stepFields = updatedData[i].fields;
          const titleIndex = stepFields.findIndex(field => field.type === 'form-title');
          
          if (titleIndex !== -1) {
            // Update the title field
            updatedData[i].fields[titleIndex] = {
              ...stepFields[titleIndex],
              label: data.title,
              helpText: data.description
            };
            break;
          }
        }
      }
      
      const success = await saveForm(formId, {
        title: data.title,
        description: data.description,
        data: updatedData,
        primaryColor: data.style.primaryColor,
        borderRadius: data.style.borderRadius,
        fontSize: data.style.fontSize,
        buttonStyle: data.style.buttonStyle
      });
      
      if (success) {
        // Update local form state
        setFormState({
          title: data.title,
          description: data.description,
          data: updatedData,
          style: data.style
        });
        
        setPreviewRefresh(prev => prev + 1);
        return true;
      } else {
        throw new Error('Failed to save form');
      }
    } catch (err) {
      console.error('Error saving form:', err);
      return false;
    } finally {
      setSaving(false);
    }
  };
  
  // Add element to form
  const handleAddElement = (type: string) => {
    const newField = createEmptyField(type as any);
    
    if (formState.data.length === 0) {
      // Create first step if none exists
      setFormState({
        data: [{
          id: '1',
          title: 'Step 1',
          fields: [newField]
        }]
      });
    } else {
      // Add to first step
      const updatedData = [...formState.data];
      updatedData[0].fields.push(newField);
      setFormState({ data: updatedData });
    }
    
    setPreviewRefresh(prev => prev + 1);
    toast.success(language === 'ar'
      ? 'تمت إضافة العنصر بنجاح'
      : 'Element added successfully');
  };
  
  // Delete element from form
  const handleDeleteElement = (index: number) => {
    if (formState.data.length > 0) {
      const updatedData = [...formState.data];
      updatedData[0].fields.splice(index, 1);
      setFormState({ data: updatedData });
      setPreviewRefresh(prev => prev + 1);
      
      toast.success(language === 'ar'
        ? 'تم حذف العنصر بنجاح'
        : 'Element deleted successfully');
    }
  };
  
  // Edit element
  const handleEditElement = (index: number) => {
    setSelectedElementIndex(index);
    // Open edit modal or focus on element's settings
  };
  
  // Duplicate element
  const handleDuplicateElement = (index: number) => {
    if (formState.data.length > 0) {
      const elementToDuplicate = formState.data[0].fields[index];
      const duplicatedElement = {
        ...elementToDuplicate,
        id: uuidv4(),
        label: `${elementToDuplicate.label} (${language === 'ar' ? 'نسخة' : 'Copy'})`
      };
      
      const updatedData = [...formState.data];
      updatedData[0].fields.splice(index + 1, 0, duplicatedElement);
      setFormState({ data: updatedData });
      setPreviewRefresh(prev => prev + 1);
      
      toast.success(language === 'ar'
        ? 'تم نسخ العنصر بنجاح'
        : 'Element duplicated successfully');
    }
  };
  
  // Reorder elements
  const handleReorderElements = (newFields: FormField[]) => {
    if (formState.data.length > 0) {
      const updatedData = [...formState.data];
      updatedData[0].fields = newFields;
      setFormState({ data: updatedData });
      setPreviewRefresh(prev => prev + 1);
    }
  };
  
  // Update element
  const handleUpdateElement = (index: number, updatedElement: FormField) => {
    if (formState.data.length > 0) {
      const updatedData = [...formState.data];
      updatedData[0].fields[index] = updatedElement;
      setFormState({ data: updatedData });
      setPreviewRefresh(prev => prev + 1);
    }
  };
  
  // Force refresh preview
  const handleRefreshPreview = () => {
    setPreviewRefresh(prev => prev + 1);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-semibold text-red-600">{error}</h3>
        <p className="mt-2">
          {language === 'ar'
            ? 'يرجى تحديث الصفحة والمحاولة مرة أخرى'
            : 'Please refresh the page and try again'}
        </p>
      </div>
    );
  }
  
  const { title, description, data, style } = formState;
  
  // Find form title field for settings
  const allFields: FormField[] = data.flatMap(step => step.fields);
  const fields = data.length > 0 ? data[0].fields : [];
  
  return (
    <div className="container mx-auto p-4 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-3 space-y-6">
          <FormSettingsPanel 
            formId={formId}
            initialTitle={title}
            initialDescription={description || ''}
            initialStyle={style || {
              primaryColor: '#9b87f5',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              buttonStyle: 'rounded'
            }}
            initialFields={fields}
            onSave={handleSaveForm}
            onPreviewRefresh={handleRefreshPreview}
          />
          
          <FormElementEditor 
            elements={fields}
            selectedIndex={selectedElementIndex}
            onSelectElement={setSelectedElementIndex}
            onEditElement={handleEditElement}
            onDeleteElement={handleDeleteElement}
            onDuplicateElement={handleDuplicateElement}
            onReorderElements={handleReorderElements}
            onUpdateElement={handleUpdateElement}
          />
        </div>
        
        <div className="md:col-span-2">
          <div className="sticky top-4">
            <FormPreviewPanel
              formTitle={title}
              formDescription={description || ''}
              currentStep={1}
              totalSteps={data.length}
              formStyle={style || {
                primaryColor: '#9b87f5',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                buttonStyle: 'rounded'
              }}
              fields={fields}
              refreshKey={previewRefresh}
              floatingButton={undefined}
              hideFloatingButtonPreview={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBuilderEditor;
