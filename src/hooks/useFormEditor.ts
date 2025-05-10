import { useState, useCallback, useRef } from 'react';
import { FormField } from '@/lib/form-utils';
import { useFormStore } from './useFormStore';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

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

  const loadFormData = useCallback(async (formId: string) => {
    try {
      setIsLoading(true);
      console.log('Loading form data directly from Supabase for ID:', formId);
      
      // Use direct Supabase query instead of the failing API route
      const { data: formData, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .maybeSingle();
      
      if (error) {
        console.error('Error loading form from Supabase:', error);
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
      
      // Extract form elements
      let elements: FormField[] = [];
      if (formData.data?.fields && Array.isArray(formData.data.fields)) {
        elements = formData.data.fields;
      } else if (formData.data?.steps && Array.isArray(formData.data.steps)) {
        elements = formData.data.steps.flatMap(step => step.fields || []);
      } else if (Array.isArray(formData.data)) {
        elements = formData.data;
      }
      
      setFormElements(elements || []);
      
      // Set form style
      setFormStyle({
        primaryColor: formData.primaryColor || '#9b87f5',
        fontSize: formData.fontSize || '1rem',
        borderRadius: formData.borderRadius || '0.5rem',
        buttonStyle: formData.buttonStyle || 'rounded'
      });
      
      setIsPublished(!!formData.is_published);
      setIsLoading(false);
      
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
      
      return formId;
    } catch (error) {
      console.error('Error loading form data:', error);
      setIsLoading(false);
      toast.error(error instanceof Error ? error.message : 'Failed to load form data');
      return null;
    }
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      if (!currentFormId) {
        throw new Error('Form ID is missing');
      }

      const formData = {
        id: currentFormId,
        title: formTitle,
        description: formDescription,
        data: {
          fields: formElements
        },
        is_published: isPublished,
        submitButtonText: submitButtonText,
        primaryColor: formStyle.primaryColor,
        fontSize: formStyle.fontSize,
        borderRadius: formStyle.borderRadius,
        buttonStyle: formStyle.buttonStyle
      };

      // Use direct Supabase update instead of API route
      const { error } = await supabase
        .from('forms')
        .update({
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
        })
        .eq('id', currentFormId);

      if (error) {
        console.error('Error saving form to Supabase:', error);
        setIsSaving(false);
        return false;
      }

      setIsSaving(false);
      return true;
    } catch (error) {
      console.error('Error saving form:', error);
      setIsSaving(false);
      return false;
    }
  }, [currentFormId, formTitle, formDescription, formElements, isPublished, submitButtonText, formStyle]);

  const handlePublish = useCallback(async () => {
    setIsPublishing(true);
    try {
      if (!currentFormId) {
        throw new Error('Form ID is missing');
      }

      // Use direct Supabase update instead of API route
      const { error } = await supabase
        .from('forms')
        .update({ 
          is_published: !isPublished 
        })
        .eq('id', currentFormId);

      if (error) {
        console.error('Error publishing form:', error);
        setIsPublishing(false);
        return false;
      }

      setIsPublished(!isPublished);
      setIsPublishing(false);
      return true;
    } catch (error) {
      console.error('Error publishing form:', error);
      setIsPublishing(false);
      return false;
    }
  }, [currentFormId, isPublished]);

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
