import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useFormTemplates, FormData } from '@/lib/hooks/useFormTemplates';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import FormTemplatesDialog from '@/components/form/FormTemplatesDialog';
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
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import FieldEditor from '@/components/form/FieldEditor';
import { FormField, FormStep, formTemplates } from '@/lib/form-utils';
import FormList from '@/components/form/FormList';
import FormHeader from '@/components/form/builder/FormHeader';
import FormStyleEditor from '@/components/form/builder/FormStyleEditor';
import FormElementList from '@/components/form/builder/FormElementList';
import FormElementEditor from '@/components/form/builder/FormElementEditor';
import FormPreviewPanel from '@/components/form/builder/FormPreviewPanel';
import ShopifyIntegration from '@/components/form/builder/ShopifyIntegration';
import { useShopify } from '@/hooks/useShopify';
import { ShopifyFormData } from '@/lib/shopify/types';
import { Dialog } from '@/components/ui/dialog';

const FormBuilderPage = () => {
  const { formId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const { 
    forms, 
    isLoading, 
    fetchForms, 
    createDefaultForm, 
    createFormFromTemplate 
  } = useFormTemplates();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'editor'>(formId ? 'editor' : 'dashboard');
  const [currentForm, setCurrentForm] = useState<FormData | null>(null);
  const [isStyleDialogOpen, setIsStyleDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  
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
  const [formElements, setFormElements] = useState<Array<FormField>>([
    { type: 'title', id: 'title-1', label: language === 'ar' ? 'املأ النموذج للدفع عند الاستلام' : 'Fill the form for cash on delivery' },
    { type: 'text', id: 'name-1', label: language === 'ar' ? 'الاسم الكامل' : 'Full name', required: true, placeholder: language === 'ar' ? 'الاسم الكامل' : 'Full name' },
    { type: 'phone', id: 'phone-1', label: language === 'ar' ? 'رقم الهاتف' : 'Phone number', required: true, placeholder: language === 'ar' ? 'رقم الهاتف' : 'Phone number' },
    { type: 'text', id: 'city-1', label: language === 'ar' ? 'المدينة' : 'City', required: true, placeholder: language === 'ar' ? 'المدينة' : 'City' },
    { type: 'textarea', id: 'address-1', label: language === 'ar' ? 'العنوان' : 'Address', required: true, placeholder: language === 'ar' ? 'العنوان' : 'address' },
    { type: 'cart-items', id: 'cart-1', label: language === 'ar' ? 'المنتج' : 'Product item' },
    { type: 'submit', id: 'submit-1', label: language === 'ar' ? 'شراء بالدفع عند الاستلام' : 'Buy with Cash on Delivery' }
  ]);
  const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFieldEditorOpen, setIsFieldEditorOpen] = useState(false);
  const [currentEditingField, setCurrentEditingField] = useState<FormField | null>(null);
  const [formTitle, setFormTitle] = useState(language === 'ar' ? 'نموذج جديد' : 'New Form');
  const [formDescription, setFormDescription] = useState('');
  const [currentPreviewStep, setCurrentPreviewStep] = useState(1);
  const [isShopifyConnected, setIsShopifyConnected] = useState(false);

  const shopifyIntegration = useShopify();

  const deleteElement = (index: number) => {
    const updatedElements = [...formElements];
    updatedElements.splice(index, 1);
    setFormElements(updatedElements);
    setSelectedElementIndex(null);
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [formElements]);

  useEffect(() => {
    if (formId) {
      setActiveTab('editor');
    } else {
      fetchForms();
      setActiveTab('dashboard');
    }
  }, [formId, fetchForms]);

  const handleCreateForm = async () => {
    const newForm = await createDefaultForm();
    if (newForm) {
      navigate(`/form-builder/${newForm.id}`);
    }
  };

  const handleSelectForm = (formId: string) => {
    navigate(`/form-builder/${formId}`);
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success(language === 'ar' ? 'تم حفظ النموذج بنجاح' : 'Form saved successfully');
    }, 1000);
  };

  const handleSelectTemplate = useCallback(async (templateId: number) => {
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
      
      if (activeTab === 'editor') {
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
        return;
      }
      
      const newForm = await createFormFromTemplate(templateId);
      if (newForm) {
        navigate(`/form-builder/${newForm.id}`);
      }
      
      setIsTemplateDialogOpen(false);
    }
  }, [language, createFormFromTemplate, navigate, activeTab]);

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

  const editElement = (index: number) => {
    const element = formElements[index];
    setCurrentEditingField(element);
    setIsFieldEditorOpen(true);
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

  const handleStyleChange = (key: string, value: string) => {
    setFormStyle({
      ...formStyle,
      [key]: value
    });
    setRefreshKey(prev => prev + 1);
  };

  const handleSaveStyle = () => {
    setIsStyleDialogOpen(false);
    localStorage.setItem('selectedTemplateStyle', JSON.stringify(formStyle));
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

  const handleShopifyIntegration = async (settings: ShopifyFormData) => {
    try {
      await shopifyIntegration.syncFormWithShopify(settings);
      toast.success(
        language === 'ar' 
          ? 'تم حفظ إعدادات شوبيفاي بنجاح'
          : 'Shopify settings saved successfully'
      );
    } catch (error) {
      toast.error(
        language === 'ar'
          ? 'حدث خطأ أثناء حفظ إعدادات شوبيفاي'
          : 'Error saving Shopify settings'
      );
    }
  };

  if (!user) {
    return <div className="text-center py-8">{language === 'ar' ? 'يرجى تسجيل الدخول للوصول إلى منشئ النماذج' : 'Please login to access the form builder'}</div>;
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      
      {activeTab === 'dashboard' ? (
        <div className="flex-1 p-8">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {language === 'ar' ? 'النماذج' : 'Forms'}
                </h1>
                <p className="text-gray-600">
                  {language === 'ar' ? 'إدارة نماذج الدفع عند الاستلام' : 'Manage your Cash On Delivery forms'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setIsTemplateDialogOpen(true)} 
                  variant="outline"
                >
                  {language === 'ar' ? 'استخدام قالب' : 'Use Template'}
                </Button>
                <Button 
                  onClick={handleCreateForm} 
                  className="bg-[#9b87f5] hover:bg-[#7E69AB]"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {language === 'ar' ? 'إنشاء نموذج جديد' : 'Create New Form'}
                </Button>
              </div>
            </div>
            
            <FormList 
              forms={forms} 
              isLoading={isLoading}
              onSelectForm={handleSelectForm}
            />
          </div>
          
          <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
            <FormTemplatesDialog 
              open={isTemplateDialogOpen}
              onSelect={handleSelectTemplate} 
              onClose={() => setIsTemplateDialogOpen(false)}
            />
          </Dialog>
        </div>
      ) : (
        <main className="flex-1 overflow-auto">
          <FormHeader 
            onSave={handleSave}
            onPublish={() => {}}
            onStyleOpen={() => setIsStyleDialogOpen(true)}
            onTemplateOpen={() => setIsTemplateDialogOpen(true)}
            isSaving={isSaving}
            isPublishing={false}
            isPublished={false}
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
              />
            </div>
          </div>
        </main>
      )}
      
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

      {activeTab === 'editor' && (
        <div className="mt-6">
          <ShopifyIntegration
            formId={formId || ''}
            onSave={handleShopifyIntegration}
            isSyncing={shopifyIntegration.isSyncing}
          />
        </div>
      )}
    </div>
  );
};

export default FormBuilderPage;
