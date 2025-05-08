
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormTemplates } from '@/lib/hooks/useFormTemplates';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { v4 as uuidv4 } from 'uuid';
import FormElementList from './FormElementList';
import FormElementEditor from './FormElementEditor';
import FormPreviewPanel from './FormPreviewPanel';
import FormHeader from './FormHeader';
import FormStyleEditor from './FormStyleEditor';
import { FormField, FormStep, createEmptyField } from '@/lib/form-utils';
import { useFormStore } from '@/hooks/useFormStore';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FormBuilderEditorProps {
  formId?: string;
}

const FormBuilderEditor: React.FC<FormBuilderEditorProps> = ({ formId }) => {
  const navigate = useNavigate();
  const params = useParams();
  const currentFormId = formId || params.formId;
  const { loadForm, saveForm } = useFormTemplates();
  const { formState, setFormState, updateFormData, updateFormStyle, markAsDirty } = useFormStore();
  
  const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // State for DnD operations
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

  // Load form data on component mount or form ID change
  useEffect(() => {
    if (currentFormId) {
      const loadFormData = async () => {
        console.log('Attempting to load form with ID:', currentFormId);
        const form = await loadForm(currentFormId);
        
        if (!form) {
          toast.error('لم يتم العثور على النموذج');
          navigate('/form-builder');
        }
      };
      
      loadFormData();
    } else {
      // No form ID provided, redirect to dashboard
      navigate('/form-builder');
    }
  }, [currentFormId, loadForm, navigate]);

  // Extract the current step's fields for the editor and preview
  const currentStepFields = activeTabIndex >= 0 && 
    formState.data && 
    Array.isArray(formState.data) && 
    formState.data[activeTabIndex]?.fields
      ? formState.data[activeTabIndex].fields
      : [];

  // Add new element to the current step
  const addElement = (type: string) => {
    try {
      if (!formState.data || !Array.isArray(formState.data) || !formState.data[activeTabIndex]) {
        console.error('No active step to add element to');
        toast.error('لا يوجد خطوة نشطة لإضافة العنصر إليها');
        return;
      }

      // Create a new element with a unique ID
      const newElement = createEmptyField(type);
      
      // Prepare the updated data array
      const updatedData = [...formState.data];
      
      // Add the new element to the current step
      updatedData[activeTabIndex] = {
        ...updatedData[activeTabIndex],
        fields: [...updatedData[activeTabIndex].fields, newElement]
      };
      
      // Update the form state first (local state)
      updateFormData(updatedData);
      
      // Mark form as dirty
      markAsDirty();
      
      // Try to auto-save but don't block UI if it fails
      autosaveForm(updatedData).catch(error => {
        console.warn('Autosave failed, but continuing with UI updates', error);
      });
      
      // Select the newly added element
      setSelectedElementIndex(updatedData[activeTabIndex].fields.length - 1);
      
      // Show success toast
      toast.success('تم إضافة العنصر بنجاح');
    } catch (error) {
      console.error('Error adding element:', error);
      toast.error('حدث خطأ أثناء إضافة العنصر');
    }
  };

  // Update an element in the current step
  const updateElement = (index: number, updatedElement: FormField) => {
    if (!formState.data || !Array.isArray(formState.data)) return;
    
    const updatedData = [...formState.data];
    
    // Make sure the active tab index is valid
    if (activeTabIndex >= 0 && activeTabIndex < updatedData.length) {
      // Make sure the field index is valid
      if (index >= 0 && index < updatedData[activeTabIndex].fields.length) {
        updatedData[activeTabIndex].fields[index] = updatedElement;
        updateFormData(updatedData);
        markAsDirty();
        
        // Auto-save
        autosaveForm(updatedData);
      }
    }
  };

  // Delete an element from the current step
  const deleteElement = (index: number) => {
    if (!formState.data || !Array.isArray(formState.data)) return;
    
    const updatedData = [...formState.data];
    
    // Make sure the active tab index is valid
    if (activeTabIndex >= 0 && activeTabIndex < updatedData.length) {
      // Remove the element at the specified index
      updatedData[activeTabIndex].fields = updatedData[activeTabIndex].fields.filter((_, i) => i !== index);
      updateFormData(updatedData);
      setSelectedElementIndex(null);
      markAsDirty();
      
      // Auto-save
      autosaveForm(updatedData);
    }
  };

  // Duplicate an element in the current step
  const duplicateElement = (index: number) => {
    if (!formState.data || !Array.isArray(formState.data)) return;
    
    const updatedData = [...formState.data];
    
    // Make sure the active tab index is valid
    if (activeTabIndex >= 0 && activeTabIndex < updatedData.length) {
      // Make a copy of the element
      const elementToDuplicate = updatedData[activeTabIndex].fields[index];
      const duplicatedElement = {
        ...elementToDuplicate,
        id: uuidv4(),
        label: `${elementToDuplicate.label || 'العنصر'} (نسخة)`
      };
      
      // Insert the duplicated element after the original
      updatedData[activeTabIndex].fields.splice(index + 1, 0, duplicatedElement);
      updateFormData(updatedData);
      markAsDirty();
      
      // Select the duplicated element
      setSelectedElementIndex(index + 1);
      
      // Auto-save
      autosaveForm(updatedData);
    }
  };
  
  // Auto-save form changes
  const autosaveForm = async (updatedData?: FormStep[]) => {
    if (!currentFormId) return false;
    
    try {
      const dataToSave = updatedData || formState.data;
      
      return await saveForm(currentFormId, {
        data: dataToSave
      });
    } catch (error) {
      console.error('Error autosaving form:', error);
      return false;
    }
  };

  // Save form changes
  const handleSaveForm = async () => {
    if (!currentFormId) return;
    
    setIsSaving(true);
    const success = await saveForm(currentFormId, {
      title: formState.title,
      description: formState.description,
      data: formState.data,
      submitButtonText: formState.submitButtonText
    });
    setIsSaving(false);
    
    if (success) {
      toast.success('تم حفظ النموذج بنجاح');
    }
  };

  // Handle drag end for reordering elements
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    // Get the indices of the dragged and target elements
    const oldIndex = parseInt(active.id.toString().split('-')[1]);
    const newIndex = parseInt(over.id.toString().split('-')[1]);
    
    // Update the form data with the new order
    if (!formState.data || !Array.isArray(formState.data)) return;
    
    const updatedData = [...formState.data];
    
    // Make sure the active tab index is valid
    if (activeTabIndex >= 0 && activeTabIndex < updatedData.length) {
      updatedData[activeTabIndex].fields = arrayMove(
        updatedData[activeTabIndex].fields,
        oldIndex,
        newIndex
      );
      
      updateFormData(updatedData);
      setSelectedElementIndex(newIndex);
      markAsDirty();
      
      // Auto-save
      autosaveForm(updatedData);
    }
  };

  // Add new step to the form
  const addStep = () => {
    if (!formState.data || !Array.isArray(formState.data)) {
      const newStep: FormStep = {
        id: uuidv4(),
        title: 'خطوة جديدة',
        fields: []
      };
      
      updateFormData([newStep]);
      setActiveTabIndex(0);
      return;
    }
    
    const newStep: FormStep = {
      id: uuidv4(),
      title: `خطوة ${formState.data.length + 1}`,
      fields: []
    };
    
    const updatedData = [...formState.data, newStep];
    updateFormData(updatedData);
    
    // Switch to the new step
    setActiveTabIndex(updatedData.length - 1);
    setSelectedElementIndex(null);
    markAsDirty();
    
    // Auto-save
    autosaveForm(updatedData);
  };

  // Delete a step from the form
  const deleteStep = (index: number) => {
    if (!formState.data || !Array.isArray(formState.data) || formState.data.length <= 1) {
      toast.error('لا يمكن حذف الخطوة الوحيدة في النموذج');
      return;
    }
    
    const updatedData = formState.data.filter((_, i) => i !== index);
    updateFormData(updatedData);
    
    if (activeTabIndex >= updatedData.length) {
      setActiveTabIndex(updatedData.length - 1);
    }
    
    setSelectedElementIndex(null);
    markAsDirty();
    
    // Auto-save
    autosaveForm(updatedData);
  };

  // Update step title
  const updateStepTitle = (index: number, title: string) => {
    if (!formState.data || !Array.isArray(formState.data)) return;
    
    const updatedData = [...formState.data];
    
    if (index >= 0 && index < updatedData.length) {
      updatedData[index] = {
        ...updatedData[index],
        title
      };
      
      updateFormData(updatedData);
      markAsDirty();
      
      // Auto-save
      autosaveForm(updatedData);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <FormHeader 
        formTitle={formState.title}
        isPublished={formState.isPublished || false}
        onTitleChange={(title) => setFormState({ ...formState, title, isDirty: true })}
        onSave={handleSaveForm}
        onPublish={async () => {
          // This would be handled by parent component
        }}
        isSaving={isSaving}
        isPublishing={isPublishing}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="elements" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="elements">عناصر النموذج</TabsTrigger>
                  <TabsTrigger value="style">تصميم النموذج</TabsTrigger>
                  <TabsTrigger value="settings">إعدادات النموذج</TabsTrigger>
                </TabsList>
                
                <TabsContent value="elements" className="py-4 space-y-6">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {formState.data && Array.isArray(formState.data) && formState.data.map((step, index) => (
                      <button
                        key={step.id}
                        className={`px-4 py-2 rounded-md ${
                          activeTabIndex === index ? 'bg-primary text-white' : 'bg-gray-100'
                        }`}
                        onClick={() => {
                          setActiveTabIndex(index);
                          setSelectedElementIndex(null);
                        }}
                      >
                        {step.title || `خطوة ${index + 1}`}
                      </button>
                    ))}
                    
                    <button
                      className="px-4 py-2 rounded-md bg-gray-100 text-gray-600"
                      onClick={addStep}
                    >
                      + إضافة خطوة
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h3 className="font-medium mb-3">إضافة عناصر</h3>
                      <FormElementList onAddElement={addElement} />
                    </div>
                    
                    <div className="md:col-span-2">
                      <h3 className="font-medium mb-3">
                        عناصر الخطوة {formState.data && Array.isArray(formState.data) && activeTabIndex >= 0 
                          ? formState.data[activeTabIndex]?.title || `خطوة ${activeTabIndex + 1}`
                          : ''}
                      </h3>
                      
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={currentStepFields.map((_, index) => `field-${index}`)}
                          strategy={verticalListSortingStrategy}
                        >
                          <FormElementEditor
                            elements={currentStepFields}
                            selectedIndex={selectedElementIndex}
                            onSelectElement={(index) => setSelectedElementIndex(index)}
                            onEditElement={(index) => {
                              setSelectedElementIndex(index);
                              // Additional logic for editing if needed
                            }}
                            onDeleteElement={deleteElement}
                            onDuplicateElement={duplicateElement}
                          />
                        </SortableContext>
                      </DndContext>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="style" className="py-4">
                  <FormStyleEditor 
                    formStyle={formState.formStyle || {
                      primaryColor: formState.primaryColor || '#9b87f5',
                      borderRadius: formState.borderRadius || '0.5rem',
                      fontSize: formState.fontSize || '1rem',
                      buttonStyle: formState.buttonStyle || 'rounded'
                    }}
                    onStyleChange={(style) => {
                      updateFormStyle(style);
                      markAsDirty();
                      
                      // Auto-save style changes
                      if (currentFormId) {
                        saveForm(currentFormId, { 
                          formStyle: style
                        }).catch(console.error);
                      }
                    }}
                  />
                </TabsContent>
                
                <TabsContent value="settings" className="py-4">
                  <div className="space-y-4">
                    <div className="form-group">
                      <label className="block text-sm font-medium mb-1">عنوان النموذج</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-md"
                        value={formState.title || ''}
                        onChange={(e) => setFormState({ ...formState, title: e.target.value, isDirty: true })}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="block text-sm font-medium mb-1">وصف النموذج</label>
                      <textarea
                        className="w-full px-3 py-2 border rounded-md"
                        value={formState.description || ''}
                        onChange={(e) => setFormState({ ...formState, description: e.target.value, isDirty: true })}
                        rows={3}
                      ></textarea>
                    </div>
                    
                    <div className="form-group">
                      <label className="block text-sm font-medium mb-1">نص زر الإرسال</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-md"
                        value={formState.submitButtonText || 'إرسال الطلب'}
                        onChange={(e) => setFormState({ ...formState, submitButtonText: e.target.value, isDirty: true })}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-4">
          <FormPreviewPanel
            formTitle={formState.title}
            formDescription={formState.description}
            buttonText={formState.submitButtonText}
            fields={currentStepFields}
            formStyle={formState.formStyle || {
              primaryColor: formState.primaryColor || '#9b87f5',
              borderRadius: formState.borderRadius || '0.5rem',
              fontSize: formState.fontSize || '1rem',
              buttonStyle: formState.buttonStyle || 'rounded'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default FormBuilderEditor;
