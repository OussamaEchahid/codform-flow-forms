import { useState, useCallback } from 'react';
import { FormField } from '@/lib/form-utils';

export interface FormStyle {
  primaryColor: string;
  borderRadius: string;
  fontSize: string;
  buttonStyle: string;
}

interface FormEditorState {
  formTitle: string;
  formDescription: string;
  formElements: FormField[];
  formStyle: FormStyle;
  submitButtonText: string;
  refreshKey: number;
  selectedElementIndex: number | null;
  isSaving: boolean;
  isPublished: boolean;
  isPublishing: boolean;
  currentFormId: string | null;
  currentPreviewStep: number;
}

// Initial state
const initialState: FormEditorState = {
  formTitle: 'Untitled Form',
  formDescription: '',
  formElements: [],
  formStyle: {
    primaryColor: '#9b87f5',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    buttonStyle: 'rounded'
  },
  submitButtonText: 'Submit',
  refreshKey: 0,
  selectedElementIndex: null,
  isSaving: false,
  isPublished: false,
  isPublishing: false,
  currentFormId: null,
  currentPreviewStep: 1
};

export const useFormEditor = (formId?: string) => {
  const [state, setState] = useState<FormEditorState>(initialState);

  // Method to set selected element index
  const setSelectedElementIndex = useCallback((index: number | null) => {
    setState(prev => ({ ...prev, selectedElementIndex: index }));
  }, []);

  // Method to load form data
  const loadFormData = useCallback(async (id: string) => {
    // Simulate loading data (replace with actual API call)
    return new Promise<string>((resolve) => {
      setTimeout(() => {
        setState(prevState => ({
          ...prevState,
          formTitle: 'Loaded Form Title',
          formDescription: 'This form was loaded from an API call',
          formElements: [
            { id: '1', type: 'text', label: 'First Name', required: true },
            { id: '2', type: 'email', label: 'Email', required: true }
          ],
          currentFormId: id,
          refreshKey: prevState.refreshKey + 1
        }));
        resolve(id);
      }, 500);
    });
  }, []);

  // Method to handle save
  const handleSave = useCallback(async () => {
    setState(prev => ({ ...prev, isSaving: true }));
    // Simulate saving data (replace with actual API call)
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        setState(prev => ({ ...prev, isSaving: false, refreshKey: prev.refreshKey + 1 }));
        resolve(true);
      }, 500);
    });
  }, []);

  // Method to handle publish
  const handlePublish = useCallback(async () => {
    setState(prev => ({ ...prev, isPublishing: true }));
    // Simulate publishing (replace with actual API call)
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          isPublishing: false,
          isPublished: true,
          refreshKey: prev.refreshKey + 1
        }));
        resolve(true);
      }, 500);
    });
  }, []);
  
  // Method to update form style
  const updateFormStyle = (styleUpdates: Partial<FormStyle>) => {
    setState(prev => ({
      ...prev,
      formStyle: {
        ...prev.formStyle,
        ...styleUpdates
      }
    }));
  };

  // Method to add an element
  const addElement = useCallback((element: FormField) => {
    setState(prev => ({
      ...prev,
      formElements: [...prev.formElements, element]
    }));
  }, []);

  // Method to delete an element
  const deleteElement = useCallback((index: number) => {
    const newElements = [...state.formElements];
    newElements.splice(index, 1);
    setState(prev => ({ ...prev, formElements: newElements }));
  }, [state.formElements]);

  // Method to duplicate an element
  const duplicateElement = useCallback((index: number) => {
    const newElements = [...state.formElements];
    const elementToDuplicate = newElements[index];
    newElements.splice(index + 1, 0, { ...elementToDuplicate, id: Math.random().toString(36).substring(2, 9) });
    setState(prev => ({ ...prev, formElements: newElements }));
  }, [state.formElements]);

  // Method to update an element
  const updateElement = useCallback((index: number, updatedElement: FormField) => {
    const newElements = [...state.formElements];
    newElements[index] = updatedElement;
    setState(prev => ({ ...prev, formElements: newElements }));
  }, [state.formElements]);

  // Method to update form metadata
  const updateFormMeta = useCallback((metadata: {[key: string]: string}) => {
    setState(prev => ({
      ...prev,
      formTitle: metadata.title !== undefined ? metadata.title : prev.formTitle,
      formDescription: metadata.description !== undefined ? metadata.description : prev.formDescription,
      submitButtonText: metadata.submitButtonText !== undefined ? metadata.submitButtonText : prev.submitButtonText
    }));
  }, []);

  const setFormElements = useCallback((elements: FormField[]) => {
    setState(prev => ({ ...prev, formElements: elements }));
  }, []);

  return {
    formTitle: state.formTitle,
    formDescription: state.formDescription,
    formElements: state.formElements,
    formStyle: state.formStyle,
    submitButtonText: state.submitButtonText,
    refreshKey: state.refreshKey,
    selectedElementIndex: state.selectedElementIndex,
    isSaving: state.isSaving,
    isPublished: state.isPublished,
    isPublishing: state.isPublishing,
    currentFormId: state.currentFormId,
    currentPreviewStep: state.currentPreviewStep,
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
    setFormElements,
  };
};
