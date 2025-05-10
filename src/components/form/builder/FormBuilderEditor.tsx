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
import { FormStyle } from '@/hooks/useFormEditor';

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
  const loadAttemptRef = useRef<number>(0);
  const maxLoadAttempts = 3;
  
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
    updateFormMeta,
    setFormElements
  } = useFormEditor(id);

  // Add reference to track if there are any open dialogs
  const openDialogRef = useRef<boolean>(false);
  
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
        const success = await handleSave();
        if (!success) {
          toast.error(language === 'ar' ? 'فشل الحفظ التلقائي، يرجى المحاولة مرة أخرى' : 'Auto-save failed, please try again');
        }
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
    if (!id) {
      console.log("No form ID provided");
      return;
    }
    
    if (initialLoadCompleted.current) {
      console.log("Initial load already completed, skipping");
      return;
    }
    
    console.log('FormBuilderEditor: Loading form data for ID:', id);
    
    // Adding an abort controller to prevent multiple loads
    const controller = new AbortController();
    
    // Use a cleanup function to prevent state updates after unmount
    const loadData = async () => {
      try {
        loadAttemptRef.current += 1;
        console.log(`Starting form data load for: ${id} (attempt ${loadAttemptRef.current}/${maxLoadAttempts})`);
        
        const loadedId = await loadFormData(id);
        
        if (loadedId) {
          initialLoadCompleted.current = true;
          console.log('Form data loaded successfully for:', loadedId);
        } else {
          console.error(`Form load failed for ID: ${id}`);
          
          if (loadAttemptRef.current < maxLoadAttempts) {
            console.log(`Retrying form load (attempt ${loadAttemptRef.current + 1}/${maxLoadAttempts})...`);
            
            // Retry with exponential backoff
            const retryDelay = 1000 * Math.pow(2, loadAttemptRef.current - 1);
            setTimeout(() => {
              if (!controller.signal.aborted) {
                loadData();
              }
            }, retryDelay);
          } else {
            toast.error(language === 'ar' ? 'فشل تحميل النموذج بعد عدة محاولات' : 'Failed to load form after multiple attempts');
          }
        }
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
  }, [id, loadFormData, language, maxLoadAttempts]); 

  // Update safe save function to check dialog state
  const safeSave = useCallback(async (): Promise<boolean> => {
    return new Promise((resolve) => {
      // Skip save if dialog is open
      if (openDialogRef.current) {
        console.log('Skipping save, dialog is open');
        resolve(false);
        return;
      }
      
      // Force immediate save instead of debounced to ensure we get a response
      handleSave().then(success => {
        resolve(success);
      }).catch(error => {
        console.error("Error during save:", error);
        resolve(false);
      });
    });
  }, [handleSave]);

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
      
      // Properly reorder the array using arrayMove
      const newElements = arrayMove([...formElements], oldIndex, newIndex);
      
      // Update the entire elements array instead of just one element
      setFormElements(newElements);
      
      // Trigger debounced save after reordering
      debouncedSave();
    } catch (error) {
      console.error("Error in handleDragEnd:", error);
    }
  }, [formElements, setFormElements, debouncedSave]);

  // Custom wrapper functions to adapt between different function signatures

  // Adapt addElement to accept string type and create a basic element
  const handleAddElement = useCallback((type: string) => {
    // Create a basic FormField from the type
    const newElement: FormField = {
      id: Math.random().toString(36).substring(2, 9),
      type: type,
      label: `New ${type}`,
      required: false
    };
    
    addElement(newElement);
    debouncedSave();
  }, [addElement, debouncedSave]);

  // Adapt updateElement to match interface requirements
  const handleUpdateElement = useCallback((field: FormField) => {
    const index = formElements.findIndex(el => el.id === field.id);
    if (index !== -1) {
      updateElement(index, field);
      debouncedSave();
    }
  }, [formElements, updateElement, debouncedSave]);

  // Adapt updateFormMeta to match required signature
  const handleUpdateMeta = useCallback((field: 'title' | 'description' | 'submitButtonText', value: string) => {
    const metadata: {[key: string]: string} = {};
    metadata[field] = value;
    updateFormMeta(metadata);
    debouncedSave();
  }, [updateFormMeta, debouncedSave]);

  // Adapt style change to match required signature
  const handleStyleChange = useCallback((key: string, value: string) => {
    const newStyle: Partial<FormStyle> = {};
    newStyle[key as keyof FormStyle] = value;
    handleStyleChange(newStyle);
    debouncedSave();
  }, [handleStyleChange, debouncedSave]);

  // Manual save handler that shows clear feedback and returns void
  const manualSaveHandler = useCallback(async () => {
    try {
      toast.loading(language === 'ar' ? 'جاري حفظ النموذج...' : 'Saving form...');
      const success = await handleSave();
      
      if (success) {
        toast.success(language === 'ar' ? 'تم حفظ النموذج بنجاح' : 'Form saved successfully');
      } else {
        toast.error(language === 'ar' ? 'فشل في حفظ النموذج' : 'Failed to save form');
      }
    } catch (error) {
      console.error("Error during manual save:", error);
      toast.error(language === 'ar' ? 'خطأ في حفظ النموذج' : 'Error saving form');
    }
  }, [handleSave, language]);

  // Publish handler wrapper to return void
  const handlePublishWrapper = useCallback(async () => {
    try {
      await handlePublish();
    } catch (error) {
      console.error("Error publishing form:", error);
      toast.error(language === 'ar' ? 'خطأ في نشر النموذج' : 'Error publishing form');
    }
  }, [handlePublish, language]);

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
      
      // Use the adapted handlers to match the required signatures
      onSelectElement={setSelectedElementIndex}
      onAddElement={handleAddElement}
      onEditElement={(index: number) => {
        setSelectedElementIndex(index);
      }}
      onDeleteElement={deleteElement}
      onDuplicateElement={duplicateElement}
      onUpdateElement={handleUpdateElement}
      onDragEnd={handleDragEnd}
      onUpdateMeta={handleUpdateMeta}
      onStyleChange={handleStyleChange}
      onSave={manualSaveHandler}
      onPublish={handlePublishWrapper}
      onShopifyIntegration={shopifyIntegration.syncForm}
      
      // Add reference for open dialogs
      dialogRef={openDialogRef}
    />
  );
};

export default FormBuilderEditor;
