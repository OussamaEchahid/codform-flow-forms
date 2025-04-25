
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
import { Copy, FileText, LayoutGrid, Plus, Settings, Trash, Save, FileCheck } from 'lucide-react';
import FormPreview from './FormPreview';
import FormTemplatesDialog from './FormTemplatesDialog';
import FieldEditor from './FieldEditor';
import { cn } from '@/lib/utils';
import { FormField, FormStep, createEmptyField, formTemplates } from '@/lib/form-utils';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { useFormTemplates, FormData } from '@/lib/hooks/useFormTemplates';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const availableFieldTypes: Array<{
  type: FormField['type'];
  label: string;
  icon: React.ReactNode;
}> = [
  { type: 'text', label: 'حقل نص', icon: <FileText size={16} /> },
  { type: 'email', label: 'بريد إلكتروني', icon: <FileText size={16} /> },
  { type: 'phone', label: 'رقم هاتف', icon: <FileText size={16} /> },
  { type: 'textarea', label: 'نص متعدد الأسطر', icon: <FileText size={16} /> },
  { type: 'select', label: 'قائمة منسدلة', icon: <LayoutGrid size={16} /> },
  { type: 'checkbox', label: 'خانة اختيار', icon: <LayoutGrid size={16} /> },
  { type: 'radio', label: 'زر راديو', icon: <LayoutGrid size={16} /> },
];

interface FormBuilderProps {
  initialFormData: FormData;
}

