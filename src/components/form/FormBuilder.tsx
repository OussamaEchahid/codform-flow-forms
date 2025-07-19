import React, { useState, useEffect } from 'react';
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
import SortableStep from './SortableStep';
import SortableField from './SortableField';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Copy, FileText, LayoutGrid, Plus, Settings, Trash, Save, FileCheck, Palette } from 'lucide-react';
import FormPreview from './FormPreview';
import FormTemplatesDialog from './FormTemplatesDialog';
import FieldEditor from './FieldEditor';
import { cn } from '@/lib/utils';
import { FormField, FormStep, deepCloneField, deepCloneStep, formTemplates } from '@/lib/form-utils';
import { Dialog, DialogTrigger, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { useFormTemplates, FormData } from '@/lib/hooks/useFormTemplates';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useI18n } from '@/lib/i18n';

const availableFieldTypes: Array<{
  type: FormField['type'];
  label: string;
  icon: React.ReactNode;
}> = [
  { type: 'form-title', label: 'عنوان النموذج المخصص', icon: <Palette size={16} /> },
  { type: 'text', label: 'حقل نص', icon: <FileText size={16} /> },
  { type: 'email', label: 'بريد إلكتروني', icon: <FileText size={16} /> },
  { type: 'phone', label: 'رقم هاتف', icon: <FileText size={16} /> },
  { type: 'textarea', label: 'نص متعدد الأسطر', icon: <FileText size={16} /> },
  { type: 'select', label: 'قائمة منسدلة', icon: <LayoutGrid size={16} /> },
  { type: 'checkbox', label: 'خانة اختيار', icon: <LayoutGrid size={16} /> },
  { type: 'radio', label: 'زر راديو', icon: <LayoutGrid size={16} /> },
  { type: 'cart-items', label: 'المنتج المختار', icon: <FileText size={16} /> },
  { type: 'cart-summary', label: 'ملخص الطلب', icon: <LayoutGrid size={16} /> },
  { type: 'submit', label: 'زر إرسال الطلب', icon: <FileCheck size={16} /> },
  { type: 'text/html', label: 'نص/HTML', icon: <FileText size={16} /> },
  { type: 'title', label: 'عنوان قسم', icon: <FileText size={16} /> },
];

interface FormBuilderProps {
  initialFormData: FormData;
}

