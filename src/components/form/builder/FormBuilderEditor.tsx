
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
  { type: 'image', label: 'Image', icon: '🖼️' }
  // Removed 'form-title' element type
];

// Add function to get active shop ID
const getActiveShopId = (): string | null => {
  // Get from localStorage or any other source
  return localStorage.getItem('shopify_store') || 
         localStorage.getItem('shopify_active_store') || 
         null;
};

interface FormBuilderEditorProps {
  shopId?: string;
  formId?: string;
  onClose?: () => void;
}

const FormBuilderEditor: React.FC<FormBuilderEditorProps> = ({ shopId, formId: initialFormId, onClose }) => {
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const [formStyle, setFormStyle] = useState<FormStyle>({
    primaryColor: '#9b87f5',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    buttonStyle: 'rounded',
    borderColor: '#e2e8f0',
    borderWidth: '1px',
    backgroundColor: '#ffffff',
    paddingTop: '20px',
    paddingBottom: '20px',
    paddingLeft: '20px',
    paddingRight: '20px',
    formGap: '16px',
    formDirection: 'ltr',
    floatingLabels: false
  });
  
  const [refreshKey, setRefreshKey] = useState(0);
  const [formElements, setFormElements] = useState<Array<FormField>>([]);
  
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isFieldEditorOpen, setIsFieldEditorOpen] = useState(false);
  const [currentEditingField, setCurrentEditingField] = useState<FormField | null>(null);
  const [formTitle, setFormTitle] = useState(language === 'ar' ? 'نموذج جديد' : 'New Form');
  const [formDescription, setFormDescription] = useState(language === 'ar' ? 'نموذج جديد' : 'New Form');
  const [currentPreviewStep, setCurrentPreviewStep] = useState(1);
  const [currentFormId, setCurrentFormId] = useState<string | undefined>(initialFormId);

  // إنشاء نموذج افتراضي جديد مع الحقول المطلوبة
  const createDefaultForm = (): FormField[] => {
    const fields: FormField[] = [];
    
    // Add title field first
    fields.push({
      type: 'form-title',
      id: `form-title-${Date.now()}`,
      label: language === 'ar' ? 'نموذج جديد' : 'New Form',
      helpText: language === 'ar' ? 'نموذج جديد' : 'New Form',
      style: {
        backgroundColor: '#9b87f5',
        color: '#ffffff',
        textAlign: language === 'ar' ? 'right' : 'center' as 'right' | 'center',
        fontSize: '24px',
        fontWeight: 'bold',
        descriptionColor: 'rgba(255, 255, 255, 0.9)',
        descriptionFontSize: '14px',
      },
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
    
    // إضافة حقل المدينة (City) بعد رقم الهاتف
    fields.push({
      type: 'text' as FormFieldType,
      id: `city-${Date.now()}`,
      label: language === 'ar' ? 'المدينة' : 'City',
      placeholder: language === 'ar' ? 'أدخل اسم المدينة' : 'Enter city name',
      required: true,
      icon: 'map-pin',
    });
    
    // إضافة حقل العنوان
    fields.push({
      type: 'textarea' as FormFieldType,
      id: `textarea-${Date.now()}`,
      label: language === 'ar' ? 'العنوان' : 'Address',
      placeholder: language === 'ar' ? 'العنوان' : 'address',
      required: true,
    });
    
    // إضافة زر الطلب مع الإعدادات الجديدة
    fields.push({
      type: 'submit' as FormFieldType,
      id: `submit-${Date.now()}`,
      label: language === 'ar' ? 'الدفع عند الاستلام' : 'Buy with Cash on Delivery',
      style: {
        backgroundColor: '#000000', // لون الخلفية الأسود
        color: '#ffffff', // لون النص الأبيض
        fontSize: '1.15rem', // حجم الخط
        fontWeight: '500', // وزن النص
        animation: true,
        animationType: 'shake', // نوع الحركة
        borderColor: '#eaeaff', // لون الحدود
        borderRadius: '6px', // انحناء الحدود
        borderWidth: '0px', // عرض الحدود
        paddingY: '12px', // المسافة العمودية
        showIcon: true, // إظهار الأيقونة
        icon: 'shopping-cart', // نوع الأيقونة
        iconPosition: 'left', // موضع الأيقونة
      },
    });
    
    return fields;
  };

  // تهيئة نموذج جديد إذا لم يتم تقديم معرف نموذج - تم تحسينه للأداء
  const initializeNewForm = async () => {
    try {
      // Show loading state immediately
      setIsLoading(true);
      
      const activeShopId = getActiveShopId();
      if (!activeShopId) {
        toast.error(language === 'ar' ? 'لم يتم العثور على متجر نشط' : 'No active shop found');
        setIsLoading(false);
        return;
      }

      // Create a new ID for the form
      const newId = uuidv4();
      setCurrentFormId(newId);

      // Set initial form style with all required properties
      const defaultStyle: FormStyle = {
        primaryColor: '#9b87f5',
        borderRadius: '0.5rem',
        fontSize: '1rem',
        buttonStyle: 'rounded',
        borderColor: '#e2e8f0',
        borderWidth: '1px',
        backgroundColor: '#ffffff',
        paddingTop: '20px',
        paddingBottom: '20px',
        paddingLeft: '20px',
        paddingRight: '20px',
        formGap: '16px',
        formDirection: 'ltr',
        floatingLabels: false
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
        shop_id: activeShopId,
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
        shop_id: activeShopId,
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
      const id = initialFormId || params.formId;
      
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
            
            // Filter out any form-title elements
            let loadedElements = formData.data?.flatMap(step => step.fields) || [];
            loadedElements = loadedElements.filter(f => f.type !== 'form-title');
            
            // إذا لم يكن هناك زر إرسال، أضفه
            const needsSubmitButton = !loadedElements.some(f => f.type === 'submit');
            
            if (needsSubmitButton) {
              const submitButton: FormField = {
                type: 'submit',
                id: `submit-${Date.now()}`,
                label: language === 'ar' ? 'الدفع عند الاستلام' : 'Buy with Cash on Delivery',
                style: {
                  backgroundColor: '#000000',
                  color: '#ffffff',
                  fontSize: '1.15rem',
                  animation: true,
                  animationType: 'shake',
                  borderColor: '#eaeaff',
                  borderRadius: '6px',
                  borderWidth: '0px',
                  paddingY: '12px',
                  showIcon: true,
                  icon: 'shopping-cart',
                  iconPosition: 'left',
                },
              };
              loadedElements.push(submitButton);
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
                borderColor: formData.style.borderColor || '#e2e8f0',
                borderWidth: formData.style.borderWidth || '1px',
                backgroundColor: formData.style.backgroundColor || '#ffffff',
                paddingTop: formData.style.paddingTop || '20px',
                paddingBottom: formData.style.paddingBottom || '20px',
                paddingLeft: formData.style.paddingLeft || '20px',
                paddingRight: formData.style.paddingRight || '20px',
                formGap: formData.style.formGap || '16px',
                formDirection: formData.style.formDirection || 'ltr',
                floatingLabels: formData.style.floatingLabels || false
              });
            } else {
              // قيم افتراضية إذا كان النمط مفقودًا
              setFormStyle({
                primaryColor: '#9b87f5',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                buttonStyle: 'rounded',
                borderColor: '#e2e8f0',
                borderWidth: '1px',
                backgroundColor: '#ffffff',
                paddingTop: '20px',
                paddingBottom: '20px',
                paddingLeft: '20px',
                paddingRight: '20px',
                formGap: '16px',
                formDirection: 'ltr',
                floatingLabels: false
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
  }, [initialFormId, params.formId]);

  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [formElements]);

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
      
      const activeShopId = getActiveShopId();
      
      if (!activeShopId) {
        console.warn("No active shop ID found, saving without shop association");
      }
      
      // حفظ إعدادات النمط مع النموذج
      const formData: Partial<FormData> = {
        title: formTitle,
        description: formDescription,
        data: [formStep],
        shop_id: activeShopId,
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
        
        // Reset unsaved changes flag
        setHasUnsavedChanges(false);
      } else {
        // Try direct database update if the saveForm method fails
        const { error } = await supabase
          .from('forms')
          .update({
            title: formTitle,
            description: formDescription,
            data: [formStep],
            shop_id: activeShopId,
            style: formStyle,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentFormId);
        
        if (error) {
          console.error("Direct database update failed:", error);
          toast.error(language === 'ar' ? 'فشل حفظ النموذج' : 'Failed to save form');
        } else {
          toast.success(language === 'ar' ? 'تم حفظ النموذج بنجاح' : 'Form saved successfully');
          setHasUnsavedChanges(false);
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
    // Never add form-title through the normal element addition
    if (type === 'form-title') {
      toast.info(language === 'ar' 
        ? 'عنوان النموذج موجود بالفعل، يمكنك تعديله من شاشة تحرير العناصر' 
        : 'The form title already exists, you can edit it from the element editor');
      return;
    }
    
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
      setSelectedIndex(updatedElements.length - 1);
      setRefreshKey(prev => prev + 1);
    }, 100);
    
    // Mark as having unsaved changes
    setHasUnsavedChanges(true);
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
    setSelectedIndex(null);
    setRefreshKey(prev => prev + 1);
    setHasUnsavedChanges(true);
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
    setHasUnsavedChanges(true);
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
          primaryColor: template.primaryColor || templateStyle.primaryColor || '#9b87f5',
          borderRadius: templateStyle.borderRadius || '0.5rem',
          fontSize: templateStyle.fontSize || '1rem',
          buttonStyle: templateStyle.buttonStyle || 'rounded',
          borderColor: templateStyle.borderColor || '#e2e8f0',
          borderWidth: templateStyle.borderWidth || '1px',
          backgroundColor: templateStyle.backgroundColor || '#ffffff',
          paddingTop: templateStyle.paddingTop || '20px',
          paddingBottom: templateStyle.paddingBottom || '20px',
          paddingLeft: templateStyle.paddingLeft || '20px',
          paddingRight: templateStyle.paddingRight || '20px',
          formGap: templateStyle.formGap || '16px',
          formDirection: templateStyle.formDirection || 'ltr',
          floatingLabels: templateStyle.floatingLabels || false
        });
      }
      
      // Filter out any form-title fields from template
      const newElements = template.data.flatMap(step => 
        step.fields
          .filter(field => field.type !== 'form-title')
          .map(field => ({
            ...field,
            id: `${field.type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
          }))
      );
      
      setFormTitle(template.title);
      setFormDescription(template.description);
      setFormElements(newElements);
      setRefreshKey(prev => prev + 1);
      setIsTemplateDialogOpen(false);
      setHasUnsavedChanges(true);
      
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
    setHasUnsavedChanges(true);
    
    setTimeout(() => {
      setSelectedIndex(null);
      setRefreshKey(prev => prev + 1);
    }, 100);
  };

  // Handle style change needs to match the expected signature for FormStyleEditor
  const handleStyleChange = (newStyle: any) => {
    setFormStyle({
      ...formStyle,
      ...newStyle
    });
    setHasUnsavedChanges(true);
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
      setSelectedIndex(null);
      setRefreshKey(prev => prev + 1);
      setHasUnsavedChanges(true);
    }, 100);
  };

  const handleReorderElements = (reorderedElements: FormField[]) => {
    setFormElements(reorderedElements);
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
      setHasUnsavedChanges(true);
      toast.success(language === 'ar' ? 'تم إعادة ترتيب العناصر' : 'Elements reordered');
    }, 100);
  };

  const handleFloatingButtonChange = (config: FloatingButtonConfig) => {
    // Use the updateFloatingButton function from the useFormStore hook we called at the top
    updateFloatingButton(config);
    setRefreshKey(prev => prev + 1); // Refresh the preview
    setHasUnsavedChanges(true);
  };

  const handleFloatingButtonOpen = () => {
    setIsFloatingButtonDialogOpen(true);
  };

  const handleFloatingButtonClose = () => {
    setIsFloatingButtonDialogOpen(false);
  };

  // Handle form title updates from the title editor
  const handleTitleUpdate = (title: string, description: string, titleStyle: any) => {
    // Update form title and description state
    setFormTitle(title);
    setFormDescription(description);
    
    // Find title field index
    const titleFieldIndex = formElements.findIndex(
      element => element.type === 'form-title' && element.id === 'form-title-static'
    );
    
    if (titleFieldIndex >= 0) {
      // Update the field in elements array
      const updatedElements = [...formElements];
      updatedElements[titleFieldIndex] = {
        ...updatedElements[titleFieldIndex],
        label: title,
        helpText: description,
        style: titleStyle
      };
      setFormElements(updatedElements);
    } else {
      // Create a new title field
      const newTitleField: FormField = {
        id: 'form-title-static',
        type: 'form-title',
        label: title,
        helpText: description,
        style: titleStyle
      };
      
      // Add it to the beginning of elements
      setFormElements([newTitleField, ...formElements]);
    }
    
    // If the title style sets backgroundColor, also update the global form style for consistency
    if (titleStyle && titleStyle.backgroundColor) {
      handleStylePropertyChange('backgroundColor', titleStyle.backgroundColor);
    }
    
    setHasUnsavedChanges(true);
    setRefreshKey(prev => prev + 1);
  };

  // Handle individual style property updates
  const handleStylePropertyChange = (key: string, value: string) => {
    setFormStyle(prevStyle => ({
      ...prevStyle,
      [key]: value
    }));
    
    // Sync with form store when style properties change
    const formStore = useFormStore.getState();
    formStore.setFormState({
      style: {
        ...formStore.formState.style,
        [key]: value
      }
    });
    
    // Refresh preview after style change
    setRefreshKey(prev => prev + 1);
    setHasUnsavedChanges(true);
  };

  // Add the missing handleElementUpdate function
  const handleElementUpdate = (index: number, updatedElement: FormField) => {
    const updatedElements = [...formElements];
    
    if (index >= 0 && index < updatedElements.length) {
      updatedElements[index] = {
        ...updatedElement,
        // Preserve the original ID to ensure consistency
        id: formElements[index].id
      };
      
      setFormElements(updatedElements);
      setRefreshKey(prev => prev + 1);
      setHasUnsavedChanges(true);
    }
  };
  
  // Implement missing handler functions
  const handleSelectElement = (index: number) => {
    setSelectedIndex(index);
  };
  
  const handleEditElement = (index: number) => {
    editElement(index);
  };
  
  const handleDeleteElement = (index: number) => {
    deleteElement(index);
  };
  
  const handleDuplicateElement = (index: number) => {
    duplicateElement(index);
  };
  
  const handleUpdateElement = (index: number, updatedElement: FormField) => {
    handleElementUpdate(index, updatedElement);
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
    <div className="flex flex-col h-screen">
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
          
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={formElements.filter(el => el.type !== 'form-title').map(el => el.id)}
              strategy={verticalListSortingStrategy}
            >
              <FormElementEditor
                elements={formElements}
                selectedIndex={selectedIndex}
                onSelectElement={handleSelectElement}
                onEditElement={handleEditElement}
                onDeleteElement={handleDeleteElement}
                onDuplicateElement={handleDuplicateElement}
                onReorderElements={handleReorderElements}
                onUpdateElement={handleUpdateElement}
                formTitle={formTitle}
                formDescription={formDescription}
                formStyle={formStyle}
                onTitleUpdate={handleTitleUpdate}
                onStyleChange={handleStylePropertyChange}
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