const FormBuilder: React.FC<FormBuilderProps> = ({ initialFormData }) => {
  const navigate = useNavigate();
  const { saveForm, publishForm } = useFormTemplates();
  const [formTitle, setFormTitle] = useState(initialFormData.title);
  const [formDescription, setFormDescription] = useState(initialFormData.description || '');
  const [formSteps, setFormSteps] = useState<FormStep[]>(initialFormData.data);
  const [currentPreviewStep, setCurrentPreviewStep] = useState(1);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isFieldEditorOpen, setIsFieldEditorOpen] = useState(false);
  const [currentEditingField, setCurrentEditingField] = useState<FormField | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [currentEditStep, setCurrentEditStep] = useState(0);
  
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
  };
  
  const applyTemplate = (templateId: number) => {
    const template = formTemplates.find(t => t.id === templateId);
    if (template) {
      setFormSteps(template.data);
      setFormTitle(template.title);
      setFormDescription(template.description);
      setIsTemplateDialogOpen(false);
    }
  };

  const addFieldToStep = (type: FormField['type']) => {
    const newField = createEmptyField(type);
    const updatedSteps = [...formSteps];
    updatedSteps[currentEditStep].fields.push(newField);
    setFormSteps(updatedSteps);
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
  };

  const deleteField = (fieldId: string) => {
    const updatedSteps = [...formSteps];
    const stepIndex = currentEditStep;
    updatedSteps[stepIndex].fields = updatedSteps[stepIndex].fields.filter(f => f.id !== fieldId);
    setFormSteps(updatedSteps);
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
  };
  
  const renderPreviewFields = (fields: FormField[]) => {
    return (
      <div className="space-y-4">
        {fields.map(field => (
          <div key={field.id} className="form-control text-right">
            <label className="form-label">
              {field.label}
              {field.required && <span className="text-red-500 mr-1">*</span>}
            </label>
            
            {field.type === 'text' || field.type === 'email' || field.type === 'phone' ? (
              <input
                type={field.type === 'email' ? 'email' : 'text'}
                placeholder={field.placeholder}
                className="form-input"
                disabled
              />
            ) : field.type === 'textarea' ? (
              <textarea
                placeholder={field.placeholder}
                className="form-input h-24"
                disabled
              />
            ) : field.type === 'select' ? (
              <select className="form-select" disabled>
                <option value="">-- اختر --</option>
                {field.options?.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : field.type === 'checkbox' ? (
              <div className="space-y-2">
                {field.options?.map(option => (
                  <div key={option} className="flex items-center space-x-2 rtl:space-x-reverse">
                    <input
                      type="checkbox"
                      id={`check-${option}`}
                      className="form-checkbox"
                      disabled
                    />
                    <label htmlFor={`check-${option}`}>{option}</label>
                  </div>
                ))}
              </div>
            ) : field.type === 'radio' ? (
              <div className="space-y-2">
                {field.options?.map(option => (
                  <div key={option} className="flex items-center space-x-2 rtl:space-x-reverse">
                    <input
                      type="radio"
                      id={`radio-${option}`}
                      name={`radio-${field.id}`}
                      className="form-radio"
                      disabled
                    />
                    <label htmlFor={`radio-${option}`}>{option}</label>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    );
  };
  
  const renderPreviewNavigation = () => {
    return (
      <div className="mt-6 flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentPreviewStep(prev => Math.max(prev - 1, 1))}
          disabled={currentPreviewStep === 1}
        >
          السابق
        </Button>
        
        {currentPreviewStep < formSteps.length ? (
          <Button
            onClick={() => setCurrentPreviewStep(prev => Math.min(prev + 1, formSteps.length))}
          >
            التالي
          </Button>
        ) : (
          <Button>
            إرسال الطلب
          </Button>
        )}
      </div>
    );
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
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
      return arrayMove(steps, oldIndex, newIndex);
    });
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
  };

  const renderPreviewFields = (fields: FormField[]) => {
    return (
      <div className="space-y-4">
        {fields.map(field => (
          <div key={field.id} className="form-control text-right">
            <label className="form-label">
              {field.label}
              {field.required && <span className="text-red-500 mr-1">*</span>}
            </label>
            
            {field.type === 'text' || field.type === 'email' || field.type === 'phone' ? (
              <input
                type={field.type === 'email' ? 'email' : 'text'}
                placeholder={field.placeholder}
                className="form-input"
                disabled
              />
            ) : field.type === 'textarea' ? (
              <textarea
                placeholder={field.placeholder}
                className="form-input h-24"
                disabled
              />
            ) : field.type === 'select' ? (
              <select className="form-select" disabled>
                <option value="">-- اختر --</option>
                {field.options?.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : field.type === 'checkbox' ? (
              <div className="space-y-2">
                {field.options?.map(option => (
                  <div key={option} className="flex items-center space-x-2 rtl:space-x-reverse">
                    <input
                      type="checkbox"
                      id={`check-${option}`}
                      className="form-checkbox"
                      disabled
                    />
                    <label htmlFor={`check-${option}`}>{option}</label>
                  </div>
                ))}
              </div>
            ) : field.type === 'radio' ? (
              <div className="space-y-2">
                {field.options?.map(option => (
                  <div key={option} className="flex items-center space-x-2 rtl:space-x-reverse">
                    <input
                      type="radio"
                      id={`radio-${option}`}
                      name={`radio-${field.id}`}
                      className="form-radio"
                      disabled
                    />
                    <label htmlFor={`radio-${option}`}>{option}</label>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    );
  };
  
  const renderPreviewNavigation = () => {
    return (
      <div className="mt-6 flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentPreviewStep(prev => Math.max(prev - 1, 1))}
          disabled={currentPreviewStep === 1}
        >
          السابق
        </Button>
        
        {currentPreviewStep < formSteps.length ? (
          <Button
            onClick={() => setCurrentPreviewStep(prev => Math.min(prev + 1, formSteps.length))}
          >
            التالي
          </Button>
        ) : (
          <Button>
            إرسال الطلب
          </Button>
        )}
      </div>
    );
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

            <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <FileText size={16} />
                  قوالب النماذج
                </Button>
              </DialogTrigger>
              <FormTemplatesDialog onSelect={applyTemplate} onClose={() => setIsTemplateDialogOpen(false)} />
            </Dialog>
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
                <div className="text-center text-gray-500 py-8">
                  <p>خيارات التصميم ستكون متاحة قريبًا</p>
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
            formTitle={formTitle}
            formDescription={formDescription}
            currentStep={currentPreviewStep}
            totalSteps={formSteps.length}
          >
            {currentPreviewStep <= formSteps.length && (
              <>
                {renderPreviewFields(formSteps[currentPreviewStep - 1].fields)}
                {renderPreviewNavigation()}
              </>
            )}
          </FormPreview>
        </div>
      </div>
      
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

export default FormBuilder;
