import { useState, useCallback, useEffect, useRef } from 'react';
import { FormField, FormStep } from '@/lib/form-utils';
import { useFormStore } from '@/hooks/useFormStore';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';

export interface FormStyle {
  primaryColor: string;
  borderRadius: string;
  fontSize: string;
  buttonStyle: string;
}

export const useFormEditor = (formId?: string) => {
  const { formState, setFormState, resetFormState } = useFormStore();
  const { loadForm, saveForm, publishForm } = useFormTemplates();
  const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [currentPreviewStep, setCurrentPreviewStep] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0); // For force refreshing components
  const { language } = useI18n();
  
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const retryCount = useRef(0);
  const maxRetries = 3;
  const isMounted = useRef(true);
  
  // Form data from store
  const formTitle = formState.title || '';
  const formDescription = formState.description || '';
  const formElements: FormField[] = formState.data?.steps?.[0]?.fields || [];
  
  const formStyle: FormStyle = {
    primaryColor: formState.primaryColor || '#9b87f5',
    borderRadius: formState.borderRadius || '0.5rem',
    fontSize: formState.fontSize || '1rem',
    buttonStyle: formState.buttonStyle || 'rounded'
  };
  
  const submitButtonText = formState.submitButtonText || 'إرسال الطلب';
  const isPublished = formState.isPublished || formState.is_published || false;
  const currentFormId = formState.id;
  
  // Ensure cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, []);
  
  // Load form data
  const loadFormData = useCallback(async (id: string) => {
    try {
      console.log(`Loading form data for ID: ${id}`);
      const data = await loadForm(id);
      
      if (data) {
        // Fix: Add type check before accessing properties
        const formData = data as any; // Temporary cast to any to access properties
        const formFields = formData.data?.steps?.[0]?.fields || [];
        console.log(`Form loaded successfully with ${formFields.length} fields`);
        
        // Force refresh components
        setRefreshKey(prev => prev + 1);
        return formData.id;
      } else {
        console.error('Form data could not be loaded');
        return null;
      }
    } catch (error) {
      console.error('Error loading form:', error);
      return null;
    }
  }, [loadForm]);
  
  // Enhanced save function with retries and better error handling
  const handleSave = useCallback(async () => {
    if (isSaving) {
      console.log('Save already in progress, skipping');
      return false;
    }
    
    if (!currentFormId) {
      console.error('No form ID available for saving');
      return false;
    }
    
    setIsSaving(true);
    console.log(`Saving form ${currentFormId}...`);
    
    try {
      // Prepare save data
      const formData = {
        title: formTitle,
        description: formDescription,
        data: {
          steps: [
            {
              id: 'step-1',
              title: 'Step 1',
              fields: formElements
            }
          ],
          settings: {
            formStyle
          }
        },
        primaryColor: formStyle.primaryColor,
        borderRadius: formStyle.borderRadius,
        fontSize: formStyle.fontSize,
        buttonStyle: formStyle.buttonStyle,
        submitButtonText: submitButtonText,
        is_published: isPublished,
        isPublished: isPublished
      };
      
      // Try saving with retry logic
      const success = await saveForm(currentFormId, formData, retryCount.current, maxRetries);
      
      if (success) {
        console.log('Form saved successfully');
        retryCount.current = 0;
        
        // Force refresh components to reflect saved changes
        setRefreshKey(prev => prev + 1);
        
        if (isMounted.current) {
          setIsSaving(false);
        }
        return true;
      } else {
        // Retry logic
        if (retryCount.current < maxRetries) {
          retryCount.current += 1;
          console.log(`Save failed, retry attempt ${retryCount.current}/${maxRetries}`);
          
          // Retry after a delay
          if (saveTimeout.current) {
            clearTimeout(saveTimeout.current);
          }
          
          saveTimeout.current = setTimeout(() => {
            handleSave();
          }, 1000 * retryCount.current); // Exponential backoff
          
          return false;
        } else {
          console.error('Max retries reached, save failed');
          retryCount.current = 0;
          
          if (isMounted.current) {
            setIsSaving(false);
          }
          return false;
        }
      }
    } catch (error) {
      console.error('Error saving form:', error);
      
      // Reset saving state
      if (isMounted.current) {
        setIsSaving(false);
      }
      return false;
    }
  }, [
    currentFormId, 
    formTitle, 
    formDescription, 
    formElements, 
    formStyle, 
    submitButtonText, 
    isPublished, 
    saveForm, 
    isSaving
  ]);
  
  // Update form elements
  const setFormElements = useCallback((elements: FormField[]) => {
    const updatedData = {
      ...formState.data,
      steps: [
        {
          id: formState.data?.steps?.[0]?.id || 'step-1',
          title: formState.data?.steps?.[0]?.title || 'Step 1',
          fields: elements
        }
      ]
    };
    
    setFormState({ 
      data: updatedData 
    });
  }, [formState.data, setFormState]);
  
  // Update a single element
  const updateElement = useCallback((index: number, field: FormField) => {
    if (formElements[index]) {
      const updatedElements = [...formElements];
      updatedElements[index] = { ...field };
      setFormElements(updatedElements);
    }
  }, [formElements, setFormElements]);
  
  // Add a new element
  const addElement = useCallback((field: FormField) => {
    setFormElements([...formElements, field]);
  }, [formElements, setFormElements]);
  
  // Delete an element
  const deleteElement = useCallback((index: number) => {
    const updatedElements = formElements.filter((_, i) => i !== index);
    setFormElements(updatedElements);
    
    // Reset selected element if it was deleted
    if (selectedElementIndex === index) {
      setSelectedElementIndex(null);
    } else if (selectedElementIndex !== null && selectedElementIndex > index) {
      setSelectedElementIndex(selectedElementIndex - 1);
    }
  }, [formElements, selectedElementIndex, setFormElements]);
  
  // Duplicate an element
  const duplicateElement = useCallback((index: number) => {
    if (formElements[index]) {
      const element = formElements[index];
      const newElement = {
        ...element,
        id: `${element.id}-copy-${Date.now()}` // Ensure unique ID
      };
      
      const updatedElements = [...formElements];
      updatedElements.splice(index + 1, 0, newElement);
      setFormElements(updatedElements);
      
      // Select the newly duplicated element
      setSelectedElementIndex(index + 1);
    }
  }, [formElements, setFormElements]);
  
  // Update form metadata
  const updateFormMeta = useCallback((data: {[key: string]: string}) => {
    setFormState({
      ...data
    });
  }, [setFormState]);
  
  // Update form style
  const updateFormStyle = useCallback((style: Partial<FormStyle>) => {
    setFormState({
      ...style
    });
  }, [setFormState]);
  
  // Publish or unpublish form
  const handlePublish = useCallback(async () => {
    if (isPublishing || !currentFormId) return false;
    
    setIsPublishing(true);
    try {
      // First save the form
      await handleSave();
      
      // Then publish/unpublish
      const result = await publishForm(currentFormId, !isPublished);
      
      if (result) {
        setFormState({
          isPublished: !isPublished,
          is_published: !isPublished
        });
        
        toast.success(
          !isPublished 
            ? (language === 'ar' ? 'تم نشر النموذج بنجاح' : 'Form published successfully') 
            : (language === 'ar' ? 'تم إلغاء نشر النموذج' : 'Form unpublished successfully')
        );
      } else {
        toast.error(language === 'ar' ? 'فشل في تغيير حالة النشر' : 'Failed to change publish state');
      }
      
      if (isMounted.current) {
        setIsPublishing(false);
      }
      return result;
    } catch (error) {
      console.error('Error publishing form:', error);
      toast.error(language === 'ar' ? 'خطأ في تغيير حالة النشر' : 'Error changing publish state');
      
      if (isMounted.current) {
        setIsPublishing(false);
      }
      return false;
    }
  }, [currentFormId, handleSave, isPublished, isPublishing, language, publishForm, setFormState]);
  
  return {
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
    
    setSelectedElementIndex,
    loadFormData,
    handleSave,
    handlePublish,
    updateFormStyle,
    addElement,
    deleteElement,
    duplicateElement,
    updateElement,
    updateFormMeta,
    setFormElements
  };
};
