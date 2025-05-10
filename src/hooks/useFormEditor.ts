import { useState, useCallback, useRef } from 'react';
import { FormField } from '@/lib/form-utils';
import { useFormStore } from './useFormStore';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { dataCache } from '@/lib/data-cache';

// Export the FormStyle interface
export interface FormStyle {
  primaryColor: string;
  fontSize: string;
  borderRadius: string;
  buttonStyle: string;
}

export function useFormEditor(initialFormId?: string) {
  const [formTitle, setFormTitle] = useState<string>('Untitled Form');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formElements, setFormElements] = useState<FormField[]>([]);
  const [formStyle, setFormStyle] = useState<FormStyle>({
    primaryColor: '#9b87f5',
    fontSize: '1rem',
    borderRadius: '0.5rem',
    buttonStyle: 'rounded'
  });
  const [submitButtonText, setSubmitButtonText] = useState<string>('Submit');
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [currentFormId, setCurrentFormId] = useState<string | null>(initialFormId || null);
  const [currentPreviewStep, setCurrentPreviewStep] = useState<number>(0);
  const lastSavedDataRef = useRef<string>(''); // Track last saved data to prevent unnecessary saves

  // IMPROVED: Enhanced form data loading with better error handling
  const loadFormData = useCallback(async (formId: string) => {
    try {
      setIsLoading(true);
      console.log('Loading form data for ID:', formId);
      
      // OPTIMIZATION: Use a more efficient query with direct selection of needed fields
      const { data: formData, error } = await supabase
        .from('forms')
        .select('id, title, description, data, is_published, submitbuttontext, primaryColor, fontSize, borderRadius, buttonStyle')
        .eq('id', formId)
        .maybeSingle();
      
      if (error) {
        console.error('Error loading form from Supabase:', error);
        // Cache the error to help with debugging
        dataCache.set(`form_error:${formId}`, { 
          timestamp: new Date().toISOString(),
          error: error.message
        });
        throw new Error(error.message || 'Error fetching form');
      }
      
      if (!formData) {
        console.error('Form not found with ID:', formId);
        throw new Error('Form not found');
      }
      
      console.log('Form data loaded successfully:', formData);
      
      // Set the extracted data to state
      setCurrentFormId(formId);
      setFormTitle(formData.title || 'Untitled Form');
      setFormDescription(formData.description || '');
      setSubmitButtonText(formData.submitbuttontext || 'Submit');
      
      // Extract form elements with improved safety checks
      let elements: FormField[] = [];
      try {
        if (formData.data?.fields && Array.isArray(formData.data.fields)) {
          elements = formData.data.fields;
        } else if (formData.data?.steps && Array.isArray(formData.data.steps)) {
          elements = formData.data.steps.flatMap(step => step.fields || []);
        } else if (Array.isArray(formData.data)) {
          elements = formData.data;
        }
      } catch (parseError) {
        console.error('Error parsing form data:', parseError);
        elements = [];
      }
      
      // Store validated elements
      setFormElements(elements || []);
      
      // Set form style with safe defaults
      setFormStyle({
        primaryColor: formData.primaryColor || '#9b87f5',
        fontSize: formData.fontSize || '1rem',
        borderRadius: formData.borderRadius || '0.5rem',
        buttonStyle: formData.buttonStyle || 'rounded'
      });
      
      setIsPublished(!!formData.is_published);
      
      // Cache successfully loaded data for recovery
      dataCache.set(`form:${formId}`, {
        formTitle: formData.title || 'Untitled Form',
        formDescription: formData.description || '',
        formElements: elements || [],
        formStyle: {
          primaryColor: formData.primaryColor || '#9b87f5',
          fontSize: formData.fontSize || '1rem',
          borderRadius: formData.borderRadius || '0.5rem',
          buttonStyle: formData.buttonStyle || 'rounded'
        },
        submitButtonText: formData.submitbuttontext || 'Submit',
        isPublished: !!formData.is_published,
        timestamp: new Date().toISOString()
      });
      
      // Save a snapshot of the data for change detection
      lastSavedDataRef.current = JSON.stringify({
        title: formData.title,
        description: formData.description,
        data: elements,
        submitbuttontext: formData.submitbuttontext,
        primaryColor: formData.primaryColor,
        fontSize: formData.fontSize,
        borderRadius: formData.borderRadius,
        buttonStyle: formData.buttonStyle,
        is_published: formData.is_published
      });
      
      // Update the form store as well
      useFormStore.getState().setFormState({
        id: formId,
        title: formData.title || 'Untitled Form',
        description: formData.description || '',
        data: formData.data || {},
        isPublished: !!formData.is_published,
        submitButtonText: formData.submitbuttontext || 'Submit',
        // Copy style properties
        primaryColor: formData.primaryColor || '#9b87f5',
        fontSize: formData.fontSize || '1rem',
        borderRadius: formData.borderRadius || '0.5rem',
        buttonStyle: formData.buttonStyle || 'rounded'
      });
      
      console.log(`Form loaded successfully: ${formId}`, { 
        title: formData.title || 'Untitled Form', 
        elements: elements?.length || 0 
      });
      
      // Force a refresh to ensure UI updates
      setRefreshKey(prev => prev + 1);
      setIsLoading(false);
      
      return formId;
    } catch (error) {
      console.error('Error loading form data:', error);
      setIsLoading(false);
      toast.error(error instanceof Error ? error.message : 'Failed to load form data');
      return null;
    }
  }, []);

  // IMPROVED: Optimized save function with change detection and performance improvements
  const handleSave = useCallback(async () => {
    try {
      if (!currentFormId) {
        throw new Error('Form ID is missing');
      }

      // Skip saving if the form is currently being saved to avoid overlap
      if (isSaving) {
        console.log('Save operation already in progress, skipping');
        return false;
      }
      
      setIsSaving(true);
      console.log('Starting form save operation...');

      // Prepare form data
      const formDataToSave = {
        title: formTitle,
        description: formDescription,
        data: {
          fields: formElements
        },
        is_published: isPublished,
        submitbuttontext: submitButtonText,
        primaryColor: formStyle.primaryColor,
        fontSize: formStyle.fontSize,
        borderRadius: formStyle.borderRadius,
        buttonStyle: formStyle.buttonStyle
      };
      
      // Create a string representation for comparison
      const currentDataString = JSON.stringify(formDataToSave);
      
      // Check if data has actually changed before saving
      if (currentDataString === lastSavedDataRef.current) {
        console.log('No changes detected since last save, skipping database update');
        setIsSaving(false);
        return true; // Return success without actual DB operation
      }
      
      // Log the data being saved for debugging
      console.log('Saving form data:', formDataToSave);

      // OPTIMIZATION: Use upsert with defined primary key to allow both insert and update
      const { error } = await supabase
        .from('forms')
        .upsert({
          id: currentFormId,
          ...formDataToSave
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Error saving form to Supabase:', error);
        
        // Cache the error for debugging
        dataCache.set(`form_save_error:${currentFormId}`, { 
          timestamp: new Date().toISOString(),
          error: error.message,
          data: formDataToSave
        });
        
        setIsSaving(false);
        toast.error('Error saving form: ' + error.message);
        return false;
      }

      // Update the last saved data reference
      lastSavedDataRef.current = currentDataString;
      
      // Cache the successfully saved data for recovery
      dataCache.set(`form:${currentFormId}`, {
        formTitle,
        formDescription,
        formElements,
        formStyle,
        submitButtonText,
        isPublished,
        timestamp: new Date().toISOString()
      });

      console.log('Form saved successfully');
      setIsSaving(false);
      return true;
    } catch (error) {
      console.error('Error saving form:', error);
      setIsSaving(false);
      toast.error('Failed to save form: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return false;
    }
  }, [currentFormId, formTitle, formDescription, formElements, isPublished, submitButtonText, formStyle, isSaving]);

  // IMPROVED: Optimized publish function with better error handling
  const handlePublish = useCallback(async () => {
    if (!currentFormId) {
      toast.error('Form ID is missing');
      return false;
    }

    setIsPublishing(true);
    console.log(`Publishing form ${currentFormId}, current status: ${isPublished ? 'published' : 'unpublished'}`);

    try {
      // First try to save any pending changes
      await handleSave();
      
      // Then update the publication status
      const { error } = await supabase
        .from('forms')
        .update({ 
          is_published: !isPublished 
        })
        .eq('id', currentFormId);

      if (error) {
        console.error('Error publishing form:', error);
        toast.error('Failed to publish form: ' + error.message);
        setIsPublishing(false);
        return false;
      }

      const newPublishedState = !isPublished;
      setIsPublished(newPublishedState);
      
      // Update the store state
      useFormStore.getState().updateFormPublishedState(currentFormId, newPublishedState);
      
      // Log and notify success
      console.log(`Form ${newPublishedState ? 'published' : 'unpublished'} successfully`);
      toast.success(newPublishedState ? 'Form published successfully' : 'Form unpublished successfully');
      
      setIsPublishing(false);
      return true;
    } catch (error) {
      console.error('Error publishing form:', error);
      toast.error('Failed to update publication status');
      setIsPublishing(false);
      return false;
    }
  }, [currentFormId, isPublished, handleSave]);

  const updateFormStyle = useCallback((newStyle: Partial<FormStyle>) => {
    setFormStyle(prev => ({ ...prev, ...newStyle }));
  }, []);

  const addElement = useCallback((element: FormField) => {
    setFormElements(prev => [...prev, element]);
  }, []);

  const deleteElement = useCallback((index: number) => {
    setFormElements(prev => {
      const newElements = [...prev];
      newElements.splice(index, 1);
      return newElements;
    });
    setSelectedElementIndex(null);
  }, []);

  const duplicateElement = useCallback((index: number) => {
    const element = formElements[index];
    if (element) {
      const newElement = { ...element, id: Math.random().toString(36).substring(2, 9) };
      setFormElements(prev => {
        const newElements = [...prev];
        newElements.splice(index + 1, 0, newElement);
        return newElements;
      });
    }
  }, [formElements]);

  const updateElement = useCallback((index: number, newElement: FormField) => {
    setFormElements(prev => {
      const newElements = [...prev];
      newElements[index] = newElement;
      return newElements;
    });
  }, []);

  const updateFormMeta = useCallback((metadata: { title?: string; description?: string; submitButtonText?: string }) => {
    if (metadata.title !== undefined) {
      setFormTitle(metadata.title);
    }
    if (metadata.description !== undefined) {
      setFormDescription(metadata.description);
    }
    if (metadata.submitButtonText !== undefined) {
      setSubmitButtonText(metadata.submitButtonText);
    }
  }, []);

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
    isLoading,
    currentFormId,
    currentPreviewStep,
    setCurrentPreviewStep,
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
}
