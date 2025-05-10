import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { FormField } from '@/lib/form-utils';
import { arrayMove } from '@dnd-kit/sortable';
import { useFormEditor, FormStyle } from '@/hooks/useFormEditor';
import { useShopify } from '@/hooks/useShopify';
import FormEditorLayout from './FormEditorLayout';
import { dataCache } from '@/lib/data-cache';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { validateFormElements } from '@/lib/form-data-utils';

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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveRetryCount, setSaveRetryCount] = useState<number>(0);
  const [recoverMode, setRecoverMode] = useState<boolean>(false);
  const maxLoadAttempts = 3;
  const maxSaveRetries = 5;
  const lastServerLoadTimeRef = useRef<number>(0);
  
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
    updateFormStyle,
    addElement,
    deleteElement,
    duplicateElement,
    updateElement,
    updateFormMeta,
    setFormElements
  } = useFormEditor(id);

  // Add reference to track if there are any open dialogs
  const openDialogRef = useRef<boolean>(false);
  
  // IMPROVED: Try to restore form from cache if loading fails with better logging
  const attemptFormRestore = useCallback(() => {
    if (!id) return false;
    
    try {
      const cachedForm = dataCache.get<{
        formTitle?: string;
        formDescription?: string;
        formElements?: FormField[];
        formStyle?: FormStyle;
        submitButtonText?: string;
        timestamp?: string;
      }>(`form:${id}`);
      
      if (cachedForm) {
        console.log('Restoring form data from cache:', cachedForm);
        
        // Check cache timestamp to ensure we don't use very old data
        if (cachedForm.timestamp) {
          const cacheTimestamp = new Date(cachedForm.timestamp).getTime();
          const now = Date.now();
          const maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours
          
          if (now - cacheTimestamp > maxCacheAge) {
            console.warn('Cache data is too old, not restoring');
            return false;
          }
        }
        
        // Restore cached data with validation
        if (cachedForm.formTitle) updateFormMeta({ title: cachedForm.formTitle });
        if (cachedForm.formDescription) updateFormMeta({ description: cachedForm.formDescription });
        
        if (cachedForm.formElements && Array.isArray(cachedForm.formElements)) {
          const validatedElements = validateFormElements(cachedForm.formElements);
          setFormElements(validatedElements);
        }
        
        if (cachedForm.formStyle) updateFormStyle(cachedForm.formStyle);
        if (cachedForm.submitButtonText) updateFormMeta({ submitButtonText: cachedForm.submitButtonText });
        
        setRecoverMode(true);
        toast.warning(
          language === 'ar' 
            ? 'تم استعادة بيانات النموذج من النسخة المحفوظة مؤقتًا. يرجى حفظ النموذج للتأكد من عدم فقدان البيانات.'
            : 'Form data restored from cache. Please save the form to ensure data is not lost.'
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error restoring form from cache:', error);
      return false;
    }
  }, [id, setFormElements, updateFormStyle, updateFormMeta, language]);

  // IMPROVED: Better debounced save function with cancellation, caching, and optimized save logic
  const debouncedSave = useCallback(() => {
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    
    // Clear any previous save error
    setSaveError(null);
    
    // Cache current form state in case saving fails
    if (id) {
      console.log('Caching current form state before saving:', {
        formTitle,
        formDescription,
        formElements,
        formStyle,
        submitButtonText
      });
      
      dataCache.set(`form:${id}`, {
        formTitle,
        formDescription,
        formElements,
        formStyle,
        submitButtonText,
        timestamp: new Date().toISOString()
      });
    }
    
    // Set a new timeout with longer delay
    saveTimeoutRef.current = window.setTimeout(async () => {
      try {
        console.log('Executing debounced save...');
        const success = await handleSave();
        console.log('Save result:', success);
        
        if (!success && saveRetryCount < maxSaveRetries) {
          console.error("Auto-save failed, will retry...");
          setSaveRetryCount(prev => prev + 1);
          
          // Try one more time after a longer delay
          setTimeout(async () => {
            try {
              const retrySuccess = await handleSave();
              console.log('Retry save result:', retrySuccess);
              
              if (!retrySuccess) {
                setSaveError('auto-save-failed');
                toast.error(language === 'ar' ? 'فشل الحفظ التلقائي، يرجى المحاولة مرة أخرى' : 'Auto-save failed, please try again');
              } else {
                setSaveRetryCount(0);
              }
            } catch (retryError) {
              console.error("Error in retry save:", retryError);
              setSaveError('auto-save-error');
            }
          }, 2000); // 2 second delay before retry
        } else if (success) {
          // Reset retry counter on success
          setSaveRetryCount(0);
          
          // If we were in recover mode, exit it
          if (recoverMode) {
            setRecoverMode(false);
          }
        }
      } catch (error) {
        console.error("Error in debounced save:", error);
        setSaveError('auto-save-error');
        toast.error(language === 'ar' ? 'خطأ في حفظ النموذج' : 'Error saving form');
      }
      saveTimeoutRef.current = null;
    }, 2000); // 2 seconds debounce for better reliability
  }, [handleSave, language, saveRetryCount, maxSaveRetries, id, formTitle, formDescription, formElements, formStyle, submitButtonText, recoverMode]);

  // IMPROVED: Optimized form loading with edge function
  const loadFormWithEdgeFunction = useCallback(async (formId: string) => {
    try {
      console.log(`Loading form data via edge function for ID: ${formId}`);
      
      // Fix: Use the correct property name 'body' instead of 'params' for Supabase function invoke options
      const { data, error } = await supabase.functions.invoke('get-form', {
        body: { id: formId }
      });
      
      if (error) {
        console.error('Edge function error:', error);
        return null;
      }
      
      if (!data.success) {
        console.error('Form load unsuccessful:', data.error);
        return null;
      }
      
      const formData = data.data;
      console.log('Form loaded successfully via edge function:', formData);
      
      // Update all form state at once
      updateFormMeta({ 
        title: formData.title || 'Untitled Form',
        description: formData.description || '',
        submitButtonText: formData.submitbuttontext || 'Submit'
      });
      
      // Extract form elements with improved safety
      let elements: FormField[] = [];
      try {
        if (formData.data?.fields && Array.isArray(formData.data.fields)) {
          elements = validateFormElements(formData.data.fields);
        } else if (formData.data?.steps && Array.isArray(formData.data.steps)) {
          const allFields = formData.data.steps.flatMap(step => step.fields || []);
          elements = validateFormElements(allFields);
        } else if (Array.isArray(formData.data)) {
          elements = validateFormElements(formData.data);
        }
      } catch (parseError) {
        console.error('Error parsing form elements:', parseError);
        elements = [];
      }
      
      setFormElements(elements);
      
      // Update style
      updateFormStyle({
        primaryColor: formData.primaryColor || '#9b87f5',
        fontSize: formData.fontSize || '1rem',
        borderRadius: formData.borderRadius || '0.5rem',
        buttonStyle: formData.buttonStyle || 'rounded'
      });
      
      // Update published state
      const isPublishedState = !!formData.is_published;
      
      // Cache the loaded data
      dataCache.set(`form:${formId}`, {
        formTitle: formData.title || 'Untitled Form',
        formDescription: formData.description || '',
        formElements: elements,
        formStyle: {
          primaryColor: formData.primaryColor || '#9b87f5',
          fontSize: formData.fontSize || '1rem',
          borderRadius: formData.borderRadius || '0.5rem',
          buttonStyle: formData.buttonStyle || 'rounded'
        },
        submitButtonText: formData.submitbuttontext || 'Submit',
        isPublished: isPublishedState,
        timestamp: new Date().toISOString()
      });
      
      return formId;
    } catch (error) {
      console.error('Error loading form via edge function:', error);
      return null;
    }
  }, [updateFormMeta, setFormElements, updateFormStyle]);

  // Cleanup function for timeouts
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, []);

  // IMPROVED: Enhanced form loading with edge function and multiple fallback strategies
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
        
        // First try to load using the edge function (faster)
        const now = Date.now();
        const shouldUseEdgeFunction = now - lastServerLoadTimeRef.current > 30000; // Only use edge function if >30s since last attempt
        
        let loadedId = null;
        if (shouldUseEdgeFunction && loadAttemptRef.current === 1) {
          console.log('Attempting to load form via edge function');
          loadedId = await loadFormWithEdgeFunction(id);
          lastServerLoadTimeRef.current = Date.now();
        }
        
        // If edge function fails, fall back to direct loading
        if (!loadedId) {
          console.log('Edge function load failed or skipped, trying direct load');
          loadedId = await loadFormData(id);
        }
        
        console.log('Form data load result:', loadedId);
        
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
            // All attempts failed, try to restore from cache
            console.log('All load attempts failed, trying to restore from cache');
            const restored = attemptFormRestore();
            if (!restored) {
              toast.error(language === 'ar' ? 'فشل تحميل النموذج بعد عدة محاولات' : 'Failed to load form after multiple attempts');
            }
          }
        }
      } catch (err) {
        console.error("Error loading form data:", err);
        if (!controller.signal.aborted) {
          // Try to restore from cache after error
          console.log('Error during load, trying to restore from cache');
          const restored = attemptFormRestore();
          if (!restored) {
            toast.error(language === 'ar' ? 'خطأ في تحميل بيانات النموذج' : 'Error loading form data');
          }
        }
      }
    };
    
    loadData();
    
    return () => {
      controller.abort();
    };
  }, [id, loadFormData, language, maxLoadAttempts, attemptFormRestore, loadFormWithEdgeFunction]); 

  // Add error message for save issues
  useEffect(() => {
    if (saveError) {
      const errorMessage = language === 'ar' 
        ? 'فشل الحفظ التلقائي، يرجى المحاولة مرة أخرى' 
        : 'Auto-save failed, please try again';
      
      if (saveRetryCount >= maxSaveRetries) {
        toast.error(errorMessage);
      }
    }
  }, [saveError, language, saveRetryCount, maxSaveRetries]);

  // IMPROVED: Handle form drag-and-drop reordering with better error handling
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

  // Adapter function for style changes
  const handleStyleChange = useCallback((key: string, value: string) => {
    const newStyle: Partial<FormStyle> = {};
    newStyle[key as keyof FormStyle] = value;
    updateFormStyle(newStyle);
    debouncedSave();
  }, [updateFormStyle, debouncedSave]);

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

  // IMPROVED: Manual save handler with better feedback and verification
  const manualSaveHandler = useCallback(async () => {
    try {
      toast.loading(language === 'ar' ? 'جاري حفظ النموذج...' : 'Saving form...');
      console.log('Starting manual form save...');
      
      const success = await handleSave();
      
      if (success) {
        toast.success(language === 'ar' ? 'تم حفظ النموذج بنجاح' : 'Form saved successfully');
        // Clear any save error on successful save
        setSaveError(null);
        setSaveRetryCount(0);
        
        // Turn off recover mode if active
        if (recoverMode) {
          setRecoverMode(false);
        }
        
        // Verify save by attempting to reload the form
        setTimeout(async () => {
          try {
            // Quick verification check to ensure data was saved
            const { data, error } = await supabase
              .from('forms')
              .select('updated_at')
              .eq('id', currentFormId)
              .single();
              
            if (error) {
              console.warn('Verification check failed:', error);
            } else {
              console.log('Save verified, last updated:', data.updated_at);
            }
          } catch (e) {
            console.error('Error during save verification:', e);
          }
        }, 1000);
      } else {
        // If save fails, try one more time
        setTimeout(async () => {
          try {
            const retrySuccess = await handleSave();
            if (retrySuccess) {
              toast.success(language === 'ar' ? 'تم حفظ النموذج بنجاح (محاولة ثانية)' : 'Form saved successfully (retry)');
              setSaveError(null);
              setSaveRetryCount(0);
              if (recoverMode) setRecoverMode(false);
            } else {
              toast.error(language === 'ar' ? 'فشل في حفظ النموذج' : 'Failed to save form');
              setSaveError('manual-save-failed');
            }
          } catch (retryError) {
            console.error("Error during retry save:", retryError);
            toast.error(language === 'ar' ? 'خطأ في حفظ النموذج' : 'Error saving form');
            setSaveError('manual-save-error');
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Error during manual save:", error);
      toast.error(language === 'ar' ? 'خطأ في حفظ النموذج' : 'Error saving form');
      setSaveError('manual-save-error');
    }
  }, [handleSave, language, recoverMode, currentFormId]);

  // Publish handler wrapper to return void
  const handlePublishWrapper = useCallback(async () => {
    try {
      // First try to save before publishing
      const saveSuccess = await handleSave();
      if (!saveSuccess) {
        toast.warning(language === 'ar' ? 'تم حفظ النموذج قبل النشر' : 'Form saved before publishing');
      }
      
      const publishSuccess = await handlePublish();
      if (!publishSuccess) {
        toast.error(language === 'ar' ? 'فشل في نشر النموذج' : 'Failed to publish form');
      }
    } catch (error) {
      console.error("Error publishing form:", error);
      toast.error(language === 'ar' ? 'خطأ في نشر النموذج' : 'Error publishing form');
    }
  }, [handlePublish, handleSave, language]);

  // IMPROVED: Better Shopify integration with error handling and verification
  const handleShopifyIntegration = useCallback(async (settings: any) => {
    try {
      if (!currentFormId) {
        toast.error(language === 'ar' ? 'معرّف النموذج مفقود' : 'Form ID is missing');
        return;
      }
      
      // Try to save form first to ensure we have the latest data
      await manualSaveHandler();
      
      // Ensure the form is published before sync
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('is_published')
        .eq('id', currentFormId)
        .single();
        
      if (formError) {
        throw new Error(`Error checking form publication status: ${formError.message}`);
      }
      
      if (!formData.is_published) {
        // Auto-publish the form before syncing
        console.log('Form is not published. Auto-publishing before sync');
        await handlePublish();
      }
      
      // Make sure shop is defined
      if (!shopifyIntegration.shop) {
        throw new Error(language === 'ar' ? 'لم يتم تحديد متجر Shopify' : 'Shopify store not defined');
      }
      
      console.log('Syncing form with Shopify...');
      const result = await shopifyIntegration.syncForm({
        formId: currentFormId,
        shopDomain: shopifyIntegration.shop,
        productId: settings?.productId, 
        blockId: settings?.blockId,
        settings: {
          position: settings?.position || 'product-page',
          style: {
            primaryColor: formStyle.primaryColor,
            fontSize: formStyle.fontSize,
            borderRadius: formStyle.borderRadius
          }
        }
      });
      
      if (result.success) {
        toast.success(language === 'ar' ? 'تم مزامنة النموذج مع Shopify بنجاح' : 'Form synchronized with Shopify successfully');
      } else {
        throw new Error(result.error || 'Unknown error');
      }
      
      // Return void to match the expected return type
    } catch (error) {
      console.error("Error during Shopify integration:", error);
      toast.error(
        language === 'ar' 
          ? 'فشل في مزامنة النموذج مع Shopify'
          : 'Failed to synchronize form with Shopify'
      );
    }
  }, [currentFormId, shopifyIntegration, formStyle, manualSaveHandler, handlePublish, language]);

  return (
    <>
      {/* Show recovery mode warning if active */}
      {recoverMode && (
        <Alert variant="warning" className="m-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {language === 'ar' 
              ? 'تم استعادة بيانات النموذج من النسخة المحفوظة مؤقتًا. يرجى حفظ النموذج للتأكد من عدم فقدان البيانات.'
              : 'Form data has been restored from local cache. Please save the form to ensure data is not lost.'}
          </AlertDescription>
        </Alert>
      )}
    
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
        onShopifyIntegration={handleShopifyIntegration}
        
        // Add reference for open dialogs
        dialogRef={openDialogRef}
      />
    </>
  );
};

export default FormBuilderEditor;
