
import React, { useEffect, useRef, useCallback } from 'react';
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
  const saveTimeoutRef = useRef<number | null>(null);
  const initialLoadCompleted = useRef<boolean>(false);
  
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

  // Debounced save function to prevent multiple rapid saves
  const debouncedSave = useCallback(() => {
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    
    // Set a new timeout
    saveTimeoutRef.current = window.setTimeout(async () => {
      try {
        console.log('Executing debounced save...');
        await handleSave();
      } catch (error) {
        console.error("Error in debounced save:", error);
        toast.error(language === 'ar' ? 'خطأ في حفظ النموذج' : 'Error saving form');
      }
      saveTimeoutRef.current = null;
    }, 1000); // 1 second debounce
  }, [handleSave, language]);

  // Cleanup function for timeouts
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, []);

  // Load form data on component mount or when formId changes
  useEffect(() => {
    if (!id || initialLoadCompleted.current) return;
    
    console.log('FormBuilderEditor: Loading form data for ID:', id);
    
    // Adding an abort controller to prevent multiple loads
    const controller = new AbortController();
    
    // Use a cleanup function to prevent state updates after unmount
    const loadData = async () => {
      try {
        console.log('Starting form data load for:', id);
        await loadFormData(id);
        initialLoadCompleted.current = true;
        console.log('Form data loaded successfully for:', id);
      } catch (err) {
        console.error("Error loading form data:", err);
        if (!controller.signal.aborted) {
          toast.error(language === 'ar' ? 'خطأ في تحميل بيانات النموذج' : 'Error loading form data');
        }
      }
    };
    
    loadData();
    
    return () => {
      controller.abort();
    };
  }, [id, loadFormData, language]); 

  // Safe save handler with debounce
  const safeSave = useCallback(() => {
    debouncedSave();
  }, [debouncedSave]);

  // Handle form drag-and-drop reordering with improved error handling
  const handleDragEnd = useCallback((event: any) => {
    try {
      const { active, over } = event;
      
      if (!over || active.id === over.id) {
        return;
      }
      
      const oldIndex = formElements.findIndex((item) => item.id === active.id);
      const newIndex = formElements.findIndex((item) => item.id === over.id);
      
      if (oldIndex === -1 || newIndex === -1) {
        console.error("Invalid drag indices:", {oldIndex, newIndex, active, over});
        return;
      }
      
      // Using formEditor's state setters
      updateElement({
        ...formElements[oldIndex],
      });
      
      // Trigger debounced save
      safeSave();
    } catch (error) {
      console.error("Error in handleDragEnd:", error);
    }
  }, [formElements, updateElement, safeSave]);

  // Handle Shopify integration with improved error handling
  const handleShopifyIntegration = useCallback(async (settings: any) => {
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
      await handleSave();
    } catch (error) {
      console.error("Error saving Shopify settings:", error);
      toast.error(
        language === 'ar'
          ? 'حدث خطأ أثناء حفظ إعدادات شوبيفاي'
          : 'Error saving Shopify settings'
      );
    }
  }, [currentFormId, language, shopifyIntegration, handleSave]);

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
      
      // Handlers - using the safe save wrapper for any direct save operations
      onSelectElement={setSelectedElementIndex}
      onAddElement={addElement}
      onEditElement={(index: number) => {
        setSelectedElementIndex(index);
      }}
      onDeleteElement={deleteElement}
      onDuplicateElement={duplicateElement}
      onUpdateElement={updateElement}
      onDragEnd={handleDragEnd}
      onUpdateMeta={updateFormMeta}
      onStyleChange={handleStyleChange}
      onSave={safeSave}
      onPublish={handlePublish}
      onShopifyIntegration={handleShopifyIntegration}
    />
  );
};

export default FormBuilderEditor;
