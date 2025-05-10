import { useState, useCallback, useRef } from 'react';
import { FormField } from '@/lib/form-utils';
import { useFormStore } from './useFormStore';

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

      // Fetch the form data
      const response = await fetch(`/api/forms/${formId}`);
      const jsonResponse = await response.json();
      
      // Check if response has data property and necessary fields
      if (!jsonResponse || typeof jsonResponse !== 'object') {
        throw new Error('Invalid response format');
      }
      
      const data = jsonResponse.data || jsonResponse;
      
      // Ensure id exists
      const id = data?.id || formId;
      if (!id) {
        throw new Error('No form ID found in response');
      }
      
      // Type checking and default values for required fields
      const formTitle = data?.title || 'Untitled Form';
      const formDescription = data?.description || '';
      const isPublished = !!data?.is_published;
      
      let formElements = [];
      // Check and extract form elements from various possible structures
      if (data?.data?.steps && Array.isArray(data.data.steps)) {
        // Extract from steps
        formElements = data.data.steps.flatMap(step => step.fields || []);
      } else if (data?.data?.fields && Array.isArray(data.data.fields)) {
        // Direct fields array
        formElements = data.data.fields;
      } else if (Array.isArray(data?.data)) {
        // Data is directly an array
        formElements = data.data;
      }
      
      // Handle form style
      const formStyle = {
        primaryColor: data?.primaryColor || '#9b87f5',
        fontSize: data?.fontSize || '1rem',
        borderRadius: data?.borderRadius || '0.5rem',
        buttonStyle: data?.buttonStyle || 'rounded'
      };

      // Set the extracted data to state
      setCurrentFormId(id);
      setFormTitle(formTitle);
      setFormDescription(formDescription);
      setSubmitButtonText(data?.submitButtonText || 'Submit');
      setFormElements(formElements || []);
      setFormStyle(formStyle);
      setIsPublished(isPublished);
      setIsLoading(false);
      
      // Update the form store as well
      useFormStore.getState().setFormState({
        id,
        title: formTitle,
        description: formDescription,
        data: data?.data || {},
        isPublished,
        submitButtonText: data?.submitButtonText || 'Submit',
        // Copy style properties
        primaryColor: formStyle.primaryColor,
        fontSize: formStyle.fontSize,
        borderRadius: formStyle.borderRadius,
        buttonStyle: formStyle.buttonStyle
      });
      
      console.log(`Form loaded successfully: ${id}`, { 
        title: formTitle, 
        elements: formElements?.length || 0 
      });
      
      // Force a refresh to ensure UI updates
      setRefreshKey(prev => prev + 1);
      
      return id;
    } catch (error) {
      console.error('Error loading form data:', error);
      setIsLoading(false);
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

      const response = await fetch(`/api/forms/${currentFormId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: formData }),
      });

      if (!response.ok) {
        console.error('Error saving form:', response.statusText);
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

      const response = await fetch(`/api/forms/${currentFormId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublished: !isPublished }),
      });

      if (!response.ok) {
        console.error('Error publishing form:', response.statusText);
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
