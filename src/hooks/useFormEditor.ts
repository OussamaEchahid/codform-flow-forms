
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
      console.log('Initializing new form...');
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
      console.log('Created standardized form structure:', initialFormSteps);

      // Create new form in database with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      let success = false;

      while (!success && retryCount < maxRetries) {
        try {
          console.log(`Creating new form in database (attempt ${retryCount + 1})`);
          const { data, error } = await supabase.from('forms').insert({
            id: newId,
            title: formTitle,
            description: formDescription,
            data: initialFormSteps,
            shop_id: shopId,
            is_published: false,
            submitbuttontext: submitButtonText,
            // Explicitly set style properties
            primaryColor: formStyle.primaryColor,
            borderRadius: formStyle.borderRadius,
            fontSize: formStyle.fontSize,
            buttonStyle: formStyle.buttonStyle
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
            console.log('Form created successfully:', data);
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
        submitButtonText: submitButtonText,
        // Explicitly set style properties in state too
        primaryColor: formStyle.primaryColor,
        borderRadius: formStyle.borderRadius,
        fontSize: formStyle.fontSize,
        buttonStyle: formStyle.buttonStyle
      });

      toast.success(language === 'ar' ? 'تم إنشاء نموذج جديد بنجاح' : 'New form created successfully');
      return newId;
    } catch (error) {
      console.error("Error initializing new form:", error);
      toast.error(language === 'ar' ? 'خطأ في إنشاء نموذج جديد' : 'Error initializing new form');
      return null;
    }
  }, [formTitle, formDescription, submitButtonText, formStyle, getActiveShopId, language, resetFormState, setFormState]);

  // Load form data - memoized with useCallback to prevent it from changing on each render
  const loadFormData = useCallback(async (id?: string) => {
    console.log("loadFormData called with id:", id);
    if (!id) {
      console.log("No form ID provided, initializing new form");
      const newId = await initializeNewForm();
      return newId;
    }

    // Set loading flag to prevent duplicate loads
    if (hasLoaded && id === currentFormId) {
      console.log("Skipping duplicate form load for ID:", id);
      return id;
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
          console.log(`Fetching form data (attempt ${retryCount + 1})...`);
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
            console.warn(`Form not found on attempt ${retryCount + 1}`);
            if (retryCount >= maxRetries - 1) {
              toast.error(language === 'ar' ? 'لم يتم العثور على النموذج' : 'Form not found');
              return null;
            }
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
          } else {
            formData = data;
            console.log("Form data retrieved successfully:", formData);
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
        return null;
      }
      
      // Extract form data
      setFormTitle(formData.title || 'نموذج جديد');
      setFormDescription(formData.description || '');
      setIsPublished(!!formData.isPublished || !!formData.is_published);
      
      // Get style properties directly from the form data
      const formStyleData = {
        primaryColor: formData.primaryColor || '#9b87f5',
        borderRadius: formData.borderRadius || '0.5rem',
        fontSize: formData.fontSize || '1rem',
        buttonStyle: formData.buttonStyle || 'rounded'
      };
      setFormStyle(formStyleData);
      
      // Get submit button text - check both versions
      const buttonText = formData.submitbuttontext || submitButtonText;
      setSubmitButtonText(buttonText);
      
      // Process form elements based on data structure
      let formFields: FormField[] = [];
      
      try {
        // Use standardized data handling
        console.log("Processing form data structure:", formData.data);
        if (formData.data) {
          // If data is a valid structure with steps
          if (formData.data.steps && Array.isArray(formData.data.steps)) {
            console.log("Found steps array in data:", formData.data.steps);
            formFields = formData.data.steps.flatMap(step => step.fields || []);
          } 
          // If data is directly an array of steps
          else if (Array.isArray(formData.data) && formData.data.length > 0) {
            console.log("Data is an array, processing as steps");
            formFields = formData.data.flatMap(step => step.fields || []);
          }
          // If data has fields directly
          else if (formData.data.fields && Array.isArray(formData.data.fields)) {
            console.log("Found direct fields array in data");
            formFields = formData.data.fields;
          }
        }
        
        console.log(`Processed ${formFields.length} form fields:`, formFields);
        setFormElements(formFields);
      } catch (err) {
        console.error("Error processing form fields:", err);
        // Default to empty fields if processing fails
        setFormElements([]);
      }
      
      // Update form state in store
      setFormState({
        ...formData,
        isPublished: formData.is_published,
        // Ensure style properties are set
        primaryColor: formStyleData.primaryColor,
        borderRadius: formStyleData.borderRadius,
        fontSize: formStyleData.fontSize,
        buttonStyle: formStyleData.buttonStyle,
        submitButtonText: buttonText
      });
      
      // Mark as loaded to prevent redundant loads
      setHasLoaded(true);
      return id;
    } catch (error) {
      console.error("Error loading form:", error);
      toast.error(language === 'ar' ? 'خطأ في تحميل النموذج' : 'Error loading form');
      return null;
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

  // Handle saving form data with improved retry mechanism and error handling
  const handleSave = useCallback(async () => {
    if (isSaving) {
      console.log("Save operation already in progress, skipping duplicate save");
      return false; // Return false to indicate save was not performed
    }
    
    // Generate a unique ID for this save request
    const requestId = uuidv4();
    setCurrentSaveRequestId(requestId);
    setIsSaving(true);
    console.log(`Starting save operation (${requestId})...`);
    
    try {
      if (!currentFormId) {
        console.error("No form ID available for save operation");
        toast.error(language === 'ar' ? 'لم يتم العثور على معرف النموذج' : 'Form ID not found');
        setIsSaving(false);
        return false;
      }
      
      // Create standardized form steps from elements
      console.log(`Creating standardized form data for ${formElements.length} elements`);
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
        submitbuttontext: submitButtonText, // Using lowercase to match database column name
        // Include style properties explicitly
        primaryColor: formStyle.primaryColor,
        borderRadius: formStyle.borderRadius,
        fontSize: formStyle.fontSize,
        buttonStyle: formStyle.buttonStyle
      };
      
      console.log("Saving form with data:", dbData);
      
      // Try direct update with multiple retries if needed
      let success = false;
      let retries = 0;
      const maxRetries = 3;
      
      while (!success && retries < maxRetries) {
        try {
          console.log(`Database update attempt ${retries + 1}/${maxRetries}`);
          const { error } = await supabase
            .from('forms')
            .update(dbData)
            .eq('id', currentFormId);
            
          if (error) {
            console.error(`Update attempt ${retries + 1} failed:`, error);
            retries++;
            
            if (retries >= maxRetries) {
              throw error;
            }
            
            // Wait with exponential backoff
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries - 1)));
          } else {
            console.log("Form saved successfully to database");
            success = true;
          }
        } catch (error) {
          console.error(`Error in update attempt ${retries + 1}:`, error);
          retries++;
          
          if (retries >= maxRetries) {
            throw error;
          }
          
          // Wait with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries - 1)));
        }
      }
      
      // If direct update succeeds
      if (success) {
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
          return true; // Return true to indicate successful save
        } else {
          console.log("Save request superseded by a newer request");
          setIsSaving(false);
          return false;
        }
      }
      
      // If direct update fails, try alternate saving method
      console.error("All direct database update attempts failed, trying alternative method");
      
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
            console.log("Form saved successfully using alternative method");
            toast.success(language === 'ar' ? 'تم حفظ النموذج بنجاح (بديل)' : 'Form saved successfully (alternate)');
            setRefreshKey(prev => prev + 1);
            setSaveRetries(0);
            setIsSaving(false);
            return true;
          } else {
            throw new Error('Both save methods failed');
          }
        } catch (innerError) {
          console.error("Error in alternate save method:", innerError);
          toast.error(language === 'ar' ? 'خطأ في حفظ النموذج' : 'Error saving form');
          setIsSaving(false);
          return false;
        }
      } else {
        console.log("Failed save request superseded");
        setIsSaving(false);
        return false;
      }
    } catch (error) {
      if (requestId === currentSaveRequestId) {
        console.error("Error saving form:", error);
        toast.error(language === 'ar' ? 'خطأ في حفظ النموذج' : 'Error saving form');
        setIsSaving(false);
        return false;
      }
      return false;
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

  // Handle publishing form with improved error handling
  const handlePublish = useCallback(async () => {
    if (!currentFormId) {
      toast.error(language === 'ar' ? 'لم يتم العثور على معرف النموذج' : 'Form ID not found');
      return false;
    }
    
    setIsPublishing(true);
    console.log("Starting form publish/unpublish operation...");
    
    try {
      // Save form before publishing to ensure latest changes are included
      const saveSuccess = await handleSave();
      
      if (!saveSuccess) {
        console.warn("Form save before publish was unsuccessful, continuing with publish anyway");
      }
      
      // Toggle publish status
      const newPublishState = !isPublished;
      console.log(`Changing publish state to: ${newPublishState}`);
      
      // Try direct database update for publishing with retries
      let success = false;
      let retries = 0;
      const maxRetries = 3;
      
      while (!success && retries < maxRetries) {
        try {
          console.log(`Publishing attempt ${retries + 1}/${maxRetries}`);
          const { error } = await supabase
            .from('forms')
            .update({
              is_published: newPublishState,
              updated_at: new Date().toISOString()
            })
            .eq('id', currentFormId);
          
          if (error) {
            console.error(`Publishing attempt ${retries + 1} failed:`, error);
            retries++;
            
            if (retries >= maxRetries) {
              throw error;
            }
            
            // Wait with exponential backoff
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries - 1)));
          } else {
            console.log("Publish status updated successfully");
            success = true;
          }
        } catch (error) {
          console.error(`Error in publishing attempt ${retries + 1}:`, error);
          retries++;
          
          if (retries >= maxRetries) {
            throw error;
          }
          
          // Wait with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries - 1)));
        }
      }
      
      // If direct update succeeds
      if (success) {
        setIsPublished(newPublishState);
        toast.success(
          newPublishState 
            ? (language === 'ar' ? 'تم نشر النموذج بنجاح' : 'Form published successfully')
            : (language === 'ar' ? 'تم إلغاء نشر النموذج' : 'Form unpublished')
        );
        setIsPublishing(false);
        return true;
      }
      
      // If direct update fails, try alternate method
      console.log("All direct publishing attempts failed, trying alternative method");
      const alternateSuccess = await publishForm(currentFormId, newPublishState);
      
      if (alternateSuccess) {
        setIsPublished(newPublishState);
        toast.success(
          newPublishState 
            ? (language === 'ar' ? 'تم نشر النموذج بنجاح' : 'Form published successfully')
            : (language === 'ar' ? 'تم إلغاء نشر النموذج' : 'Form unpublished')
        );
        setIsPublishing(false);
        return true;
      } else {
        toast.error(language === 'ar' ? 'فشل تغيير حالة النشر' : 'Failed to change publish status');
        setIsPublishing(false);
        return false;
      }
    } catch (error) {
      console.error("Error publishing form:", error);
      toast.error(language === 'ar' ? 'فشل تغيير حالة النشر' : 'Failed to change publish status');
      setIsPublishing(false);
      return false;
    }
  }, [currentFormId, handleSave, isPublished, language, publishForm]);

  // Update form metadata (title, description, etc.)
  const updateFormMeta = useCallback((metadata: { title?: string; description?: string; submitButtonText?: string }) => {
    if (metadata.title !== undefined) setFormTitle(metadata.title);
    if (metadata.description !== undefined) setFormDescription(metadata.description);
    if (metadata.submitButtonText !== undefined) setSubmitButtonText(metadata.submitButtonText);
  }, []);

  // Update form style properties
  const handleStyleChange = useCallback((newStyle: Partial<FormStyle>) => {
    setFormStyle(prevStyle => ({
      ...prevStyle,
      ...newStyle
    }));
  }, []);

  // Update a specific form element
  const updateElement = useCallback((index: number, updatedElement: FormField) => {
    setFormElements(prev => {
      const updated = [...prev];
      updated[index] = updatedElement;
      return updated;
    });
  }, []);

  // Add a new element to the form
  const addElement = useCallback((element: FormField) => {
    setFormElements(prev => [...prev, element]);
  }, []);

  // Delete an element from the form
  const deleteElement = useCallback((index: number) => {
    setFormElements(prev => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
    // Reset selected element if it was the deleted one
    setSelectedElementIndex(prev => prev === index ? null : prev);
  }, []);

  // Duplicate an element
  const duplicateElement = useCallback((index: number) => {
    setFormElements(prev => {
      const updated = [...prev];
      const elementToDuplicate = { ...updated[index] };
      // Generate a new ID for the duplicated element
      elementToDuplicate.id = uuidv4();
      updated.splice(index + 1, 0, elementToDuplicate);
      return updated;
    });
  }, []);

  // Return all hooks and functions
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
  };
};