const FormBuilder: React.FC<FormBuilderProps> = ({ initialFormData }) => {
  const navigate = useNavigate();
  const { language } = useI18n();
  const { saveForm, publishForm } = useFormTemplates();
  const [formTitle, setFormTitle] = useState(initialFormData.title);
  const [formDescription, setFormDescription] = useState(initialFormData.description || '');
  const [formSteps, setFormSteps] = useState<FormStep[]>(initialFormData.data);
  const [currentPreviewStep, setCurrentPreviewStep] = useState(1);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isFieldEditorOpen, setIsFieldEditorOpen] = useState(false);
  const [isStyleDialogOpen, setIsStyleDialogOpen] = useState(false);
  const [currentEditingField, setCurrentEditingField] = useState<FormField | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [currentEditStep, setCurrentEditStep] = useState(0);
  const [previewRefresh, setPreviewRefresh] = useState(0);
  const [formStyle, setFormStyle] = useState({
    primaryColor: '#9b87f5',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    buttonStyle: 'rounded',
  });
  
  const handleSaveForm = async () => {
    setIsSaving(true);
    const saved = await saveForm(initialFormData.id, {
      title: formTitle,
      description: formDescription,
      data: formSteps
    });
    setIsSaving(false);
    
    if (saved) {
      toast.success('تم حفظ النموذج بنجاح');
    }
  };

  const handlePublishForm = async () => {
    setIsPublishing(true);
    const published = await publishForm(initialFormData.id, !initialFormData.is_published);
    setIsPublishing(false);
    
    if (published) {
      navigate('/form-builder');
    }
  };
  
  const addNewStep = () => {
    const newStep = {
      id: (formSteps.length + 1).toString(),
      title: `خطوة جديدة ${formSteps.length + 1}`,
      fields: []
    };
    setFormSteps([...formSteps, newStep]);
    setCurrentEditStep(formSteps.length);
    setPreviewRefresh(prev => prev + 1);
  };
  
  const applyTemplate = (templateId: number) => {
    const template = formTemplates.find(t => t.id === templateId);
    if (template) {
      // Process the template data to ensure type safety
      const processedData = template.data.map(step => {
        // Clone the step
        const newStep = { ...step };
        
        // Process each field to ensure type compatibility
        const processedFields = step.fields.map(field => {
          const newField = deepCloneField(field);
          
          // Ensure textAlign is a valid option
          if (newField.style && newField.style.textAlign) {
            const align = newField.style.textAlign as string;
            newField.style.textAlign = 
              (align === 'left' || align === 'center' || align === 'right') 
                ? align 
                : 'center';
          }
          
          return newField;
        });
        
        newStep.fields = processedFields;
        return newStep;
      });

      setFormSteps(processedData);
      setFormTitle(template.title);
      setFormDescription(template.description);
      setIsTemplateDialogOpen(false);
      setPreviewRefresh(prev => prev + 1);
      toast.success(`تم تطبيق قالب ${template.title} بنجاح`);
    }
  };
  
  const addFieldToStep = (type: FormField['type']) => {
    const newField = createEmptyField(type);
    const updatedSteps = [...formSteps];
    updatedSteps[currentEditStep].fields.push(newField);
    setFormSteps(updatedSteps);
    setPreviewRefresh(prev => prev + 1);
  };

  const editField = (field: FormField) => {
    setCurrentEditingField(field);
    setIsFieldEditorOpen(true);
  };

  const saveField = (updatedField: FormField) => {
    const updatedSteps = [...formSteps];
    const stepIndex = currentEditStep;
    const fieldIndex = updatedSteps[stepIndex].fields.findIndex(f => f.id === updatedField.id);
    
    if (fieldIndex !== -1) {
      updatedSteps[stepIndex].fields[fieldIndex] = updatedField;
      setFormSteps(updatedSteps);
    }
    
    setIsFieldEditorOpen(false);
    setCurrentEditingField(null);
    setPreviewRefresh(prev => prev + 1);
  };

  const deleteField = (fieldId: string) => {
    const updatedSteps = [...formSteps];
    const stepIndex = currentEditStep;
    updatedSteps[stepIndex].fields = updatedSteps[stepIndex].fields.filter(f => f.id !== fieldId);
    setFormSteps(updatedSteps);
    setPreviewRefresh(prev => prev + 1);
  };

  const duplicateField = (field: FormField) => {
    const newField = {
      ...field,
      id: `${field.id}-copy`,
      label: `${field.label} (نسخة)`
    };
    
    const updatedSteps = [...formSteps];
    const stepIndex = currentEditStep;
    const fieldIndex = updatedSteps[stepIndex].fields.findIndex(f => f.id === field.id);
    
    updatedSteps[stepIndex].fields.splice(fieldIndex + 1, 0, newField);
    setFormSteps(updatedSteps);
    setPreviewRefresh(prev => prev + 1);
  };
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEndSteps = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setFormSteps((steps) => {
      const oldIndex = steps.findIndex((step) => step.id === active.id);
      const newIndex = steps.findIndex((step) => step.id === over.id);
      const newSteps = arrayMove(steps, oldIndex, newIndex);
      return newSteps;
    });
    setPreviewRefresh(prev => prev + 1);
  };

  const handleDragEndFields = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const updatedSteps = [...formSteps];
    const currentStep = updatedSteps[currentEditStep];
    const oldIndex = currentStep.fields.findIndex((field) => field.id === active.id);
    const newIndex = currentStep.fields.findIndex((field) => field.id === over.id);
    
    currentStep.fields = arrayMove(currentStep.fields, oldIndex, newIndex);
    setFormSteps(updatedSteps);
    setPreviewRefresh(prev => prev + 1);
  };
  
  const handleStyleChange = (key: string, value: string) => {
    setFormStyle({
      ...formStyle,
      [key]: value
    });
    setPreviewRefresh(prev => prev + 1);
  };

  // Create default form fields with all required fields
  const createCompleteDefaultForm = (): FormStep[] => {
    const defaultFields: FormField[] = [];
    
    // Add form title field
    defaultFields.push({
      type: 'form-title',
      id: uuidv4(),
      label: language === 'ar' ? 'نموذج جديد' : 'New Form',
      helpText: language === 'ar' ? 'نموذج جديد' : 'New Form',
      style: {
        color: '#000000',
        textAlign: (language === 'ar' ? 'right' : 'left') as 'right' | 'left',
        fontWeight: 'bold',
        fontSize: '24px',
        descriptionColor: '#ffffff',
        descriptionFontSize: '14px',
        backgroundColor: '#9b87f5',
      }
    });
    
    // Add name field
    defaultFields.push({
      type: 'text',
      id: uuidv4(),
      label: language === 'ar' ? 'الاسم الكامل' : 'Full name',
      placeholder: language === 'ar' ? 'أدخل الاسم الكامل' : 'Enter full name',
      required: true,
      icon: 'user',
    });
    
    // Add phone field
    defaultFields.push({
      type: 'phone',
      id: uuidv4(),
      label: language === 'ar' ? 'رقم الهاتف' : 'Phone number',
      placeholder: language === 'ar' ? 'أدخل رقم الهاتف' : 'Enter phone number',
      required: true,
      icon: 'phone',
    });
    
    // Add address field
    defaultFields.push({
      type: 'textarea',
      id: uuidv4(),
      label: language === 'ar' ? 'العنوان' : 'Address',
      placeholder: language === 'ar' ? 'أدخل العنوان الكامل' : 'Enter full address',
      required: true,
    });
    
    // Add submit button
    defaultFields.push({
      type: 'submit',
      id: uuidv4(),
      label: language === 'ar' ? 'إرسال الطلب' : 'Submit Order',
      style: {
        backgroundColor: '#9b87f5',
        color: '#ffffff',
        fontSize: '18px',
        animation: true,
        animationType: 'pulse',
      },
    });
    
    const defaultStep: FormStep = {
      id: '1',
      title: 'Main Step',
      fields: defaultFields
    };
    
    return [defaultStep];
  };
  
  // Replace the useEffect that creates default forms
  useEffect(() => {
    // If the data is empty, we create a default form with all required fields
    if (initialFormData.data.length === 0) {
      const completeDefaultForm = createCompleteDefaultForm();
      setFormSteps(completeDefaultForm);
      setPreviewRefresh(prev => prev + 1);
    } else if (initialFormData.data.length > 0) {
      // Check if the form has all required fields
      const allFields = initialFormData.data.flatMap(step => step.fields);
      const hasName = allFields.some(f => f.type === 'text' && f.label.includes('اسم'));
      const hasPhone = allFields.some(f => f.type === 'phone');
      const hasAddress = allFields.some(f => f.type === 'textarea' && f.label.includes('عنوان'));
      const hasSubmit = allFields.some(f => f.type === 'submit');
      const hasTitle = allFields.some(f => f.type === 'form-title');
      
      // If missing any required field, add the complete default form
      if (!hasName || !hasPhone || !hasAddress || !hasSubmit || !hasTitle) {
        const completeDefaultForm = createCompleteDefaultForm();
        setFormSteps(completeDefaultForm);
        setPreviewRefresh(prev => prev + 1);
      }
    }
  }, [initialFormData]);

  // Create empty field with proper type handling
  const createEmptyField = (type: FormField['type']) => {
    let newField: FormField = {
      id: uuidv4(), // Use UUID from imported library
      type,
      label: '',
      required: false,
    };
  
    // Add field-specific configuration
    switch (type) {
      case 'form-title':
        newField.label = 'عنوان النموذج المخصص';
        newField.helpText = 'وصف النموذج (اختياري)';
        newField.style = {
          textAlign: 'center' as 'center',
          color: '#1A1F2C',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          descriptionColor: '#6b7280',
          descriptionFontSize: '1rem',
          backgroundColor: '',
        };
        break;
      case 'text':
        newField.label = 'حقل نص';
        break;
      case 'email':
        newField.label = 'بريد إلكتروني';
        break;
      case 'phone':
        newField.label = 'رقم هاتف';
        break;
      case 'textarea':
        newField.label = 'نص متعدد الأسطر';
        break;
      case 'select':
        newField.label = 'قائمة منسدلة';
        break;
      case 'checkbox':
        newField.label = 'خانة اختيار';
        break;
      case 'radio':
        newField.label = 'زر راديو';
        break;
      case 'cart-items':
        newField.label = 'المنتج المختار';
        break;
      case 'cart-summary':
        newField.label = 'ملخص الطلب';
        break;
      case 'submit':
        newField.label = 'زر إرسال الطلب';
        break;
      case 'text/html':
        newField.label = 'نص/HTML';
        break;
      case 'title':
        newField.label = 'عنوان قسم';
        break;
      default:
        newField.label = 'حقل جديد';
        break;
    }
  
    return newField;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleSaveForm}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <span className="animate-spin">
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                    <span>جاري الحفظ</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>حفظ</span>
                  </>
                )}
              </Button>
              <Button 
                variant={initialFormData.is_published ? "secondary" : "default"}
                onClick={handlePublishForm}
                disabled={isPublishing}
                className="flex items-center gap-2"
              >
                {isPublishing ? (
                  <span className="animate-spin">
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                ) : (
                  <FileCheck size={16} />
                )}
                <span>{initialFormData.is_published ? 'إلغاء النشر' : 'نشر النموذج'}</span>
              </Button>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsStyleDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Palette size={16} />
                تخصيص المظهر
              </Button>
              
              <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <FileText size={16} />
                    قوالب النماذج
                  </Button>
                </DialogTrigger>
                <FormTemplatesDialog 
                  open={isTemplateDialogOpen}
                  onSelect={applyTemplate} 
                  onClose={() => setIsTemplateDialogOpen(false)} 
                />
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="steps">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="steps">الخطوات</TabsTrigger>
                <TabsTrigger value="settings">الإعدادات</TabsTrigger>
                <TabsTrigger value="design">التصميم</TabsTrigger>
              </TabsList>
              
              <TabsContent value="steps" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-right">خطوات النموذج</h3>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEndSteps}
                    >
                      <SortableContext
                        items={formSteps.map(step => step.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {formSteps.map((step, index) => (
                          <SortableStep
                            key={step.id}
                            step={step}
                            isActive={currentEditStep === index}
                            onClick={() => setCurrentEditStep(index)}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                    
                    <Button 
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2"
                      onClick={addNewStep}
                    >
                      <Plus size={16} />
                      إضافة خطوة جديدة
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-right">إضافة حقول</h3>
                    {availableFieldTypes.map((fieldType) => (
                      <div 
                        key={fieldType.type} 
                        className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => addFieldToStep(fieldType.type)}
                      >
                        <Button variant="ghost" size="sm" className="p-0">
                          <Plus size={16} />
                        </Button>
                        <div className="flex items-center gap-2 text-right">
                          <span>{fieldType.label}</span>
                          {fieldType.icon}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3 text-right">
                    حقول الخطوة: {formSteps[currentEditStep]?.title}
                  </h3>
                  
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEndFields}
                  >
                    <SortableContext
                      items={formSteps[currentEditStep]?.fields.map(field => field.id) || []}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {formSteps[currentEditStep]?.fields.map((field) => (
                          <SortableField
                            key={field.id}
                            field={field}
                            onEdit={() => editField(field)}
                            onDuplicate={() => duplicateField(field)}
                            onDelete={() => deleteField(field.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                  
                  {formSteps[currentEditStep]?.fields.length === 0 && (
                    <div className="text-center py-8 text-gray-500 border rounded-lg">
                      <p>لا توجد حقول في هذه الخطوة</p>
                      <p className="text-sm">أضف حقولًا من القائمة أعلاه</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="settings" className="mt-6">
                <div className="space-y-4 text-right">
                  <div className="form-control">
                    <label className="form-label">عنوان النموذج</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="form-label">وصف النموذج</label>
                    <textarea 
                      className="form-input h-24" 
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="design" className="mt-6">
                <div className="space-y-4 text-right">
                  <div className="form-control">
                    <label className="form-label">اللون الرئيسي</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={formStyle.primaryColor}
                        onChange={(e) => handleStyleChange('primaryColor', e.target.value)}
                        className="h-8 w-8 rounded"
                      />
                      <input
                        type="text"
                        value={formStyle.primaryColor}
                        onChange={(e) => handleStyleChange('primaryColor', e.target.value)}
                        className="flex-1 form-input"
                      />
                    </div>
                  </div>
                  
                  <div className="form-control">
                    <label className="form-label">استدارة الحواف</label>
                    <select
                      className="form-select"
                      value={formStyle.borderRadius}
                      onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
                    >
                      <option value="0">بدون استدارة</option>
                      <option value="0.25rem">استدارة خفيفة</option>
                      <option value="0.5rem">استدارة متوسطة</option>
                      <option value="1rem">استدارة كبيرة</option>
                      <option value="9999px">دائري</option>
                    </select>
                  </div>
                  
                  <div className="form-control">
                    <label className="form-label">حجم الخط</label>
                    <select
                      className="form-select"
                      value={formStyle.fontSize}
                      onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                    >
                      <option value="0.875rem">صغير</option>
                      <option value="1rem">متوسط</option>
                      <option value="1.125rem">كبير</option>
                      <option value="1.25rem">كبير جداً</option>
                    </select>
                  </div>
                  
                  <div className="form-control">
                    <label className="form-label">نمط الأزرار</label>
                    <select
                      className="form-select"
                      value={formStyle.buttonStyle}
                      onChange={(e) => handleStyleChange('buttonStyle', e.target.value)}
                    >
                      <option value="rounded">مستدير</option>
                      <option value="square">مربع</option>
                      <option value="pill">كبسولي</option>
                    </select>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-5 gap-2">
                    {['#9b87f5', '#2563eb', '#10b981', '#f59e0b', '#ef4444'].map(color => (
                      <div
                        key={color}
                        className={cn(
                          "h-8 rounded cursor-pointer transition-all",
                          formStyle.primaryColor === color ? "ring-2 ring-offset-2" : ""
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => handleStyleChange('primaryColor', color)}
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <div className="lg:col-span-5">
        <div className="sticky top-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-500">معاينة مباشرة</div>
            <h3 className="text-lg font-medium text-right">معاينة النموذج</h3>
          </div>
          
          <FormPreview 
            key={previewRefresh}
            formTitle={formTitle}
            formDescription={formDescription}
            currentStep={currentPreviewStep}
            totalSteps={formSteps.length}
            formStyle={formStyle}
            fields={formSteps[currentPreviewStep - 1]?.fields || []}
          >
            <div></div>
          </FormPreview>
          
          <div className="mt-4 flex justify-end">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setCurrentPreviewStep(prev => Math.max(prev - 1, 1))}
                disabled={currentPreviewStep === 1}
              >
                السابق
              </Button>
              
              {currentPreviewStep < formSteps.length ? (
                <Button 
                  variant="default"
                  style={{ backgroundColor: formStyle.primaryColor }}
                  onClick={() => setCurrentPreviewStep(prev => Math.min(prev + 1, formSteps.length))}
                >
                  التالي
                </Button>
              ) : (
                <Button 
                  variant="default"
                  style={{ backgroundColor: formStyle.primaryColor }}
                >
                  إرسال الطلب
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {isFieldEditorOpen && currentEditingField && (
        <FieldEditor
          field={currentEditingField}
          onSave={saveField}
          onClose={() => setIsFieldEditorOpen(false)}
        />
      )}
      
      <Dialog open={isStyleDialogOpen} onOpenChange={setIsStyleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle className="text-right">تخصيص مظهر النموذج</DialogTitle>
          
          <div className="space-y-4 py-4 text-right">
            <div className="form-control">
              <label className="form-label">اللون الرئيسي</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={formStyle.primaryColor}
                  onChange={(e) => handleStyleChange('primaryColor', e.target.value)}
                  className="h-8 w-8 rounded"
                />
                <input
                  type="text"
                  value={formStyle.primaryColor}
                  onChange={(e) => handleStyleChange('primaryColor', e.target.value)}
                  className="flex-1 form-input"
                />
              </div>
            </div>
            
            <div className="form-control">
              <label className="form-label">استدارة الحواف</label>
              <select
                className="form-select"
                value={formStyle.borderRadius}
                onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
              >
                <option value="0">بدون استدارة</option>
                <option value="0.25rem">استدارة خفيفة</option>
                <option value="0.5rem">استدارة متوسطة</option>
                <option value="1rem">استدارة كبيرة</option>
                <option value="9999px">دائري</option>
              </select>
            </div>
            
            <div className="form-control">
              <label className="form-label">حجم الخط</label>
              <select
                className="form-select"
                value={formStyle.fontSize}
                onChange={(e) => handleStyleChange('fontSize', e.target.value)}
              >
                <option value="0.875rem">صغير</option>
                <option value="1rem">متوسط</option>
                <option value="1.125rem">كبير</option>
                <option value="1.25rem">كبير جداً</option>
              </select>
            </div>
            
            <div className="form-control">
              <label className="form-label">نمط الأزرار</label>
              <select
                className="form-select"
                value={formStyle.buttonStyle}
                onChange={(e) => handleStyleChange('buttonStyle', e.target.value)}
              >
                <option value="rounded">مستدير</option>
                <option value="square">مربع</option>
                <option value="pill">كبسولي</option>
              </select>
            </div>
            
            <div className="mt-4 grid grid-cols-5 gap-2">
              {['#9b87f5', '#2563eb', '#10b981', '#f59e0b', '#ef4444'].map(color => (
                <div
                  key={color}
                  className={cn(
                    "h-8 rounded cursor-pointer transition-all",
                    formStyle.primaryColor === color ? "ring-2 ring-offset-2" : ""
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => handleStyleChange('primaryColor', color)}
                />
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsStyleDialogOpen(false)}>
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormBuilder;
