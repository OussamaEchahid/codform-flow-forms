import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppSidebar from '@/components/layout/AppSidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, Plus, Save, Trash, Copy, Edit, Eye, EyeOff, FileCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useFormTemplates, FormData } from '@/lib/hooks/useFormTemplates';
import { toast } from 'sonner';
import FormPreview from '@/components/form/FormPreview';
import FormList from '@/components/form/FormList';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogFooter,
  DialogTitle
} from '@/components/ui/dialog';
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import FieldEditor from '@/components/form/FieldEditor';
import { FormField } from '@/lib/form-utils';
import { formTemplates } from '@/lib/form-utils';

const FormBuilderPage = () => {
  const { formId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'editor'>(formId ? 'editor' : 'dashboard');
  const [currentForm, setCurrentForm] = useState<FormData | null>(null);
  const [isStyleDialogOpen, setIsStyleDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [formStyle, setFormStyle] = useState({
    primaryColor: '#9b87f5',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    buttonStyle: 'rounded',
  });
  
  const {
    forms,
    isLoading,
    fetchForms,
    createDefaultForm,
    saveForm,
    publishForm
  } = useFormTemplates();
  
  const [formElements, setFormElements] = useState<Array<{
    type: string;
    id: string;
    label: string;
    required?: boolean;
    placeholder?: string;
    style?: {
      backgroundColor?: string;
      color?: string;
      fontSize?: string;
      borderRadius?: string;
      borderWidth?: string;
      borderColor?: string;
    };
  }>>([
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
  
  useEffect(() => {
    if (formId) {
      setActiveTab('editor');
    } else {
      fetchForms();
      setActiveTab('dashboard');
    }
  }, [formId]);
  
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

  const handleSelectTemplate = (templateId: number) => {
    const template = formTemplates.find(t => t.id === templateId);
    if (template) {
      toast.success(language === 'ar' ? `تم استخدام قالب ${template.title}` : `Using template ${template.title}`);
      setIsTemplateDialogOpen(false);
    }
  };
  
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
      placeholder: language === 'ar' ? `أدخل ${type}` : `Enter ${type}`
    };
    
    const updatedElements = [...formElements, newElement];
    setFormElements(updatedElements);
    setTimeout(() => {
      setSelectedElementIndex(updatedElements.length - 1);
    }, 100);
  };

  const editElement = (index: number) => {
    const element = formElements[index];
    setCurrentEditingField(element as FormField);
    setIsFieldEditorOpen(true);
  };
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px minimum drag distance
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
    }, 100);
  };
  
  if (!user) {
    return <div className="text-center py-8">{language === 'ar' ? 'يرجى تسجيل الدخول للوصول إلى منشئ النماذج' : 'Please login to access the form builder'}</div>;
  }
  
  if (activeTab === 'dashboard') {
    return (
      <div className="flex min-h-screen bg-[#F8F9FB]">
        <AppSidebar />
        <main className="flex-1 p-8">
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
              <Button 
                onClick={handleCreateForm} 
                className="bg-[#9b87f5] hover:bg-[#7E69AB]"
              >
                <Plus className="mr-2 h-4 w-4" />
                {language === 'ar' ? 'إنشاء نموذج جديد' : 'Create New Form'}
              </Button>
            </div>
            
            <FormList 
              forms={forms} 
              isLoading={isLoading}
              onSelectForm={handleSelectForm}
            />
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <AppSidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/forms')}>
              {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
            </Button>
            <div className="h-4 w-[1px] bg-gray-300"></div>
            <div className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full flex items-center gap-2">
              <span>{language === 'ar' ? 'نموذج كـ نافذة منبثقة' : 'Form as popup'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsStyleDialogOpen(true)}
            >
              {language === 'ar' ? 'تخصيص المظهر' : 'Customize Style'}
            </Button>
            <Button 
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setIsTemplateDialogOpen(true)}
            >
              {language === 'ar' ? 'قوالب النماذج' : 'Form Templates'}
            </Button>
            <Button 
              className="flex items-center gap-2 bg-[#9b87f5] hover:bg-[#7E69AB]" 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              ) : (
                <Save size={18} />
              )}
              {language === 'ar' ? 'حفظ' : 'Save'}
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-12 min-h-[calc(100vh-64px)]">
          <div className="col-span-2 border-r bg-white p-4">
            <h3 className={`font-medium text-lg mb-4 ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar' ? 'عناصر للإضافة' : 'Elements To Add'}
            </h3>
            
            <div className="space-y-2">
              {availableElements.map((element) => (
                <div 
                  key={element.type}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 border rounded-md cursor-pointer"
                >
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="p-1" 
                    onClick={() => addElement(element.type)}
                  >
                    <Plus size={16} />
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <span>{element.label}</span>
                    <span className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded">
                      {element.icon}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-md border">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">
                        {language === 'ar' ? 'تنسيق النموذج العام' : 'Global form styling'}
                      </h3>
                      <Button variant="ghost" size="sm">
                        <ChevronDown size={16} />
                      </Button>
                    </div>
                  </div>
                  
                  {formElements.map((element, index) => (
                    <div 
                      key={element.id}
                      className={`bg-white p-4 rounded-md border ${selectedElementIndex === index ? 'ring-2 ring-[#9b87f5]' : ''}`}
                      onClick={() => setSelectedElementIndex(index)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="text-red-500 p-1">
                              <Trash size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-blue-500 p-1">
                              <Copy size={16} />
                            </Button>
                            <span className="border-r h-4 mx-2"></span>
                            <span className="font-medium">
                              {element.label} {language === 'ar' ? 'إعدادات' : 'configuration'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="bg-green-100 text-green-700 rounded-full p-1 h-8 w-8"
                          >
                            <Copy size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="bg-purple-100 text-purple-700 rounded-full p-1 h-8 w-8"
                            onClick={() => editElement(index)}
                          >
                            <Edit size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
          
          <div className="col-span-4 border-l bg-white p-6">
            <h3 className={`text-lg font-medium mb-4 ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar' ? 'معاينة مباشرة' : 'Live Preview'}
            </h3>
            
            <div className="border rounded-lg p-4 bg-gray-50">
              <FormPreview 
                formTitle={language === 'ar' ? "املأ النموذج للدفع عند الاستلام" : "Fill the form for cash on delivery"}
                currentStep={1}
                totalSteps={1}
                formStyle={formStyle}
              >
                <div className={`space-y-4 ${language === 'ar' ? 'text-right' : ''}`}>
                  <div className="form-control">
                    <label className="form-label">
                      {language === 'ar' ? 'الاسم الكامل' : 'Full name'}
                      <span className="text-red-500 mr-1">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder={language === 'ar' ? 'الاسم الكامل' : 'Full name'}
                      className="form-input"
                      style={{ borderRadius: formStyle.borderRadius }}
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="form-label">
                      {language === 'ar' ? 'رقم الهاتف' : 'Phone number'}
                      <span className="text-red-500 mr-1">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder={language === 'ar' ? 'رقم الهاتف' : 'Phone number'}
                      className="form-input"
                      style={{ borderRadius: formStyle.borderRadius }}
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="form-label">
                      {language === 'ar' ? 'المدينة' : 'City'}
                      <span className="text-red-500 mr-1">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder={language === 'ar' ? 'المدينة' : 'City'}
                      className="form-input"
                      style={{ borderRadius: formStyle.borderRadius }}
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="form-label">
                      {language === 'ar' ? 'العنوان' : 'Address'}
                      <span className="text-red-500 mr-1">*</span>
                    </label>
                    <textarea
                      placeholder={language === 'ar' ? 'العنوان' : 'address'}
                      className="form-input h-24"
                      style={{ borderRadius: formStyle.borderRadius }}
                    />
                  </div>
                  
                  <div className="mt-4">
                    <button 
                      className="w-full text-white py-2 px-4 flex justify-center items-center" 
                      style={{ 
                        backgroundColor: formStyle.primaryColor,
                        borderRadius: formStyle.borderRadius
                      }}
                    >
                      {language === 'ar' ? 'شراء بالدفع عند الاستلام' : 'Buy with Cash on Delivery'}
                    </button>
                  </div>
                </div>
              </FormPreview>
            </div>
          </div>
        </div>
      </main>
      
      <Dialog open={isStyleDialogOpen} onOpenChange={setIsStyleDialogOpen}>
        <DialogContent>
          <DialogTitle>
            {language === 'ar' ? 'تخصيص مظهر النموذج' : 'Customize Form Style'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ar' ? 'قم بتخصيص مظهر النموذج لتناسب هويتك التجارية' : 'Customize the form appearance to match your brand identity'}
          </DialogDescription>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-2">
              <label htmlFor="primary-color" className="text-sm font-medium">
                {language === 'ar' ? 'اللون الرئيسي' : 'Primary Color'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="primary-color"
                  type="color"
                  value={formStyle.primaryColor}
                  onChange={(e) => setFormStyle({...formStyle, primaryColor: e.target.value})}
                  className="w-10 h-10 rounded"
                />
                <input
                  type="text"
                  value={formStyle.primaryColor}
                  onChange={(e) => setFormStyle({...formStyle, primaryColor: e.target.value})}
                  className="flex-1 px-3 py-2 border rounded"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <label htmlFor="border-radius" className="text-sm font-medium">
                {language === 'ar' ? 'استدارة الحواف' : 'Border Radius'}
              </label>
              <select
                id="border-radius"
                value={formStyle.borderRadius}
                onChange={(e) => setFormStyle({...formStyle, borderRadius: e.target.value})}
                className="px-3 py-2 border rounded"
              >
                <option value="0">None</option>
                <option value="0.25rem">Small</option>
                <option value="0.5rem">Medium</option>
                <option value="1rem">Large</option>
                <option value="9999px">Round</option>
              </select>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <label htmlFor="font-size" className="text-sm font-medium">
                {language === 'ar' ? 'حجم الخط' : 'Font Size'}
              </label>
              <select
                id="font-size"
                value={formStyle.fontSize}
                onChange={(e) => setFormStyle({...formStyle, fontSize: e.target.value})}
                className="px-3 py-2 border rounded"
              >
                <option value="0.875rem">Small</option>
                <option value="1rem">Medium</option>
                <option value="1.125rem">Large</option>
              </select>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <label htmlFor="button-style" className="text-sm font-medium">
                {language === 'ar' ? 'نمط الأزرار' : 'Button Style'}
              </label>
              <select
                id="button-style"
                value={formStyle.buttonStyle}
                onChange={(e) => setFormStyle({...formStyle, buttonStyle: e.target.value})}
                className="px-3 py-2 border rounded"
              >
                <option value="rounded">Rounded</option>
                <option value="square">Square</option>
                <option value="pill">Pill</option>
              </select>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsStyleDialogOpen(false)}>
              {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <FormTemplatesDialog 
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

export default FormBuilderPage;
