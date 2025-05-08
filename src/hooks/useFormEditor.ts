
import { useState, useEffect } from 'react';
import { FormField, FormStep } from '@/lib/form-utils';
import { useFormStore } from '@/hooks/useFormStore';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { v4 as uuidv4 } from 'uuid';

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

  // Get active shop ID for database operations
  const getActiveShopId = () => {
    return localStorage.getItem('shopify_store');
  };

  // Initialize a new form if no form ID is provided
  const initializeNewForm = async () => {
    try {
      const shopId = getActiveShopId();
      if (!shopId) {
        toast.error(language === 'ar' ? 'لم يتم العثور على متجر نشط' : 'No active shop found');
        return;
      }

      // Create a new ID for the form
      const newId = uuidv4();
      setCurrentFormId(newId);

      // Prepare initial form data
      const initialFormStep: FormStep = {
        id: '1',
        title: 'Main Step',
        fields: []
      };

      // Create new form in database
      const { data, error } = await supabase.from('forms').insert({
        id: newId,
        title: formTitle,
        description: formDescription,
        data: [initialFormStep],
        shop_id: shopId,
        is_published: false,
        submitButtonText: submitButtonText
      }).select();

      if (error) {
        console.error("Error creating new form:", error);
        toast.error(language === 'ar' ? 'حدث خطأ أثناء إنشاء نموذج جديد' : 'Error creating new form');
        return;
      }

      // Update form state
      resetFormState(); // Clear any previous form state
      setFormState({
        id: newId,
        title: formTitle,
        description: formDescription,
        data: [initialFormStep],
        isPublished: false,
        shop_id: shopId,
        submitButtonText: submitButtonText
      });

      toast.success(language === 'ar' ? 'تم إنشاء نموذج جديد بنجاح' : 'New form created successfully');
    } catch (error) {
      console.error("Error initializing new form:", error);
      toast.error(language === 'ar' ? 'خطأ في إنشاء نموذج جديد' : 'Error initializing new form');
    }
  };

  // Load form data
  const loadFormData = async (id?: string) => {
    if (!id) {
      await initializeNewForm();
      return;
    }

    setCurrentFormId(id);
    try {
      // Reset form state before loading new form
      resetFormState();
      
      // Fetch form from database
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error loading form:', error);
        toast.error(language === 'ar' ? 'خطأ في تحميل النموذج' : 'Error loading form');
        return;
      }
      
      if (!data) {
        toast.error(language === 'ar' ? 'لم يتم العثور على النموذج' : 'Form not found');
        return;
      }
      
      // Extract form data
      setFormTitle(data.title || 'نموذج جديد');
      setFormDescription(data.description || '');
      
      // Extract fields from steps
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        const formFields = data.data.flatMap(step => step.fields || []);
        setFormElements(formFields);
        
        // Extract style properties from metadata if available
        let formMetadata = undefined;
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          // Check if metadata exists, if not create it
          if (data.data[0] && data.data[0].metadata) {
            formMetadata = data.data[0].metadata.formStyle;
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
        
        // Check for submit button text in main data
        if (data.submitButtonText) {
          setSubmitButtonText(data.submitButtonText);
        }
      }
      
      setIsPublished(!!data.isPublished || !!data.is_published);
      
      // Update form state in store
      setFormState({
        ...data,
        isPublished: data.is_published,
        // Ensure style properties are set
        primaryColor: formStyle.primaryColor,
        borderRadius: formStyle.borderRadius,
        fontSize: formStyle.fontSize,
        buttonStyle: formStyle.buttonStyle,
        submitButtonText: submitButtonText
      });
      
      console.log("Loaded form data:", data);
    } catch (error) {
      console.error("Error loading form:", error);
      toast.error(language === 'ar' ? 'خطأ في تحميل النموذج' : 'Error loading form');
    }
  };

  // Handle saving form data
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      if (!currentFormId) {
        toast.error(language === 'ar' ? 'لم يتم العثور على معرف النموذج' : 'Form ID not found');
        setIsSaving(false);
        return;
      }
      
      // Create form step from elements
      const formStep: FormStep = {
        id: '1',
        title: 'Main Step',
        fields: formElements
      };
      
      const shopId = getActiveShopId();
      
      if (!shopId) {
        console.warn("No active shop ID found, saving without shop association");
      }
      
      // Prepare all form data including style properties for saving
      const dbData = {
        title: formTitle,
        description: formDescription,
        data: [formStep],
        shop_id: shopId,
        updated_at: new Date().toISOString(),
        submitButtonText: submitButtonText
      };
      
      // Include style properties in the first step's metadata
      if (!dbData.data[0].metadata) {
        dbData.data[0].metadata = {};
      }
      
      // Store style properties in the metadata
      dbData.data[0].metadata.formStyle = {
        primaryColor: formStyle.primaryColor,
        borderRadius: formStyle.borderRadius,
        fontSize: formStyle.fontSize,
        buttonStyle: formStyle.buttonStyle,
        submitButtonText: submitButtonText
      };
      
      console.log("Saving form with data:", dbData);
      
      // Update database directly
      const { error } = await supabase
        .from('forms')
        .update(dbData)
        .eq('id', currentFormId);
      
      if (error) {
        console.error("Database update failed:", error);
        toast.error(language === 'ar' ? 'فشل حفظ النموذج' : 'Failed to save form');
        setIsSaving(false);
        return;
      }
      
      // Update form state in memory
      setFormState({
        id: currentFormId,
        title: formTitle,
        description: formDescription,
        data: [formStep],
        shop_id: shopId,
        submitButtonText: submitButtonText,
        primaryColor: formStyle.primaryColor,
        borderRadius: formStyle.borderRadius,
        fontSize: formStyle.fontSize,
        buttonStyle: formStyle.buttonStyle
      });
      
      toast.success(language === 'ar' ? 'تم حفظ النموذج بنجاح' : 'Form saved successfully');
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error("Error saving form:", error);
      toast.error(language === 'ar' ? 'خطأ في حفظ النموذج' : 'Error saving form');
    }
    
    setIsSaving(false);
  };

  // Handle publishing form
  const handlePublish = async () => {
    if (!currentFormId) {
      toast.error(language === 'ar' ? 'لم يتم العثور على معرف النموذج' : 'Form ID not found');
      return;
    }
    
    setIsPublishing(true);
    
    try {
      // Save form before publishing
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
    }
    
    setIsPublishing(false);
  };

  // Update form field operations
  const addElement = (type: string) => {
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
  };

  const deleteElement = (index: number) => {
    const updatedElements = [...formElements];
    updatedElements.splice(index, 1);
    setFormElements(updatedElements);
    setSelectedElementIndex(null);
    setRefreshKey(prev => prev + 1);
    
    // Save after deleting element
    setTimeout(() => handleSave(), 300);
  };

  const duplicateElement = (index: number) => {
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
  };

  const updateElement = (updatedField: FormField) => {
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
  };

  // Handle style changes
  const handleStyleChange = (key: string, value: string) => {
    setFormStyle(prev => ({
      ...prev,
      [key]: value
    }));
    
    setTimeout(() => handleSave(), 300);
  };

  // Update form meta information
  const updateFormMeta = (field: 'title' | 'description' | 'submitButtonText', value: string) => {
    if (field === 'title') {
      setFormTitle(value);
    } else if (field === 'description') {
      setFormDescription(value);
    } else if (field === 'submitButtonText') {
      setSubmitButtonText(value);
    }
    
    setTimeout(() => handleSave(), 500);
  };

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
