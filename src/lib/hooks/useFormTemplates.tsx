
import { useCallback } from 'react';
import { useFormCache } from './form/useFormCache';
import { useFormCrud } from './form/useFormCrud';
import { useFormFetch } from './form/useFormFetch';
import { FormData, FormCreatePayload, FormUpdatePayload } from './form/types';

// Re-export FormData interface for backward compatibility
export { FormData } from './form/types';

/**
 * Main hook for form templates management
 * This combines various smaller hooks for form operations
 */
export const useFormTemplates = () => {
  const { formCache, updateFormInCache, removeFormFromCache, clearFormCache } = useFormCache();
  const { forms, isLoading: isFetchLoading, fetchForms, getFormById: fetchFormById, updateFormsState } = useFormFetch();
  const { 
    isLoading: isCrudLoading, 
    createNewForm: createForm, 
    saveForm: saveSingleForm, 
    publishForm: togglePublishForm,
    deleteForm: deleteSingleForm
  } = useFormCrud();

  // Combined isLoading state
  const isLoading = isFetchLoading || isCrudLoading;

  /**
   * Create a new form and update the local state
   */
  const createNewForm = useCallback(async (formData: FormCreatePayload) => {
    const newForm = await createForm(formData);
    if (newForm) {
      updateFormInCache(newForm);
      updateFormsState([newForm, ...forms]);
    }
    return newForm;
  }, [createForm, forms, updateFormInCache, updateFormsState]);

  /**
   * Get a form by ID, with cache support
   */
  const getFormById = useCallback(async (formId: string) => {
    const form = await fetchFormById(formId, formCache);
    if (form) {
      updateFormInCache(form);
    }
    return form;
  }, [fetchFormById, formCache, updateFormInCache]);

  /**
   * Save an existing form
   */
  const saveForm = useCallback(async (formId: string, formData: FormUpdatePayload) => {
    const savedForm = await saveSingleForm(formId, formData);
    if (savedForm) {
      updateFormInCache(savedForm);
      updateFormsState(forms.map(form => form.id === formId ? savedForm : form));
    }
    return savedForm;
  }, [saveSingleForm, forms, updateFormInCache, updateFormsState]);

  /**
   * Publish or unpublish a form
   */
  const publishForm = useCallback(async (formId: string, isPublished: boolean) => {
    const updatedForm = await togglePublishForm(formId, isPublished);
    if (updatedForm) {
      updateFormInCache(updatedForm);
      updateFormsState(forms.map(form => form.id === formId ? updatedForm : form));
    }
    return updatedForm;
  }, [togglePublishForm, forms, updateFormInCache, updateFormsState]);

  /**
   * Delete a form
   */
  const deleteForm = useCallback(async (formId: string) => {
    const success = await deleteSingleForm(formId);
    if (success) {
      removeFormFromCache(formId);
      updateFormsState(forms.filter(form => form.id !== formId));
    }
    return success;
  }, [deleteSingleForm, forms, removeFormFromCache, updateFormsState]);

  return {
    forms,
    isLoading,
    fetchForms,
    getFormById,
    saveForm,
    createNewForm,
    deleteForm,
    clearFormCache,
    publishForm
  };
};
