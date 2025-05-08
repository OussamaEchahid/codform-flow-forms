
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormTemplates, FormData, formTemplates } from '@/lib/hooks/useFormTemplates';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { useFormStore } from '@/hooks/useFormStore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { FormField, FormStep } from '@/lib/form-utils';
import FieldEditor from '@/components/form/FieldEditor';
import FormHeader from '@/components/form/builder/FormHeader';
import FormElementEditor from '@/components/form/builder/FormElementEditor';
import FormElementList from '@/components/form/builder/FormElementList';
import FormPreviewPanel from '@/components/form/builder/FormPreviewPanel';
import FormStyleEditor from '@/components/form/builder/FormStyleEditor';
import FormTemplatesDialog from '@/components/form/FormTemplatesDialog';
import ShopifyIntegration from '@/components/form/builder/ShopifyIntegration';
import { useShopify } from '@/hooks/useShopify';
import { Dialog } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { debounce } from 'lodash';

interface FormBuilderEditorProps {
  formId?: string;
}

const FormBuilderEditor: React.FC<FormBuilderEditorProps> = ({ formId }) => {
  const navigate = useNavigate();
  const params = useParams();
  const { t, language } = useI18n();
  const shopifyIntegration = useShopify();
  const { createFormFromTemplate, saveForm, loadForm, publishForm } = useFormTemplates();
  const { formState, setFormState, resetFormState, updateFormData, markAsSaved, markAsDirty } = useFormStore();
  
  const [isStyleDialogOpen, setIsStyleDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [submitButtonText, setSubmitButtonText] = useState('إرسال الطلب');
  
  const [formStyle, setFormStyle] = useState(() => {
    return {
      primaryColor: formState.primaryColor || '#9b87f5',
      borderRadius: formState.borderRadius || '0.5rem',
      fontSize: formState.fontSize || '1rem',
      buttonStyle: formState.buttonStyle || 'rounded',
    };
  });
  
  const [refreshKey, setRefreshKey] = useState(0);
  const [formElements, setFormElements] = useState<Array<FormField>>([]);
  
  const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null);
  const [isFieldEditorOpen, setIsFieldEditorOpen] = useState(false);
  const [currentEditingField, setCurrentEditingField] = useState<FormField | null>(null);
  const [formTitle, setFormTitle] = useState(formState.title || 'نموذج جديد');
  const [formDescription, setFormDescription] = useState(formState.description || '');
  const [currentPreviewStep, setCurrentPreviewStep] = useState(1);
  const [currentFormId, setCurrentFormId] = useState<string | undefined>(formId || params.formId);
  const [hasLoadedForm, setHasLoadedForm] = useState(false);
  const [lastSaveTimestamp, setLastSaveTimestamp] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const availableElements = [
    { type: 'whatsapp', label: language === 'ar' ? 'زر واتساب' : 'WhatsApp Button', icon: '📱' },
    { type: 'image', label: language === 'ar' ? 'صورة' : 'Image', icon: '🖼️' },
    { type: 'title', label: language === 'ar' ? 'عنوان' : 'Title', icon: 'T' },
    { type: 'text/html', label: language === 'ar' ? 'نص/HTML' : 'Text/Html', icon: '📄' },
    { type: 'cart-items', label: language === 'ar' ? 'عناصر السلة' : 'Cart items', icon: '🛒' },
    { type: 'cart-summary', label: language === 'ar' ? 'ملخص السلة' : 'Cart Summary', icon: '📋' },
    { type: 'text', label: language === 'ar' ? 'حقل نص' : 'Text Input', icon: '✍️' },
    { type: 'textarea', label: language === 'ar' ? 'حقل نص متعدد الأسطر' : 'Multi-line Input', icon: '📝' },
    { type: 'radio', label: language === 'ar' ? 'خيار واحد' : 'Single Choice', icon: '⭕' },
    { type: 'checkbox', label: language === 'ar' ? 'خيارات متعددة' : 'Multiple Choices', icon: '☑️' },
    { type: 'shipping', label: language === 'ar' ? 'الشحن' : 'Shipping', icon: '🚚' },
    { type: 'countdown', label: language === 'ar' ? 'عد تنازلي' : 'CountDown', icon: '⏱️' }
  ];

  // Get active shop ID for database operations
  const getActiveShopId = () => {
    return shopifyIntegration.shop || localStorage.getItem('shopify_store');
  };

  // Clear form state when navigating away or when component unmounts
  useEffect(() => {
    return () => {
      resetFormState();
    };
  }, []);

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
        submitButtonText: submitButtonText,
        primaryColor: formStyle.primaryColor,
        borderRadius: formStyle.borderRadius,
        fontSize: formStyle.fontSize,
        buttonStyle: formStyle.buttonStyle
      }).select();

      if (error) {
        console.error("Error creating new form:", error);
        toast.error(language === 'ar' ? 'حدث خطأ أثناء إنشاء نموذج جديد' : 'Error creating new form');
        setErrorMessage(error.message);
        return;
      }

      console.log("New form created successfully:", data);

      // Update form state
      resetFormState(); // Clear any previous form state
      setFormState({
        id: newId,
        title: formTitle,
        description: formDescription,
        data: [initialFormStep],
        isPublished: false,
        shop_id: shopId,
        submitButtonText: submitButtonText,
        primaryColor: formStyle.primaryColor,
        borderRadius: formStyle.borderRadius,
        fontSize: formStyle.fontSize,
        buttonStyle: formStyle.buttonStyle,
        formStyle: { ...formStyle }
      });

      setHasLoadedForm(true);
      toast.success(language === 'ar' ? 'تم إنشاء نموذج جديد بنجاح' : 'New form created successfully');
    } catch (error: any) {
      console.error("Error initializing new form:", error);
      toast.error(language === 'ar' ? 'خطأ في إنشاء نموذج جديد' : 'Error initializing new form');
      setErrorMessage(error.message || 'Unknown error');
    }
  };

  // Load form data when formId changes
  useEffect(() => {
    const loadFormData = async () => {
      const id = formId || params.formId;
      
      if (id) {
        setCurrentFormId(id);
        try {
          console.log("Attempting to load form with ID:", id);
          // Reset form state before loading new form
          resetFormState();
          
          const formData = await loadForm(id);
          
          if (formData) {
            console.log("Loaded form data:", formData);
            
            setFormTitle(formData.title || 'نموذج جديد');
            setFormDescription(formData.description || '');
            setSubmitButtonText(formData.submitButtonText || 'إرسال الطلب');
            
            // Ensure we have form data to work with
            if (formData.data && Array.isArray(formData.data) && formData.data.length > 0) {
              // Extract fields from all steps
              const allFields = formData.data.flatMap(step => step.fields || []);
              console.log("Extracted form fields:", allFields);
              setFormElements(allFields);
            } else {
              console.warn("Form data is empty or invalid, initializing with empty array");
              setFormElements([]);
            }
            
            setIsPublished(!!formData.isPublished || !!formData.is_published);
            
            // Update form style if available
            if (formData.formStyle || formData.primaryColor) {
              const newFormStyle = {
                primaryColor: formData.primaryColor || formData.formStyle?.primaryColor || '#9b87f5',
                borderRadius: formData.borderRadius || formData.formStyle?.borderRadius || '0.5rem',
                fontSize: formData.fontSize || formData.formStyle?.fontSize || '1rem',
                buttonStyle: formData.buttonStyle || formData.formStyle?.buttonStyle || 'rounded',
              };
              
              setFormStyle(newFormStyle);
            }
            
            setHasLoadedForm(true);
            setRefreshKey(prev => prev + 1);
          } else {
            console.error("Form not found or failed to load");
            toast.error(language === 'ar' ? 'لم يتم العثور على النموذج' : 'Form not found');
            navigate('/form-builder');
          }
        } catch (error: any) {
          console.error("Error loading form:", error);
          toast.error(language === 'ar' ? 'خطأ في تحميل النموذج' : 'Error loading form');
          setErrorMessage(error.message || 'Unknown error');
        }
      } else {
        // If no form ID, initialize a new form
        await initializeNewForm();
      }
    };
    
    loadFormData();
  }, [formId, params.formId]);

  // Keep formElements in sync with formState.data
  useEffect(() => {
    if (hasLoadedForm && formState && formState.data && Array.isArray(formState.data) && formState.data.length > 0) {
      const allFields = formState.data.flatMap(step => step.fields || []);
      if (JSON.stringify(allFields) !== JSON.stringify(formElements)) {
        console.log("Updating form elements from form state:", allFields);
        setFormElements(allFields);
      }
    }
  }, [formState, hasLoadedForm]);

  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [formElements]);

  // Create a debounced save function
  const debouncedSave = useCallback(
    debounce(async (formId, formData) => {
      try {
        console.log("Running debounced save...");
        const success = await saveForm(formId, formData);
        if (success) {
          console.log("Autosave successful");
          setLastSaveTimestamp(Date.now());
          // Don't show toast for autosaves to avoid too many notifications
        }
      } catch (error) {
        console.error("Error during autosave:", error);
      }
    }, 2000),
    []
  );

  // Add effect for auto-saving when form elements change
  useEffect(() => {
    if (hasLoadedForm && currentFormId && formState.isDirty) {
      console.log("Form is dirty, triggering autosave...");
      
      // Create form step from elements
      const formStep: FormStep = {
        id: '1',
        title: 'Main Step',
        fields: formElements
      };
      
      // Prepare form data with all necessary fields
      const formData: Partial<FormData> = {
        title: formTitle,
        description: formDescription,
        data: [formStep],
        submitButtonText: submitButtonText,
        formStyle: { ...formStyle },
        primaryColor: formStyle.primaryColor,
        borderRadius: formStyle.borderRadius,
        fontSize: formStyle.fontSize,
        buttonStyle: formStyle.buttonStyle
      };
      
      debouncedSave(currentFormId, formData);
    }
  }, [formElements, formTitle, formDescription, submitButtonText, formStyle, hasLoadedForm, formState.isDirty]);

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    
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
      
      // Prepare form data with all necessary fields
      const formData: Partial<FormData> = {
        title: formTitle,
        description: formDescription,
        data: [formStep],
        shop_id: shopId,
        submitButtonText: submitButtonText,
        formStyle: { ...formStyle },
        primaryColor: formStyle.primaryColor,
        borderRadius: formStyle.borderRadius,
        fontSize: formStyle.fontSize,
        buttonStyle: formStyle.buttonStyle
      };
      
      console.log("Manually saving form with data:", formData);
      
      // Use the saveForm function from the hook
      const success = await saveForm(currentFormId, formData);
      
      if (success) {
        toast.success(language === 'ar' ? 'تم حفظ النموذج بنجاح' : 'Form saved successfully');
        
        // Update form state in the store
        setFormState({
          ...formState,
          ...formData,
          id: currentFormId
        });
        
        // Also update the form data specifically
        updateFormData([formStep]);
        
        setLastSaveTimestamp(Date.now());
        
        // Update refresh key to trigger UI updates
        setRefreshKey(prev => prev + 1);
      } else {
        toast.error(language === 'ar' ? 'فشل حفظ النموذج' : 'Failed to save form');
      }
    } catch (error: any) {
      console.error("Error saving form:", error);
      toast.error(language === 'ar' ? 'خطأ في حفظ النموذج' : 'Error saving form');
      setErrorMessage(error.message || 'Unknown error');
    }
    
    setIsSaving(false);
  };

  const handlePublish = async () => {
    if (!currentFormId) {
      toast.error(language === 'ar' ? 'لم يتم العثور على معرف النموذج' : 'Form ID not found');
      return;
    }
    
    setIsPublishing(true);
    setErrorMessage(null);
    
    try {
      // Save form before publishing
      await handleSave();
      
      // Toggle publish status
      const newPublishState = !isPublished;
      
      // Try updating the publish status
      const success = await publishForm(currentFormId, newPublishState);
      
      if (success) {
        setIsPublished(newPublishState);
        toast.success(
          newPublishState 
            ? (language === 'ar' ? 'تم نشر النموذج بنجاح' : 'Form published successfully')
            : (language === 'ar' ? 'تم إلغاء نشر النموذج' : 'Form unpublished')
        );
        
        // Update form state
        setFormState({
          ...formState,
          isPublished: newPublishState
        });
      } else {
        toast.error(language === 'ar' ? 'فشل تغيير حالة النشر' : 'Failed to change publish status');
      }
    } catch (error: any) {
      console.error("Error publishing form:", error);
      toast.error(language === 'ar' ? 'خطأ في نشر النموذج' : 'Error publishing form');
      setErrorMessage(error.message || 'Unknown error');
    }
    
    setIsPublishing(false);
  };

  const addElement = (type: string) => {
    try {
      console.log("Adding new element of type:", type);
      
      const newElement = {
        type,
        id: `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        label: language === 'ar' ? `${type} جديد` : `New ${type}`,
        placeholder: language === 'ar' ? `أدخل ${type}` : `Enter ${type}`,
        content: type === 'text/html' ? '<p>محتوى HTML</p>' : undefined,
      };
      
      console.log("Created new element:", newElement);
      const updatedElements = [...formElements, newElement];
      setFormElements(updatedElements);
      markAsDirty();
      
      // Update selected element
      setTimeout(() => {
        setSelectedElementIndex(updatedElements.length - 1);
        setRefreshKey(prev => prev + 1);
        toast.success(language === 'ar' ? 'تم إضافة عنصر جديد' : 'New element added');
      }, 100);
    } catch (error: any) {
      console.error("Error adding element:", error);
      toast.error(language === 'ar' ? 'خطأ في إضافة عنصر جديد' : 'Error adding new element');
      setErrorMessage(error.message || 'Unknown error');
    }
  };

  const editElement = (index: number) => {
    try {
      const element = formElements[index];
      if (!element) {
        console.error("Element not found at index:", index);
        return;
      }
      
      setCurrentEditingField(element);
      setIsFieldEditorOpen(true);
    } catch (error: any) {
      console.error("Error editing element:", error);
      setErrorMessage(error.message || 'Unknown error');
    }
  };

  const deleteElement = (index: number) => {
    try {
      console.log("Deleting element at index:", index);
      const updatedElements = [...formElements];
      updatedElements.splice(index, 1);
      setFormElements(updatedElements);
      setSelectedElementIndex(null);
      setRefreshKey(prev => prev + 1);
      markAsDirty();
      toast.success(language === 'ar' ? 'تم حذف العنصر بنجاح' : 'Element deleted successfully');
    } catch (error: any) {
      console.error("Error deleting element:", error);
      toast.error(language === 'ar' ? 'خطأ في حذف العنصر' : 'Error deleting element');
      setErrorMessage(error.message || 'Unknown error');
    }
  };

  const duplicateElement = (index: number) => {
    try {
      const element = formElements[index];
      if (!element) {
        console.error("Element not found at index:", index);
        return;
      }
      
      const newElement = {
        ...element,
        id: `${element.id}-copy-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      };
      
      console.log("Duplicating element:", newElement);
      const updatedElements = [...formElements];
      updatedElements.splice(index + 1, 0, newElement);
      setFormElements(updatedElements);
      markAsDirty();
      
      setTimeout(() => {
        setRefreshKey(prev => prev + 1);
      }, 100);
      toast.success(language === 'ar' ? 'تم نسخ العنصر بنجاح' : 'Element duplicated successfully');
    } catch (error: any) {
      console.error("Error duplicating element:", error);
      toast.error(language === 'ar' ? 'خطأ في نسخ العنصر' : 'Error duplicating element');
      setErrorMessage(error.message || 'Unknown error');
    }
  };

  const handleSelectTemplate = async (templateId: number) => {
    try {
      const template = formTemplates.find(t => t.id === templateId);
      if (template) {
        toast.success(language === 'ar' ? `تم اختيار قالب ${template.title}` : `Selected template ${template.title}`);
        
        setFormStyle({
          primaryColor: template.primaryColor || formStyle.primaryColor,
          borderRadius: formStyle.borderRadius,
          fontSize: formStyle.fontSize,
          buttonStyle: formStyle.buttonStyle
        });
        
        const newElements = template.data.flatMap(step => 
          step.fields.map(field => ({
            ...field,
            id: `${field.type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
          }))
        );
        
        setFormTitle(template.title);
        setFormDescription(template.description);
        setFormElements(newElements);
        setRefreshKey(prev => prev + 1);
        setIsTemplateDialogOpen(false);
        markAsDirty();
        
        // Save the form immediately after applying template
        setTimeout(() => handleSave(), 500);
      }
    } catch (error: any) {
      console.error("Error applying template:", error);
      toast.error(language === 'ar' ? 'خطأ في تطبيق القالب' : 'Error applying template');
      setErrorMessage(error.message || 'Unknown error');
    }
  };

  const saveField = (updatedField: FormField) => {
    try {
      console.log("Saving field update:", updatedField);
      const newElements = [...formElements];
      const index = newElements.findIndex(el => el.id === updatedField.id);
      if (index !== -1) {
        newElements[index] = updatedField;
        setFormElements(newElements);
      } else {
        console.warn("Could not find field to update with ID:", updatedField.id);
      }
      setIsFieldEditorOpen(false);
      setCurrentEditingField(null);
      markAsDirty();
      
      setTimeout(() => {
        setSelectedElementIndex(null);
        setRefreshKey(prev => prev + 1);
      }, 100);
    } catch (error: any) {
      console.error("Error saving field:", error);
      toast.error(language === 'ar' ? 'خطأ في حفظ العنصر' : 'Error saving field');
      setErrorMessage(error.message || 'Unknown error');
    }
  };

  const handleStyleChange = (key: string, value: string) => {
    try {
      console.log("Updating style:", key, value);
      setFormStyle({
        ...formStyle,
        [key]: value
      });
      setRefreshKey(prev => prev + 1);
      markAsDirty();
    } catch (error: any) {
      console.error("Error updating style:", error);
      setErrorMessage(error.message || 'Unknown error');
    }
  };

  const handleSaveStyle = () => {
    setIsStyleDialogOpen(false);
    localStorage.setItem('selectedTemplateStyle', JSON.stringify(formStyle));
    handleSave();
  };

  const handleShopifyIntegration = async (settings: any) => {
    if (!currentFormId) {
      toast.error(language === 'ar' ? 'يجب حفظ النموذج أولا' : 'You must save the form first');
      return;
    }
    
    try {
      await shopifyIntegration.syncForm({ 
        formId: currentFormId,
        shopDomain: shopifyIntegration.shop,
        settings
      });
      
      toast.success(
        language === 'ar' 
          ? 'تم حفظ إعدادات شوبيفاي بنجاح'
          : 'Shopify settings saved successfully'
      );
      
      // Save form after Shopify integration
      handleSave();
    } catch (error: any) {
      console.error("Error saving Shopify settings:", error);
      toast.error(
        language === 'ar'
          ? 'حدث خطأ أثناء حفظ إعدادات شوبيفاي'
          : 'Error saving Shopify settings'
      );
      setErrorMessage(error.message || 'Unknown error');
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    console.log("Drag ended. Moving element from", active.id, "to", over.id);
    
    setFormElements((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      
      return arrayMove(items, oldIndex, newIndex);
    });

    markAsDirty();
    
    setTimeout(() => {
      setSelectedElementIndex(null);
      setRefreshKey(prev => prev + 1);
    }, 300);
  };

  // Auto-mark as dirty when form title, description, or submit button text changes
  const handleFormTitleChange = (value: string) => {
    console.log("Form title changed:", value);
    setFormTitle(value);
    markAsDirty();
  };
  
  const handleFormDescriptionChange = (value: string) => {
    console.log("Form description changed:", value);
    setFormDescription(value);
    markAsDirty();
  };
  
  const handleSubmitButtonTextChange = (text: string) => {
    console.log("Submit button text changed:", text);
    setSubmitButtonText(text);
    markAsDirty();
  };

  // Display any errors that occur
  if (errorMessage) {
    console.error("Form builder error:", errorMessage);
    // We'll still allow the component to render, but log the error
  }

  return (
    <main className="flex-1 overflow-auto">
      <FormHeader 
        onSave={handleSave}
        onPublish={handlePublish}
        onStyleOpen={() => setIsStyleDialogOpen(true)}
        onTemplateOpen={() => setIsTemplateDialogOpen(true)}
        isSaving={isSaving}
        isPublishing={isPublishing}
        isPublished={isPublished}
        lastSaved={lastSaveTimestamp}
      />
      
      <div className="grid grid-cols-12 min-h-[calc(100vh-64px)]">
        <div className="col-span-2 border-r bg-white p-4">
          <FormElementList 
            availableElements={availableElements}
            onAddElement={addElement}
          />
        </div>
        
        <div className="col-span-6 bg-gray-50 p-6">
          <h2 className={`text-xl font-semibold mb-6 ${language === 'ar' ? 'text-right' : ''}`}>
            {language === 'ar' ? 'تحرير وترتيب عناصر النموذج' : 'Edit & Order Form Elements'}
          </h2>
          
          {/* Form Basic Information Section */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <h3 className={`text-lg font-medium mb-4 ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar' ? 'معلومات النموذج الأساسية' : 'Form Basic Information'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${language === 'ar' ? 'text-right' : ''}`}>
                  {language === 'ar' ? 'عنوان النموذج' : 'Form Title'}
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => handleFormTitleChange(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder={language === 'ar' ? 'أدخل عنوان النموذج' : 'Enter form title'}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${language === 'ar' ? 'text-right' : ''}`}>
                  {language === 'ar' ? 'وصف النموذج' : 'Form Description'}
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => handleFormDescriptionChange(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder={language === 'ar' ? 'أدخل وصف النموذج' : 'Enter form description'}
                  rows={3}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${language === 'ar' ? 'text-right' : ''}`}>
                  {language === 'ar' ? 'نص زر الإرسال' : 'Submit Button Text'}
                </label>
                <input
                  type="text"
                  value={submitButtonText}
                  onChange={(e) => handleSubmitButtonTextChange(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder={language === 'ar' ? 'أدخل نص زر الإرسال' : 'Enter submit button text'}
                />
              </div>
            </div>
          </div>
          
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={formElements.map(el => el.id)}
              strategy={verticalListSortingStrategy}
            >
              <FormElementEditor
                elements={formElements}
                selectedIndex={selectedElementIndex}
                onSelectElement={setSelectedElementIndex}
                onEditElement={editElement}
                onDeleteElement={deleteElement}
                onDuplicateElement={duplicateElement}
              />
            </SortableContext>
          </DndContext>
        </div>
        
        <div className="col-span-4 border-l bg-white p-6">
          <FormPreviewPanel
            formTitle={formTitle}
            formDescription={formDescription}
            currentStep={currentPreviewStep}
            totalSteps={1}
            formStyle={formStyle}
            fields={formElements}
            onPreviousStep={() => setCurrentPreviewStep(prev => Math.max(prev - 1, 1))}
            onNextStep={() => setCurrentPreviewStep(prev => Math.min(prev + 1, 1))}
            refreshKey={refreshKey}
            submitButtonText={submitButtonText}
          />
        </div>
      </div>
      
      <FormStyleEditor
        isOpen={isStyleDialogOpen}
        onOpenChange={setIsStyleDialogOpen}
        formStyle={formStyle}
        onStyleChange={handleStyleChange}
        onSave={handleSaveStyle}
      />

      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <FormTemplatesDialog 
          open={isTemplateDialogOpen}
          onSelect={handleSelectTemplate} 
          onClose={() => setIsTemplateDialogOpen(false)}
        />
      </Dialog>

      {isFieldEditorOpen && currentEditingField && (
        <FieldEditor
          field={currentEditingField}
          onSave={saveField}
          onClose={() => setIsFieldEditorOpen(false)}
        />
      )}

      {currentFormId && (
        <div className="mt-6">
          <ShopifyIntegration
            formId={currentFormId}
            onSave={handleShopifyIntegration}
            isSyncing={shopifyIntegration.isSyncing}
          />
        </div>
      )}
    </main>
  );
};

export default FormBuilderEditor;
