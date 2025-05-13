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
import { FormField, FormStep, createEmptyField, createDefaultForm, formTemplates } from '@/lib/form-utils';
import { Dialog, DialogTrigger, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

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

// Define proper interface for form builder props
export interface FormBuilderProps {
  data: FormStep[];  
  onChange: (newData: FormStep[]) => void;
}

const FormBuilder: React.FC<FormBuilderProps> = ({ data, onChange }) => {
  const navigate = useNavigate();
  const { saveForm, publishForm } = useFormTemplates();
  
  // Initialize formSteps with the data passed from props
  const [formSteps, setFormSteps] = useState<FormStep[]>(data || []);
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
  
  // Update parent component when formSteps change
  useEffect(() => {
    if (formSteps !== data) {
      onChange(formSteps);
    }
  }, [formSteps, data, onChange]);

  // Initialize with default steps if data is empty
  useEffect(() => {
    // If the data is empty, we create a default form
    if (data && data.length === 0) {
      const defaultSteps = createDefaultForm();
      setFormSteps(defaultSteps);
      setPreviewRefresh(prev => prev + 1);
    } else if (data && data.length > 0) {
      // Otherwise use the data from props
      setFormSteps(data);
    }
  }, [data]);
  
  const addNewStep = () => {
    const newStep = {
      id: (formSteps.length + 1).toString(),
      title: `خطوة جديدة ${formSteps.length + 1}`,
      fields: []
    };
    const updatedSteps = [...formSteps, newStep];
    setFormSteps(updatedSteps);
    setCurrentEditStep(formSteps.length);
    setPreviewRefresh(prev => prev + 1);
  };
  
  const applyTemplate = (templateId: number) => {
    const template = formTemplates.find(t => t.id === templateId);
    if (template) {
      setFormSteps(template.data);
      setIsTemplateDialogOpen(false);
      setPreviewRefresh(prev => prev + 1);
      toast.success(`تم تطبيق قالب ${template.title} بنجاح`);
    }
  };

  const addFieldToStep = (type: FormField['type']) => {
    if (formSteps.length === 0) {
      // Create a first step if none exists
      const newStep = {
        id: "1",
        title: "خطوة جديدة 1",
        fields: [createEmptyField(type)]
      };
      setFormSteps([newStep]);
    } else {
      const newField = createEmptyField(type);
      const updatedSteps = [...formSteps];
      if (!updatedSteps[currentEditStep]) {
        console.warn("Current edit step is invalid, defaulting to first step");
        setCurrentEditStep(0);
        updatedSteps[0].fields.push(newField);
      } else {
        updatedSteps[currentEditStep].fields.push(newField);
      }
      setFormSteps(updatedSteps);
    }
    setPreviewRefresh(prev => prev + 1);
  };

  const editField = (field: FormField) => {
    setCurrentEditingField(field);
    setIsFieldEditorOpen(true);
  };

  const saveField = (updatedField: FormField) => {
    const updatedSteps = [...formSteps];
    const stepIndex = currentEditStep;
    
    if (stepIndex < 0 || stepIndex >= updatedSteps.length) {
      console.error("Invalid step index when saving field");
      return;
    }
    
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
    if (currentEditStep >= formSteps.length) {
      console.error("Invalid current edit step when deleting field");
      return;
    }
    
    const updatedSteps = [...formSteps];
    updatedSteps[currentEditStep].fields = updatedSteps[currentEditStep].fields.filter(f => f.id !== fieldId);
    setFormSteps(updatedSteps);
    setPreviewRefresh(prev => prev + 1);
  };

  const duplicateField = (field: FormField) => {
    if (currentEditStep >= formSteps.length) {
      console.error("Invalid current edit step when duplicating field");
      return;
    }
    
    const newField = {
      ...field,
      id: `${field.id}-copy`,
      label: `${field.label} (نسخة)`
    };
    
    const updatedSteps = [...formSteps];
    const fieldIndex = updatedSteps[currentEditStep].fields.findIndex(f => f.id === field.id);
    
    if (fieldIndex === -1) {
      console.error("Field not found when duplicating");
      return;
    }
    
    updatedSteps[currentEditStep].fields.splice(fieldIndex + 1, 0, newField);
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
    
    if (currentEditStep >= updatedSteps.length) {
      console.error("Invalid current edit step when handling drag end for fields");
      return;
    }
    
    const currentStep = updatedSteps[currentEditStep];
    const oldIndex = currentStep.fields.findIndex((field) => field.id === active.id);
    const newIndex = currentStep.fields.findIndex((field) => field.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) {
      console.error("Field not found during drag operation");
      return;
    }
    
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

  // Safely create a new empty field
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
          textAlign: 'center',
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

  // Safe getter for current step
  const getCurrentStep = () => {
    if (formSteps.length === 0) {
      return null;
    }
    
    if (currentEditStep >= formSteps.length) {
      console.warn("Current edit step is out of bounds, defaulting to first step");
      setCurrentEditStep(0);
      return formSteps[0];
    }
    
    return formSteps[currentEditStep];
  };

  const currentStep = getCurrentStep();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
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
                variant="secondary"
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
                <span>نشر النموذج</span>
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
                <DialogContent>
                  <FormTemplatesDialog 
                    open={isTemplateDialogOpen}
                    onSelect={applyTemplate} 
                    onClose={() => setIsTemplateDialogOpen(false)} 
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="steps">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="steps">الخطوات</TabsTrigger>
                <TabsTrigger value="fields">الحقول</TabsTrigger>
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
                    حقول الخطوة: {currentStep?.title || 'لا توجد خطوات'}
                  </h3>
                  
                  {currentStep && (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEndFields}
                    >
                      <SortableContext
                        items={currentStep.fields.map(field => field.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {currentStep.fields.map((field) => (
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
                  )}
                  
                  {(!currentStep || currentStep.fields.length === 0) && (
                    <div className="text-center py-8 text-gray-500 border rounded-lg">
                      <p>لا توجد حقول في هذه الخطوة</p>
                      <p className="text-sm">أضف حقولًا من القائمة أعلاه</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="fields" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-right">
                    حقول النموذج
                  </h3>
                  
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
              </TabsContent>
              
              <TabsContent value="design" className="mt-6">
                <div className="space-y-4 text-right">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اللون الرئيسي</label>
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
                        className="flex-1 border rounded px-3 py-2"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">استدارة الحواف</label>
                    <select
                      className="w-full border rounded px-3 py-2"
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
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">حجم الخط</label>
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={formStyle.fontSize}
                      onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                    >
                      <option value="0.875rem">صغير</option>
                      <option value="1rem">متوسط</option>
                      <option value="1.125rem">كبير</option>
                      <option value="1.25rem">كبير جداً</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">نمط الأزرار</label>
                    <select
                      className="w-full border rounded px-3 py-2"
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
            formTitle="نموذج جديد"
            formDescription="وصف النموذج"
            currentStep={currentPreviewStep}
            totalSteps={formSteps.length || 1}
            style={formStyle}
            fields={formSteps.length > 0 && currentPreviewStep <= formSteps.length
              ? formSteps[currentPreviewStep - 1]?.fields || [] 
              : []}
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
        <Dialog open={isFieldEditorOpen} onOpenChange={setIsFieldEditorOpen}>
          <DialogContent className="max-w-lg">
            <DialogTitle>تحرير الحقل</DialogTitle>
            <FieldEditor
              field={currentEditingField}
              onSave={saveField}
              onClose={() => setIsFieldEditorOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
      
      <Dialog open={isStyleDialogOpen} onOpenChange={setIsStyleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle className="text-right">تخصيص مظهر النموذج</DialogTitle>
          
          <div className="space-y-4 py-4 text-right">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اللون الرئيسي</label>
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
                  className="flex-1 border rounded px-3 py-2"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">استدارة الحواف</label>
              <select
                className="w-full border rounded px-3 py-2"
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">حجم الخط</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={formStyle.fontSize}
                onChange={(e) => handleStyleChange('fontSize', e.target.value)}
              >
                <option value="0.875rem">صغير</option>
                <option value="1rem">متوسط</option>
                <option value="1.125rem">كبير</option>
                <option value="1.25rem">كبير جداً</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نمط الأزرار</label>
              <select
                className="w-full border rounded px-3 py-2"
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
