
import { useState, useEffect, useCallback } from 'react';
import { FormField, FormStep } from '@/lib/form-utils';
import { useFormStore } from '@/hooks/useFormStore';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { v4 as uuidv4 } from 'uuid';
import { standardizeFormData, withRetry } from '@/lib/form-utils/standardizeFormData';

export interface FormStyle {
  primaryColor: string;
  borderRadius: string;
  fontSize: string;
  buttonStyle: string;
}

export const useFormEditor = (formId?: string) => {
  const { t, language } = useI18n();
  const { formState, setFormState, resetFormState } = useFormStore();
  const { saveForm, publishForm, loadForm } = useFormTemplates();
  
  const [currentFormId, setCurrentFormId] = useState<string | undefined>(formId);
  const [formTitle, setFormTitle] = useState<string>('نموذج جديد');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formElements, setFormElements] = useState<Array<FormField>>([]);
  const [submitButtonText, setSubmitButtonText] = useState('إرسال الطلب');
  const [formStyle, setFormStyle] = useState<FormStyle>({
    primaryColor: '#9b87f5',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    buttonStyle: 'rounded',
  });
  
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [currentPreviewStep, setCurrentPreviewStep] = useState<number>(1);
  const [saveRetries, setSaveRetries] = useState<number>(0);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);
  const [currentSaveRequestId, setCurrentSaveRequestId] = useState<string | null>(null);
  const maxSaveRetries = 3;

  // Get active shop ID for database operations - memoized to prevent rerenders
  const getActiveShopId = useCallback(() => {
    return localStorage.getItem('shopify_store') || sessionStorage.getItem('shopify_store');
  }, []);

  // Initialize a new form if no form ID is provided - memoized
  const initializeNewForm = useCallback(async () => {
    try {
      const shopId = getActiveShopId();
      if (!shopId) {
        toast.error(language === 'ar' ? 'لم يتم العثور على متجر نشط' : 'No active shop found');
        return;
      }

      // Create a new ID for the form
      const newId = uuidv4();
      setCurrentFormId(newId);

      // Prepare initial standardized form data
      const initialFormSteps = standardizeFormData([], formStyle, submitButtonText);

      // Create new form in database with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      let success = false;

      while (!success && retryCount < maxRetries) {
        try {
          const { data, error } = await supabase.from('forms').insert({
            id: newId,
            title: formTitle,
            description: formDescription,
            data: initialFormSteps,
            shop_id: shopId,
            is_published: false,
            submitbuttontext: submitButtonText
          }).select();

          if (error) {
            console.error(`Attempt ${retryCount + 1} failed:`, error);
            retryCount++;
            
            if (retryCount >= maxRetries) {
              throw error;
            }
            
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
          } else {
            success = true;
          }
        } catch (err) {
          console.error(`Error on attempt ${retryCount + 1}:`, err);
          retryCount++;
          
          if (retryCount >= maxRetries) {
            throw err;
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
        }
      }

      if (!success) {
        throw new Error('Failed to create new form after multiple attempts');
      }

      // Update form state
      resetFormState(); // Clear any previous form state
      setFormState({
        id: newId,
        title: formTitle,
        description: formDescription,
        data: initialFormSteps,
        isPublished: false,
        shop_id: shopId,
        submitButtonText: submitButtonText
      });

      toast.success(language === 'ar' ? 'تم إنشاء نموذج جديد بنجاح' : 'New form created successfully');
    } catch (error) {
      console.error("Error initializing new form:", error);
      toast.error(language === 'ar' ? 'خطأ في إنشاء نموذج جديد' : 'Error initializing new form');
    }
  }, [formTitle, formDescription, submitButtonText, formStyle, getActiveShopId, language, resetFormState, setFormState]);

  // Load form data - memoized with useCallback to prevent it from changing on each render
  const loadFormData = useCallback(async (id?: string) => {
    if (!id) {
      await initializeNewForm();
      return;
    }

    // Set loading flag to prevent duplicate loads
    if (hasLoaded && id === currentFormId) {
      console.log("Skipping duplicate form load for ID:", id);
      return;
    }
    
    console.log("Loading form data for ID:", id);
    setCurrentFormId(id);
    
    try {
      // Reset form state before loading new form
      resetFormState();
      
      // Fetch form from database with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      let formData = null;
      
      while (!formData && retryCount < maxRetries) {
        try {
          const { data, error } = await supabase
            .from('forms')
            .select('*')
            .eq('id', id)
            .maybeSingle();
          
          if (error) {
            console.error(`Attempt ${retryCount + 1} to load form failed:`, error);
            retryCount++;
            
            if (retryCount >= maxRetries) {
              throw error;
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
          } else if (!data) {
            if (retryCount >= maxRetries - 1) {
              toast.error(language === 'ar' ? 'لم يتم العثور على النموذج' : 'Form not found');
              return;
            }
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
          } else {
            formData = data;
          }
        } catch (err) {
          console.error(`Error on attempt ${retryCount + 1} to load form:`, err);
          retryCount++;
          
          if (retryCount >= maxRetries) {
            throw err;
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
        }
      }
      
      if (!formData) {
        toast.error(language === 'ar' ? 'لم يتم العثور على النموذج' : 'Form not found');
        return;
      }
      
      // Extract form data
      setFormTitle(formData.title || 'نموذج جديد');
      setFormDescription(formData.description || '');
      
      // Extract fields from steps
      if (formData.data && Array.isArray(formData.data) && formData.data.length > 0) {
        const formFields = formData.data.flatMap(step => step.fields || []);
        setFormElements(formFields);
        
        // Extract style properties from metadata if available
        let formMetadata = undefined;
        if (formData.data && Array.isArray(formData.data) && formData.data.length > 0) {
          // Check if metadata exists, if not create it
          if (formData.data[0] && formData.data[0].metadata && formData.data[0].metadata.formStyle) {
            formMetadata = formData.data[0].metadata.formStyle;
          }
        }
        
        if (formMetadata) {
          setFormStyle({
            primaryColor: formMetadata.primaryColor || '#9b87f5',
            borderRadius: formMetadata.borderRadius || '0.5rem',
            fontSize: formMetadata.fontSize || '1rem',
            buttonStyle: formMetadata.buttonStyle || 'rounded'
          });
          
          if (formMetadata.submitButtonText) {
            setSubmitButtonText(formMetadata.submitButtonText);
          }
        }
        
        // Check for submit button text in main data - handle both cases
        if (formData.submitbuttontext) {
          setSubmitButtonText(formData.submitbuttontext);
        }
      }
      
      setIsPublished(!!formData.isPublished || !!formData.is_published);
      
      // Update form state in store
      setFormState({
        ...formData,
        isPublished: formData.is_published,
        // Ensure style properties are set
        primaryColor: formStyle.primaryColor,
        borderRadius: formStyle.borderRadius,
        fontSize: formStyle.fontSize,
        buttonStyle: formStyle.buttonStyle,
        submitButtonText: formData.submitbuttontext || submitButtonText
      });
      
      console.log("Loaded form data:", formData);
      // Mark as loaded to prevent redundant loads
      setHasLoaded(true);
    } catch (error) {
      console.error("Error loading form:", error);
      toast.error(language === 'ar' ? 'خطأ في تحميل النموذج' : 'Error loading form');
    }
  }, [
    currentFormId, 
    hasLoaded, 
    initializeNewForm, 
    language, 
    resetFormState, 
    setFormState, 
    formStyle, 
    submitButtonText
  ]);

  // Handle saving form data with retry mechanism
  const handleSave = useCallback(async () => {
    if (isSaving) {
      console.log("Save operation already in progress, skipping duplicate save");
      return;
    }
    
    // Generate a unique ID for this save request
    const requestId = uuidv4();
    setCurrentSaveRequestId(requestId);
    setIsSaving(true);
    
    try {
      if (!currentFormId) {
        toast.error(language === 'ar' ? 'لم يتم العثور على معرف النموذج' : 'Form ID not found');
        setIsSaving(false);
        return;
      }
      
      // Create standardized form steps from elements
      const formSteps = standardizeFormData(formElements, formStyle, submitButtonText);
      
      const shopId = getActiveShopId();
      
      if (!shopId) {
        console.warn("No active shop ID found, saving without shop association");
      }
      
      // Prepare all form data for saving - fix case sensitivity issue with submitButtonText/submitbuttontext
      const dbData = {
        title: formTitle,
        description: formDescription,
        data: formSteps,
        shop_id: shopId,
        updated_at: new Date().toISOString(),
        submitbuttontext: submitButtonText // Using lowercase to match database column name
      };
      
      console.log("Saving form with data:", dbData);
      console.log("RequestID:", requestId);
      
      // Try direct update
      try {
        const { error } = await supabase
          .from('forms')
          .update(dbData)
          .eq('id', currentFormId);
          
        if (error) {
          console.error("Update error:", error);
          throw error;
        }
        
        // Only process if this is still the current save request
        if (requestId === currentSaveRequestId) {
          // Reset save retries on successful save
          setSaveRetries(0);
          
          // Update form state in memory
          setFormState({
            id: currentFormId,
            title: formTitle,
            description: formDescription,
            data: formSteps,
            shop_id: shopId,
            submitButtonText: submitButtonText,
            primaryColor: formStyle.primaryColor,
            borderRadius: formStyle.borderRadius,
            fontSize: formStyle.fontSize,
            buttonStyle: formStyle.buttonStyle
          });
          
          toast.success(language === 'ar' ? 'تم حفظ النموذج بنجاح' : 'Form saved successfully');
          setRefreshKey(prev => prev + 1);
          setIsSaving(false); // Make sure to set saving to false on success
        } else {
          console.log("Save request superseded by a newer request");
          setIsSaving(false); // Also set saving to false if request was superseded
        }
      } catch (error) {
        // If direct update fails, try alternate saving method
        console.error("Direct database update failed:", error);
        
        if (requestId === currentSaveRequestId) {
          try {
            // Try using the saveForm method from useFormTemplates as fallback
            const alternateSuccess = await saveForm(currentFormId, {
              title: formTitle,
              description: formDescription,
              data: formSteps,
              submitbuttontext: submitButtonText, // Using lowercase to match database column name
              // Include other necessary fields
              primaryColor: formStyle.primaryColor,
              borderRadius: formStyle.borderRadius,
              fontSize: formStyle.fontSize,
              buttonStyle: formStyle.buttonStyle
            });
            
            if (alternateSuccess) {
              toast.success(language === 'ar' ? 'تم حفظ النموذج بنجاح (بديل)' : 'Form saved successfully (alternate)');
              setRefreshKey(prev => prev + 1);
              setSaveRetries(0);
            } else {
              throw new Error('Both save methods failed');
            }
          } catch (innerError) {
            console.error("Error in alternate save method:", innerError);
            toast.error(language === 'ar' ? 'خطأ في حفظ النموذج' : 'Error saving form');
          } finally {
            setIsSaving(false); // Important: Always set isSaving to false in finally block
          }
        } else {
          console.log("Failed save request superseded");
          setIsSaving(false);
        }
      }
    } catch (error) {
      if (requestId === currentSaveRequestId) {
        console.error("Error saving form:", error);
        toast.error(language === 'ar' ? 'خطأ في حفظ النموذج' : 'Error saving form');
        setIsSaving(false); // Important: Set isSaving to false on error
      }
    } finally {
      if (requestId === currentSaveRequestId) {
        setIsSaving(false); // Ensure isSaving is always set to false
      }
    }
  }, [
    currentFormId,
    formDescription,
    formElements,
    formStyle,
    formTitle,
    getActiveShopId,
    isSaving,
    language,
    maxSaveRetries,
    saveForm,
    setFormState,
    submitButtonText,
    currentSaveRequestId
  ]);

  // Handle publishing form
  const handlePublish = useCallback(async () => {
    if (!currentFormId) {
      toast.error(language === 'ar' ? 'لم يتم العثور على معرف النموذج' : 'Form ID not found');
      return;
    }
    
    setIsPublishing(true);
    
    try {
      // Save form before publishing to ensure latest changes are included
      await handleSave();
      
      // Toggle publish status
      const newPublishState = !isPublished;
      
      // Try direct database update for publishing
      const { error } = await supabase
        .from('forms')
        .update({
          is_published: newPublishState,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentFormId);
      
      if (error) {
        console.error("Direct database update for publishing failed:", error);
        
        // If direct update fails, try using the publishForm method
        const success = await publishForm(currentFormId, newPublishState);
        
        if (success) {
          setIsPublished(newPublishState);
          toast.success(
            newPublishState 
              ? (language === 'ar' ? 'تم نشر النموذج بنجاح' : 'Form published successfully')
              : (language === 'ar' ? 'تم إلغاء نشر النموذج' : 'Form unpublished')
          );
        } else {
          toast.error(language === 'ar' ? 'فشل تغيير حالة النشر' : 'Failed to change publish status');
        }
      } else {
        setIsPublished(newPublishState);
        toast.success(
          newPublishState 
            ? (language === 'ar' ? 'تم نشر النموذج بنجاح' : 'Form published successfully')
            : (language === 'ar' ? 'تم إلغاء نشر النموذج' : 'Form unpublished')
        );
        
        // Update form state in memory
        setFormState({
          ...formState,
          isPublished: newPublishState
        });
      }
    } catch (error) {
      console.error("Error publishing form:", error);
      toast.error(language === 'ar' ? 'خطأ في نشر النموذج' : 'Error publishing form');
    } finally {
      setIsPublishing(false);
    }
  }, [currentFormId, formState, handleSave, isPublished, language, publishForm, setFormState]);

  // Update form field operations with useCallback
  const addElement = useCallback((type: string) => {
    const newElement = {
      type,
      id: `${type}-${Date.now()}`,
      label: language === 'ar' ? `${type} جديد` : `New ${type}`,
      placeholder: language === 'ar' ? `أدخل ${type}` : `Enter ${type}`,
      content: type === 'text/html' ? '<p>محتوى HTML</p>' : undefined,
    };
    
    const updatedElements = [...formElements, newElement];
    setFormElements(updatedElements);
    setTimeout(() => {
      setSelectedElementIndex(updatedElements.length - 1);
      setRefreshKey(prev => prev + 1);
    }, 100);
  }, [formElements, language]);

  // Delete element with auto-save
  const deleteElement = useCallback((index: number) => {
    const updatedElements = [...formElements];
    updatedElements.splice(index, 1);
    setFormElements(updatedElements);
    setSelectedElementIndex(null);
    setRefreshKey(prev => prev + 1);
    
    // Save after deleting element
    setTimeout(() => handleSave(), 300);
  }, [formElements, handleSave]);

  // Duplicate element with auto-save
  const duplicateElement = useCallback((index: number) => {
    const element = formElements[index];
    const newElement = {
      ...element,
      id: `${element.id}-copy-${Date.now()}`
    };
    
    const updatedElements = [...formElements];
    updatedElements.splice(index + 1, 0, newElement);
    setFormElements(updatedElements);
    
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
      handleSave();
    }, 100);
    toast.success(language === 'ar' ? 'تم نسخ العنصر بنجاح' : 'Element duplicated successfully');
  }, [formElements, handleSave, language]);

  // Update element with auto-save
  const updateElement = useCallback((updatedField: FormField) => {
    const newElements = [...formElements];
    const index = newElements.findIndex(el => el.id === updatedField.id);
    if (index !== -1) {
      newElements[index] = updatedField;
      setFormElements(newElements);
    }
    
    setTimeout(() => {
      setSelectedElementIndex(null);
      setRefreshKey(prev => prev + 1);
      handleSave();
    }, 100);
  }, [formElements, handleSave]);

  // Handle style changes with auto-save
  const handleStyleChange = useCallback((key: string, value: string) => {
    setFormStyle(prev => ({
      ...prev,
      [key]: value
    }));
    
    setTimeout(() => handleSave(), 300);
  }, [handleSave]);

  // Update form meta information with auto-save
  const updateFormMeta = useCallback((field: 'title' | 'description' | 'submitButtonText', value: string) => {
    if (field === 'title') {
      setFormTitle(value);
    } else if (field === 'description') {
      setFormDescription(value);
    } else if (field === 'submitButtonText') {
      setSubmitButtonText(value);
    }
    
    setTimeout(() => handleSave(), 500);
  }, [handleSave]);

  // Initial load effect - uses the memoized callback and has proper dependency array
  useEffect(() => {
    if (!hasLoaded && formId) {
      loadFormData(formId);
    }
  }, [formId, hasLoaded, loadFormData]);

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
    
    // Methods
    setFormTitle,
    setFormDescription,
    setSubmitButtonText,
    setFormElements,
    setFormStyle,
    setSelectedElementIndex,
    setCurrentPreviewStep,
    setRefreshKey,
    
    loadFormData,
    handleSave,
    handlePublish,
    handleStyleChange,
    addElement,
    deleteElement,
    duplicateElement,
    updateElement,
    updateFormMeta
  };
};
