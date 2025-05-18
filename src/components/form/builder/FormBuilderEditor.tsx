import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormTemplates, FormData, formTemplates } from '@/lib/hooks/useFormTemplates';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { useFormStore, FormStyle } from '@/hooks/useFormStore';
import { FormField, FormStep, FormFieldType, FloatingButtonConfig } from '@/lib/form-utils';
import FieldEditor from '@/components/form/FieldEditor';
import FormHeader from '@/components/form/builder/FormHeader';
import FormElementEditor from '@/components/form/builder/FormElementEditor';
import FormElementList from '@/components/form/builder/FormElementList';
import FormPreviewPanel from '@/components/form/builder/FormPreviewPanel';
import FormStyleEditor from '@/components/form/builder/FormStyleEditor';
import FormTemplatesDialog from '@/components/form/FormTemplatesDialog';
import FormTitleEditor from '@/components/form/builder/FormTitleEditor';
import FloatingButtonEditor from '@/components/form/builder/FloatingButtonEditor';
import { useShopify } from '@/hooks/useShopify';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { 
  DndContext, 
  closestCenter, 
  useSensor, 
  useSensors, 
  PointerSensor, 
  KeyboardSensor,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  arrayMove, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';

// Define available form elements
const formElementTypes = [
  { type: 'text', label: 'Text Input', icon: 'T' },
  { type: 'email', label: 'Email Input', icon: '@' },
  { type: 'phone', label: 'Phone Input', icon: '☎' },
  { type: 'textarea', label: 'Text Area', icon: '¶' },
  { type: 'select', label: 'Dropdown', icon: '▼' },
  { type: 'checkbox', label: 'Checkbox', icon: '☑' },
  { type: 'radio', label: 'Radio Button', icon: '◉' },
  { type: 'text/html', label: 'HTML Content', icon: '</>' },
  { type: 'submit', label: 'Submit Button', icon: '✓' },
  { type: 'cart-items', label: 'Cart Items', icon: '🛒' },
  { type: 'cart-summary', label: 'Cart Summary', icon: '🧾' },
  { type: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { type: 'image', label: 'Image', icon: '🖼️' },
  { type: 'form-title', label: 'Form Title', icon: 'H1' }
];

// Add function to get active shop ID
const getActiveShopId = (): string | null => {
  // Get from localStorage or any other source
  return localStorage.getItem('shopify_store') || 
         localStorage.getItem('shopify_active_store') || 
         null;
};

interface FormBuilderEditorProps {
  formId?: string;
}

const FormBuilderEditor: React.FC<FormBuilderEditorProps> = ({ formId }) => {
  const navigate = useNavigate();
  const params = useParams();
  const { t, language } = useI18n();
  const shopifyIntegration = useShopify();
  const { createFormFromTemplate, saveForm, loadForm, publishForm } = useFormTemplates();
  
  // Call useFormStore hook at the top level to follow React Rules of Hooks
  const { formState, setFormState, floatingButton, updateFloatingButton } = useFormStore();
  
  const [isStyleDialogOpen, setIsStyleDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isFloatingButtonDialogOpen, setIsFloatingButtonDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formStyle, setFormStyle] = useState<FormStyle>({
    primaryColor: '#9b87f5',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    buttonStyle: 'rounded',
  });
  
  const [refreshKey, setRefreshKey] = useState(0);
  const [formElements, setFormElements] = useState<Array<FormField>>([]);
  
  const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null);
  const [isFieldEditorOpen, setIsFieldEditorOpen] = useState(false);
  const [currentEditingField, setCurrentEditingField] = useState<FormField | null>(null);
  const [formTitle, setFormTitle] = useState(language === 'ar' ? 'نموذج جديد' : 'New Form');
  const [formDescription, setFormDescription] = useState(language === 'ar' ? 'نموذج جديد' : 'New Form');
  const [currentPreviewStep, setCurrentPreviewStep] = useState(1);
  const [currentFormId, setCurrentFormId] = useState<string | undefined>(formId || params.formId);
  
  // تحسين وظيفة البحث عن حقل عنوان النموذج
  const getFormTitleField = (): FormField | undefined => {
    return formElements.find(f => f.type === 'form-title');
  };

  // تحويل عنوان النموذج إلى حقل قابل للتعديل مع الخلفية البنفسجية
  const addFormTitleField = () => {
    // التحقق مما إذا كان حقل العنوان موجودًا بالفعل
    const existingTitleField = getFormTitleField();
    
    if (existingTitleField) {
      toast.info(language === 'ar' ? 'عنوان النموذج قابل للتعديل بالفعل' : 'Form title is already editable');
      return;
    }

    // إنشاء حقل عنوان جديد دائمًا بخلفية بنفسجية
    const titleField: FormField = {
      type: 'form-title',
      id: `form-title-${Date.now()}`,
      label: formTitle,
      helpText: formDescription,
      style: {
        color: '#ffffff', // نص أبيض للتباين
        textAlign: language === 'ar' ? 'right' : 'left',
        fontWeight: 'bold',
        fontSize: '1.5rem',
        descriptionColor: '#ffffff', // وصف أبيض للتباين
        descriptionFontSize: '0.875rem',
        backgroundColor: '#9b87f5', // خلفية بنفسجية دائمًا
      }
    };

    // إضافة حقل العنوان في بداية النموذج
    const updatedElements = [titleField, ...formElements.filter(f => f.type !== 'form-title')];
    setFormElements(updatedElements);
    setRefreshKey(prev => prev + 1);
    toast.success(language === 'ar' ? 'تم تحويل العنوان إلى قابل للتعديل بنجاح' : 'Title converted to editable successfully');
  };

  // تحديث حقل عنوان النموذج
  const updateFormTitleField = (updatedField: FormField) => {
    const fieldIndex = formElements.findIndex(f => f.id === updatedField.id);
    if (fieldIndex === -1) return;

    // تأكد من أن خلفية العنوان دائمًا بنفسجية
    if (!updatedField.style?.backgroundColor) {
      updatedField.style = {
        ...updatedField.style,
        backgroundColor: '#9b87f5'
      };
    }

    // تحديث لون النص والوصف للتباين إذا لم يكن محددًا
    if (!updatedField.style?.color) {
      updatedField.style = {
        ...updatedField.style,
        color: '#ffffff'
      };
    }

    if (!updatedField.style?.descriptionColor) {
      updatedField.style = {
        ...updatedField.style,
        descriptionColor: '#ffffff'
      };
    }

    const updatedElements = [...formElements];
    updatedElements[fieldIndex] = updatedField;
    setFormElements(updatedElements);
    setRefreshKey(prev => prev + 1);
  };

  // إنشاء نموذج افتراضي جديد مع الحقول المطلوبة
  const createDefaultForm = (): FormField[] => {
    const fields: FormField[] = [];
    
    // إضافة حقل عنوان بخلفية بنفسجية دائمًا
    fields.push({
      type: 'form-title' as FormFieldType,
      id: `form-title-${Date.now()}`,
      label: language === 'ar' ? 'نموذج جديد' : 'New Form',
      helpText: language === 'ar' ? 'نموذج جديد' : 'New Form',
      style: {
        color: '#ffffff', // نص أبيض للتباين
        textAlign: language === 'ar' ? 'right' : 'left',
        fontWeight: 'bold',
        fontSize: '1.5rem',
        descriptionColor: '#ffffff', // وصف أبيض للتباين
        descriptionFontSize: '0.875rem',
        backgroundColor: '#9b87f5', // خلفية بنفسجية دائمًا
      }
    });
    
    // إضافة حقل الاسم الكامل
    fields.push({
      type: 'text' as FormFieldType,
      id: `text-${Date.now()}-1`,
      label: language === 'ar' ? 'الاسم الكامل' : 'Full name',
      placeholder: language === 'ar' ? 'الاسم الكامل' : 'Full name',
      required: true,
      icon: 'user',
    });
    
    // إضافة حقل رقم الهاتف
    fields.push({
      type: 'phone' as FormFieldType,
      id: `phone-${Date.now()}-2`,
      label: language === 'ar' ? 'رقم الهاتف' : 'Phone number',
      placeholder: language === 'ar' ? 'رقم الهاتف' : 'Phone number',
      required: true,
      icon: 'phone',
    });
    
    // إضافة حقل العنوان
    fields.push({
      type: 'textarea' as FormFieldType,
      id: `textarea-${Date.now()}`,
      label: language === 'ar' ? 'العنوان' : 'Address',
      placeholder: language === 'ar' ? 'العنوان' : 'address',
      required: true,
    });
    
    // إضافة زر الطلب
    fields.push({
      type: 'submit' as FormFieldType,
      id: `submit-${Date.now()}`,
      label: language === 'ar' ? 'إرسال الطلب' : 'Submit Order',
      style: {
        backgroundColor: '#9b87f5',
        color: '#ffffff',
        fontSize: '1.2rem',
        animation: true,
        animationType: 'pulse',
        iconPosition: 'left',
      },
    });
    
    return fields;
  };

  // تهيئة نموذج جديد إذا لم يتم تقديم معرف نموذج - تم تحسينه للأداء
  const initializeNewForm = async () => {
    try {
      // Show loading state immediately
      setIsLoading(true);
      
      const shopId = getActiveShopId();
      if (!shopId) {
        toast.error(language === 'ar' ? 'لم يتم العثور على متجر نشط' : 'No active shop found');
        setIsLoading(false);
        return;
      }

      // Create a new ID for the form
      const newId = uuidv4();
      setCurrentFormId(newId);

      // Set initial form style
      const defaultStyle: FormStyle = {
        primaryColor: '#9b87f5',
        borderRadius: '0.5rem',
        fontSize: '1rem',
        buttonStyle: 'rounded',
      };
      
      setFormStyle(defaultStyle);

      // Create default fields with ALL required fields
      const defaultFields = createDefaultForm();
      setFormElements(defaultFields);

      // Prepare initial form data
      const initialFormStep: FormStep = {
        id: '1',
        title: 'Main Step',
        fields: defaultFields
      };

      // Start with bare minimum fields for faster creation
      const { data, error } = await supabase.from('forms').insert({
        id: newId,
        title: formTitle,
        description: formDescription,
        data: [initialFormStep],
        shop_id: shopId,
        is_published: false,
      }).select('id').single();

      if (error) {
        console.error("Error creating new form:", error);
        toast.error(language === 'ar' ? 'حدث خطأ أثناء إنشاء نموذج جديد' : 'Error creating new form');
        setIsLoading(false);
        return;
      }

      // Update form state
      setFormState({
        id: newId,
        title: formTitle,
        description: formDescription,
        data: [initialFormStep],
        isPublished: false,
        shop_id: shopId,
        style: defaultStyle
      });

      // Update URL to use the real UUID instead of "new"
      navigate(`/form-builder/${newId}`, { replace: true });

      // Update rest of the form data in the background
      setTimeout(async () => {
        await supabase.from('forms').update({
          style: defaultStyle,
          user_id: shopifyIntegration.user?.id || null
        }).eq('id', newId);
      }, 500);

      toast.success(language === 'ar' ? 'تم إنشاء نموذج جديد بنجاح' : 'New form created successfully');
      setIsLoading(false);
    } catch (error) {
      console.error("Error initializing new form:", error);
      toast.error(language === 'ar' ? 'خطأ في إنشاء نموذج جديد' : 'Error initializing new form');
      setIsLoading(false);
    }
  };

  // تحميل بيانات النموذج عند تغيير معرف النموذج - تم تحسينه للأداء
  useEffect(() => {
    const loadFormData = async () => {
      setIsLoading(true);
      const id = formId || params.formId;
      
      if (id) {
        setCurrentFormId(id);
        try {
          // For new forms, create a default one immediately
          if (id === 'new') {
            await initializeNewForm();
            return;
          }
          
          const formData = await loadForm(id);
          
          if (formData) {
            setFormTitle(formData.title);
            setFormDescription(formData.description || '');
            
            // تأكد من أن النموذج يحتوي على كل العناصر المطلوبة
            let loadedElements = formData.data?.flatMap(step => step.fields) || [];
            
            // إذا لم يكن هناك عنوان للنموذج أو زر إرسال، أضفهما
            let needsSubmitButton = !loadedElements.some(f => f.type === 'submit');
            let needsTitleField = !loadedElements.some(f => f.type === 'form-title');
            
            // إذا كنا بحاجة إلى إضافة عناصر، نقوم بذلك
            if (needsTitleField || needsSubmitButton) {
              if (needsTitleField) {
                const titleField: FormField = {
                  type: 'form-title',
                  id: `form-title-${Date.now()}`,
                  label: formData.title,
                  helpText: formData.description || '',
                  style: {
                    color: '#ffffff',
                    textAlign: language === 'ar' ? 'right' : 'left',
                    fontWeight: 'bold',
                    fontSize: '1.5rem',
                    descriptionColor: '#ffffff',
                    descriptionFontSize: '0.875rem',
                    backgroundColor: '#9b87f5', // خلفية بنفسجية دائمًا
                  }
                };
                loadedElements = [titleField, ...loadedElements];
              }
              
              if (needsSubmitButton) {
                const submitButton: FormField = {
                  type: 'submit',
                  id: `submit-${Date.now()}`,
                  label: language === 'ar' ? 'إرسال الطلب' : 'Submit Order',
                  style: {
                    backgroundColor: '#9b87f5',
                    color: '#ffffff',
                    fontSize: '1.2rem',
                    animation: true,
                    animationType: 'pulse',
                    iconPosition: 'left',
                  },
                };
                loadedElements.push(submitButton);
              }
            }
            
            setFormElements(loadedElements);
            setIsPublished(!!formData.isPublished || !!formData.is_published);
            
            // تحديث نمط النموذج مع التأكد من عدم استخدام قيم غير محددة
            if (formData.style) {
              setFormStyle({
                primaryColor: formData.style.primaryColor || '#9b87f5',
                borderRadius: formData.style.borderRadius || '0.5rem',
                fontSize: formData.style.fontSize || '1rem',
                buttonStyle: formData.style.buttonStyle || 'rounded',
              });
            } else {
              // قيم افتراضية إذا كان النمط مفقودًا
              setFormStyle({
                primaryColor: '#9b87f5',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                buttonStyle: 'rounded',
              });
            }
          } else {
            // If the form wasn't found, initialize a new form
            await initializeNewForm();
          }
        } catch (error) {
          console.error("خطأ في تحميل النموذج:", error);
          toast.error(language === 'ar' ? 'خطأ في تحميل النموذج' : 'Error loading form');
          // Create a default form in case of error
          await initializeNewForm();
        } finally {
          setIsLoading(false);
        }
      } else {
        // If no form ID, initialize a new form
        await initializeNewForm();
      }
    };
    
    loadFormData();
  }, [formId, params.formId]);

  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [formElements]);

  useEffect(() => {
    // Update the form title field when language changes
    const titleField = getFormTitleField();
    if (titleField) {
      // Only update alignment based on language
      const updatedField = {
        ...titleField,
        style: {
          ...titleField.style,
          textAlign: language === 'ar' ? 'right' : 'left'
        }
      };
      updateFormTitleField(updatedField);
    }
  }, [language]);

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
      
      // حفظ إعدادات النمط مع النموذج
      const formData: Partial<FormData> = {
        title: formTitle,
        description: formDescription,
        data: [formStep],
        shop_id: shopId,
        style: formStyle
      };
      
      console.log("Saving form with data:", formData);
      
      // Update existing form
      const success = await saveForm(currentFormId, formData);
      
      if (success) {
        toast.success(language === 'ar' ? 'تم حفظ النموذج بنجاح' : 'Form saved successfully');
        
        // Update form state
        setFormState({
          ...formState,
          ...formData,
          id: currentFormId,
          style: formStyle
        });
      } else {
        // Try direct database update if the saveForm method fails
        const { error } = await supabase
          .from('forms')
          .update({
            title: formTitle,
            description: formDescription,
            data: [formStep],
            shop_id: shopId,
            style: formStyle,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentFormId);
        
        if (error) {
          console.error("Direct database update failed:", error);
          toast.error(language === 'ar' ? 'فشل حفظ النموذج' : 'Failed to save form');
        } else {
          toast.success(language === 'ar' ? 'تم حفظ النموذج بنجاح' : 'Form saved successfully');
        }
      }
    } catch (error) {
      console.error("Error saving form:", error);
      toast.error(language === 'ar' ? 'خطأ في حفظ النموذج' : 'Error saving form');
    }
    
    setIsSaving(false);
  };

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
      
      // Try using the publishForm method from useFormTemplates
      const success = await publishForm(currentFormId, newPublishState);
      
      if (success) {
        setIsPublished(newPublishState);
        toast.success(
          newPublishState 
            ? (language === 'ar' ? 'تم نشر النموذج بنجاح' : 'Form published successfully')
            : (language === 'ar' ? 'تم إلغاء نشر النموذج' : 'Form unpublished')
        );
      } else {
        // Try direct database update if the publishForm method fails
        const { error } = await supabase
          .from('forms')
          .update({
            is_published: newPublishState,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentFormId);
        
        if (error) {
          console.error("Direct database update for publishing failed:", error);
          toast.error(language === 'ar' ? 'فشل تغيير حالة النشر' : 'Failed to change publish status');
        } else {
          setIsPublished(newPublishState);
          toast.success(
            newPublishState 
              ? (language === 'ar' ? 'تم نشر النموذج بنجاح' : 'Form published successfully')
              : (language === 'ar' ? 'تم إلغاء نشر النموذج' : 'Form unpublished')
          );
        }
      }
    } catch (error) {
      console.error("Error publishing form:", error);
      toast.error(language === 'ar' ? 'خطأ في نشر النموذج' : 'Error publishing form');
    }
    
    setIsPublishing(false);
  };

  const addElement = (type: string) => {
    const newElement: FormField = {
      type: type as FormFieldType,
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

  const editElement = (index: number) => {
    const element = formElements[index];
    setCurrentEditingField(element);
    setIsFieldEditorOpen(true);
  };

  const deleteElement = (index: number) => {
    const updatedElements = [...formElements];
    updatedElements.splice(index, 1);
    setFormElements(updatedElements);
    setSelectedElementIndex(null);
    setRefreshKey(prev => prev + 1);
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
    
    setTimeout(() => setRefreshKey(prev => prev + 1), 100);
    toast.success(language === 'ar' ? 'تم نسخ العنصر بنجاح' : 'Element duplicated successfully');
  };

  const handleSelectTemplate = async (templateId: number) => {
    const template = formTemplates.find(t => t.id === templateId);
    if (template) {
      toast.success(language === 'ar' ? `تم اختيار قالب ${template.title}` : `Selected template ${template.title}`);
      
      const storedStyle = localStorage.getItem('selectedTemplateStyle');
      const templateStyle = storedStyle ? JSON.parse(storedStyle) : null;
      
      if (templateStyle) {
        setFormStyle({
          primaryColor: template.primaryColor || templateStyle.primaryColor,
          borderRadius: templateStyle.borderRadius,
          fontSize: templateStyle.fontSize,
          buttonStyle: templateStyle.buttonStyle
        });
      }
      
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
      
      // Save the form immediately after applying template
      setTimeout(() => handleSave(), 500);
    }
  };

  const saveField = (updatedField: FormField) => {
    const newElements = [...formElements];
    const index = newElements.findIndex(el => el.id === updatedField.id);
    if (index !== -1) {
      newElements[index] = updatedField;
      setFormElements(newElements);
    }
    setIsFieldEditorOpen(false);
    setCurrentEditingField(null);
    
    setTimeout(() => {
      setSelectedElementIndex(null);
      setRefreshKey(prev => prev + 1);
    }, 100);
  };

  // Handle style change needs to match the expected signature for FormStyleEditor
  const handleStyleChange = (newStyle: any) => {
    setFormStyle({
      ...formStyle,
      ...newStyle
    });
    setRefreshKey(prev => prev + 1);
  };

  const handleSaveStyle = () => {
    setIsStyleDialogOpen(false);
    // لا تحفظ إعدادات النمط في localStorage بل اجعلها خاصة بالنموذج الحالي فقط
    
    // حفظ النموذج مع إعدادات النمط الجديدة
    handleSave();
    
    toast.success(language === 'ar' ? 'تم حفظ تخصيص النمط بنجاح' : 'Style customization saved successfully');
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
    
    setFormElements((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      
      return arrayMove(items, oldIndex, newIndex);
    });

    setTimeout(() => {
      setSelectedElementIndex(null);
      setRefreshKey(prev => prev + 1);
    }, 100);
  };

  const handleReorderElements = (reorderedElements: FormField[]) => {
    setFormElements(reorderedElements);
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
      toast.success(language === 'ar' ? 'تم إعادة ترتيب العناصر' : 'Elements reordered');
    }, 100);
  };

  const handleFloatingButtonChange = (config: FloatingButtonConfig) => {
    // Use the updateFloatingButton function from the useFormStore hook we called at the top
    updateFloatingButton(config);
    setRefreshKey(prev => prev + 1); // Refresh the preview
  };

  const handleFloatingButtonOpen = () => {
    setIsFloatingButtonDialogOpen(true);
  };

  const handleFloatingButtonClose = () => {
    setIsFloatingButtonDialogOpen(false);
  };

  // Show a loading screen during slow operations
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="text-lg font-medium text-gray-700">
            {language === 'ar' ? 'جاري تحميل النموذج...' : 'Loading form...'}
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <FormHeader 
        onSave={handleSave}
        onPublish={handlePublish}
        onStyleOpen={() => setIsStyleDialogOpen(true)}
        onTemplateOpen={() => setIsTemplateDialogOpen(true)}
        onFloatingButtonOpen={handleFloatingButtonOpen}
        isSaving={isSaving}
        isPublishing={isPublishing}
        isPublished={isPublished}
      />
      
      <div className="grid grid-cols-12 min-h-[calc(100vh-64px)]">
        <div className="col-span-2 border-r bg-white p-4">
          <FormElementList 
            onAddElement={addElement}
          />
        </div>
        
        <div className="col-span-6 bg-gray-50 p-6">
          <h2 className={`text-xl font-semibold mb-6 ${language === 'ar' ? 'text-right' : ''}`}>
            {language === 'ar' ? 'تحرير وترتيب عناصر النموذج' : 'Edit & Order Form Elements'}
          </h2>
          
          {/* Add the form title editor at top */}
          <FormTitleEditor
            formTitle={formTitle}
            formDescription={formDescription}
            onFormTitleChange={(title) => setFormTitle(title)}
            onFormDescriptionChange={(desc) => setFormDescription(desc)}
            formTitleField={getFormTitleField()}
            onAddTitleField={addFormTitleField}
            onUpdateTitleField={updateFormTitleField}
          />
          
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
                onReorderElements={handleReorderElements}
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
            floatingButton={floatingButton}
            hideFloatingButtonPreview={false}
          />
        </div>
      </div>
      
      {/* Style Editor Dialog */}
      <Dialog open={isStyleDialogOpen} onOpenChange={setIsStyleDialogOpen}>
        <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'تخصيص المظهر' : 'Customize Style'}
            </DialogTitle>
          </DialogHeader>
          
          <FormStyleEditor 
            formStyle={formStyle}
            onStyleChange={handleStyleChange}
            onSave={handleSaveStyle}
            floatingButton={floatingButton}
            onFloatingButtonChange={handleFloatingButtonChange}
            showFloatingButtonEditor={false}
          />
          
          <DialogFooter>
            <Button onClick={() => setIsStyleDialogOpen(false)}>
              {language === 'ar' ? 'تم' : 'Done'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Floating Button Dialog */}
      <Dialog open={isFloatingButtonDialogOpen} onOpenChange={setIsFloatingButtonDialogOpen}>
        <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'تخصيص الزر العائم' : 'Customize Floating Button'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar' 
                ? 'قم بتخصيص مظهر وسلوك الزر العائم الذي سيظهر في متجرك' 
                : 'Customize the appearance and behavior of the floating button that will appear in your store'}
            </DialogDescription>
          </DialogHeader>
          
          <FloatingButtonEditor 
            floatingButton={floatingButton} 
            onChange={handleFloatingButtonChange}
          />
          
          <DialogFooter>
            <Button onClick={handleFloatingButtonClose}>
              {language === 'ar' ? 'تم' : 'Done'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Template Dialog */}
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
    </div>
  );
};

export default FormBuilderEditor;
