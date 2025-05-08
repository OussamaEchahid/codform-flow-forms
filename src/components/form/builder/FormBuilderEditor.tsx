import React, { useState, useEffect } from 'react';
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

interface FormBuilderEditorProps {
  formId?: string;
}

const FormBuilderEditor: React.FC<FormBuilderEditorProps> = ({ formId }) => {
  const navigate = useNavigate();
  const params = useParams();
  const { t, language } = useI18n();
  const shopifyIntegration = useShopify();
  const { createFormFromTemplate, saveForm, loadForm, publishForm } = useFormTemplates();
  const { formState, setFormState } = useFormStore();
  
  const [isStyleDialogOpen, setIsStyleDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [submitButtonText, setSubmitButtonText] = useState('إرسال الطلب');
  const [formLanguage] = useState<'ar'>('ar');
  
  const [formStyle, setFormStyle] = useState(() => {
    const storedStyle = localStorage.getItem('selectedTemplateStyle');
    return storedStyle ? JSON.parse(storedStyle) : {
      primaryColor: '#9b87f5',
      borderRadius: '0.5rem',
      fontSize: '1rem',
      buttonStyle: 'rounded',
    };
  });
  
  const [refreshKey, setRefreshKey] = useState(0);
  const [formElements, setFormElements] = useState<Array<FormField>>([]);
  
  const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null);
  const [isFieldEditorOpen, setIsFieldEditorOpen] = useState(false);
  const [currentEditingField, setCurrentEditingField] = useState<FormField | null>(null);
  const [formTitle, setFormTitle] = useState(language === 'ar' ? 'نموذج جديد' : 'New Form');
  const [formDescription, setFormDescription] = useState('');
  const [currentPreviewStep, setCurrentPreviewStep] = useState(1);
  const [currentFormId, setCurrentFormId] = useState<string | undefined>(formId || params.formId);

  const availableElements = [
    { type: 'whatsapp', label: language === 'ar' ? 'زر واتساب' : 'WhatsApp Button', icon: '📱' },
    { type: 'image', label: language === 'ar' ? 'صورة' : 'Image', icon: '🖼️' },
    { type: 'title', label: language === 'ar' ? 'عنوان' : 'Title', icon: 'T' },
    { type: 'text/html', label: language === 'ar' ? 'نص/HTML' : 'Text/Html', icon: '📄' },
    { type: 'cart-items', label: language === 'ar' ? 'عنا��ر السلة' : 'Cart items', icon: '🛒' },
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
        buttonStyle: formStyle.buttonStyle,
        formLanguage: 'ar',
        rtl: true
      }).select();

      if (error) {
        console.error("Error creating new form:", error);
        toast.error(language === 'ar' ? 'حدث خطأ أثناء إنشاء نموذج جديد' : 'Error creating new form');
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
        submitButtonText: submitButtonText,
        primaryColor: formStyle.primaryColor,
        borderRadius: formStyle.borderRadius,
        fontSize: formStyle.fontSize,
        buttonStyle: formStyle.buttonStyle,
        formLanguage: 'ar',
        rtl: true
      });

      toast.success(language === 'ar' ? 'تم إنشاء نموذج جديد بنجاح' : 'New form created successfully');
    } catch (error) {
      console.error("Error initializing new form:", error);
      toast.error(language === 'ar' ? 'خطأ في إنشاء نموذج جديد' : 'Error initializing new form');
    }
  };

  // Load form data when formId changes
  useEffect(() => {
    const loadFormData = async () => {
      const id = formId || params.formId;
      
      if (id) {
        setCurrentFormId(id);
        try {
          const formData = await loadForm(id);
          
          if (formData) {
            setFormTitle(formData.title || (language === 'ar' ? 'نموذج جديد' : 'New Form'));
            setFormDescription(formData.description || '');
            setFormElements(
              formData.data?.flatMap(step => step.fields) || []
            );
            setIsPublished(!!formData.isPublished || !!formData.is_published);
            setSubmitButtonText(formData.submitButtonText || 'إرسال الطلب');
            setFormLanguage(formData.formLanguage || 'ar');
            
            // Update form style if available
            if (formData.primaryColor || formData.borderRadius || formData.fontSize || formData.buttonStyle) {
              setFormStyle({
                primaryColor: formData.primaryColor || '#9b87f5',
                borderRadius: formData.borderRadius || '0.5rem',
                fontSize: formData.fontSize || '1rem',
                buttonStyle: formData.buttonStyle || 'rounded'
              });
            }
            
            console.log("Loaded form data:", formData);
          } else {
            toast.error(language === 'ar' ? 'لم يتم العثور على النموذج' : 'Form not found');
            navigate('/form-builder');
          }
        } catch (error) {
          console.error("Error loading form:", error);
          toast.error(language === 'ar' ? 'خطأ في تحميل النموذج' : 'Error loading form');
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
  }, [formElements, formLanguage]);

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
      
      // إعداد بيانات النموذج للحفظ مع تضمين submitButtonText وإعدادات اللغة
      const formData = {
        id: currentFormId,
        title: formTitle,
        description: formDescription,
        data: [formStep],
        shop_id: shopId,
        submitButtonText: submitButtonText,
        primaryColor: formStyle.primaryColor,
        borderRadius: formStyle.borderRadius,
        fontSize: formStyle.fontSize,
        buttonStyle: formStyle.buttonStyle,
        formLanguage: 'ar' as const,
        rtl: true
      };
      
      console.log("Saving form with data:", formData);
      
      // محاولة التحديث المباشر في قاعدة البيانات
      const { error } = await supabase
        .from('forms')
        .update({
          title: formTitle,
          description: formDescription,
          data: [formStep],
          shop_id: shopId,
          updated_at: new Date().toISOString(),
          submitButtonText: submitButtonText,
          primaryColor: formStyle.primaryColor,
          borderRadius: formStyle.borderRadius,
          fontSize: formStyle.fontSize,
          buttonStyle: formStyle.buttonStyle,
          formLanguage: 'ar',
          rtl: true
        })
        .eq('id', currentFormId);
      
      if (error) {
        console.error("Database update failed:", error);
        
        // إذا فشل التحديث المباشر، نحاول استخدام وظيفة saveForm
        const success = await saveForm(currentFormId, formData);
        
        if (success) {
          toast.success(language === 'ar' ? 'تم حفظ النموذج بنجاح' : 'Form saved successfully');
        } else {
          toast.error(language === 'ar' ? 'فشل حفظ النموذج' : 'Failed to save form');
        }
      } else {
        // تحديث حالة النموذج في الذاكرة
        setFormState({
          ...formState,
          ...formData,
          id: currentFormId
        });
        
        toast.success(language === 'ar' ? 'تم حف�� النموذج بنجاح' : 'Form saved successfully');
        
        // تحديث حالة الحفظ
        setRefreshKey(prev => prev + 1);
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
        
        // تحديث حالة النموذج في الذاكرة
        setFormState({
          ...formState,
          isPublished: newPublishState,
          is_published: newPublishState
        });
      }
    } catch (error) {
      console.error("Error publishing form:", error);
      toast.error(language === 'ar' ? 'خطأ في نشر النموذج' : 'Error publishing form');
    }
    
    setIsPublishing(false);
  };

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
      // Auto save after adding element
      handleSave();
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

  const handleSelectTemplate = async (templateId: number) => {
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
      handleSave();
    }, 100);
  };

  const handleStyleChange = (key: string, value: string) => {
    setFormStyle({
      ...formStyle,
      [key]: value
    });
    setRefreshKey(prev => prev + 1);
    
    // Save style immediately when it changes
    setTimeout(() => handleSave(), 300);
  };

  const handleSaveStyle = () => {
    setIsStyleDialogOpen(false);
    localStorage.setItem('selectedTemplateStyle', JSON.stringify(formStyle));
    
    // Save form with updated style
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
    } catch (error) {
      console.error("Error saving Shopify settings:", error);
      toast.error(
        language === 'ar'
          ? 'حدث خطأ أثناء حفظ إعدادات شوبيفاي'
          : 'Error saving Shopify settings'
      );
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
    
    setFormElements((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      
      return arrayMove(items, oldIndex, newIndex);
    });

    setTimeout(() => {
      setSelectedElementIndex(null);
      setRefreshKey(prev => prev + 1);
      handleSave();
    }, 300);
  };

  // Handle submit button text change with auto-save
  const handleSubmitButtonTextChange = (text: string) => {
    setSubmitButtonText(text);
    // Save after changing submit button text
    setTimeout(() => handleSave(), 300);
  };

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
      />
      
      <div className="grid grid-cols-12 min-h-[calc(100vh-64px)]">
        <div className="col-span-2 border-r bg-white p-4">
          <FormElementList 
            availableElements={availableElements}
            onAddElement={addElement}
          />
        </div>
        
        <div className="col-span-6 bg-gray-50 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-xl font-semibold ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar' ? 'تحرير وترتيب عناصر النموذج' : 'Edit & Order Form Elements'}
            </h2>
          </div>
          
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
                  onChange={(e) => {
                    setFormTitle(e.target.value);
                    // Autosave with debounce
                    setTimeout(() => handleSave(), 500);
                  }}
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
                  onChange={(e) => {
                    setFormDescription(e.target.value);
                    // Autosave with debounce
                    setTimeout(() => handleSave(), 500);
                  }}
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
