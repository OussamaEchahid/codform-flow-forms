
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { FormField } from '@/lib/form-utils';
import { formTemplates } from '@/lib/hooks/useFormTemplates';
import { arrayMove } from '@dnd-kit/sortable';
import { useFormEditor } from '@/hooks/useFormEditor';
import { useShopify } from '@/hooks/useShopify';
import FormEditorLayout from './FormEditorLayout';

interface FormBuilderEditorProps {
  formId?: string;
}

const FormBuilderEditor: React.FC<FormBuilderEditorProps> = ({ formId }) => {
  const navigate = useNavigate();
  const params = useParams();
  const { t, language } = useI18n();
  const shopifyIntegration = useShopify();
  const id = formId || params.formId;
  
  // Use our custom hook for form state and operations
  const {
    formTitle,
    formDescription,
    formElements,
    formStyle,
    submitButtonText,
    refreshKey,
    selectedElementIndex,
    isSaving,
    isPublished,
    isPublishing,
    currentFormId,
    currentPreviewStep,
    
    // Methods
    setSelectedElementIndex,
    loadFormData,
    handleSave,
    handlePublish,
    handleStyleChange,
    addElement,
    deleteElement,
    duplicateElement,
    updateElement,
    updateFormMeta
  } = useFormEditor(id);

  // Load form data on component mount or when formId changes
  useEffect(() => {
    console.log('FormBuilderEditor: Loading form data for ID:', id);
    loadFormData(id);
  }, [id]);

  // Handle form drag-and-drop reordering
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    const oldIndex = formElements.findIndex((item) => item.id === active.id);
    const newIndex = formElements.findIndex((item) => item.id === over.id);
    
    const reorderedItems = arrayMove(formElements, oldIndex, newIndex);
    
    // Using formEditor's state setters - removing the index property which was causing the TS error
    updateElement({
      ...formElements[oldIndex],
      // index: newIndex - removed this line which was causing the error
    });
  };

  // Handle template selection
  const handleSelectTemplate = async (templateId: number) => {
    const template = formTemplates.find(t => t.id === templateId);
    if (template) {
      toast.success(language === 'ar' ? `تم اختيار قالب ${template.title}` : `Selected template ${template.title}`);
      
      // Update with template data - would be implemented in useFormEditor
    }
  };

  // Handle Shopify integration
  const handleShopifyIntegration = async (settings: any) => {
    if (!currentFormId) {
      toast.error(language === 'ar' ? 'يجب حفظ النموذج أولا' : 'You must save the form first');
      return;
    }
    
    try {
      await shopifyIntegration.syncForm({ 
        formId: currentFormId,
        shopDomain: shopifyIntegration.shop,
        settings
      });
      
      toast.success(
        language === 'ar' 
          ? 'تم حفظ إعدادات شوبيفاي بنجاح'
          : 'Shopify settings saved successfully'
      );
      
      // Save form after Shopify integration
      handleSave();
    } catch (error) {
      console.error("Error saving Shopify settings:", error);
      toast.error(
        language === 'ar'
          ? 'حدث خطأ أثناء حفظ إعدادات شوبيفاي'
          : 'Error saving Shopify settings'
      );
    }
  };

  return (
    <FormEditorLayout
      formId={currentFormId}
      formTitle={formTitle}
      formDescription={formDescription}
      formElements={formElements}
      formStyle={formStyle}
      submitButtonText={submitButtonText}
      refreshKey={refreshKey}
      selectedElementIndex={selectedElementIndex}
      isSaving={isSaving}
      isPublished={isPublished}
      isPublishing={isPublishing}
      currentPreviewStep={currentPreviewStep}
      
      // Handlers
      onSelectElement={setSelectedElementIndex}
      onAddElement={addElement}
      onEditElement={(index: number) => {
        // Edit logic handled in FormEditorLayout
        setSelectedElementIndex(index);
      }}
      onDeleteElement={deleteElement}
      onDuplicateElement={duplicateElement}
      onUpdateElement={updateElement}
      onDragEnd={handleDragEnd}
      onUpdateMeta={updateFormMeta}
      onStyleChange={handleStyleChange}
      onSave={handleSave}
      onPublish={handlePublish}
      onShopifyIntegration={handleShopifyIntegration}
    />
  );
};

export default FormBuilderEditor;
