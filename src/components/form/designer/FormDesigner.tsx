
import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FormField, FormStep } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Save, Palette } from 'lucide-react';
import { toast } from 'sonner';
import ElementPanel from './ElementPanel';
import FormCanvas from './FormCanvas';
import StyleEditor from './StyleEditor';
import FormPreviewPanel from '../builder/FormPreviewPanel';

export interface FormDesignData {
  id: string;
  title: string;
  description?: string;
  steps: FormStep[];
  style: {
    primaryColor: string;
    borderRadius: string;
    fontSize: string;
    buttonStyle: string;
  };
  submitButtonText: string;
  isPublished: boolean;
}

interface FormDesignerProps {
  formData: FormDesignData;
  onSave: (data: FormDesignData) => Promise<boolean>;
  onPublish: (id: string, publish: boolean) => Promise<boolean>;
}

const FormDesigner: React.FC<FormDesignerProps> = ({ formData, onSave, onPublish }) => {
  const { language } = useI18n();
  const [activeTab, setActiveTab] = useState<string>('elements');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [previewStep, setPreviewStep] = useState<number>(1);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(null);
  const [localFormData, setLocalFormData] = useState<FormDesignData>({...formData});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isStyleEditorOpen, setIsStyleEditorOpen] = useState<boolean>(false);
  const [previewRefreshKey, setPreviewRefreshKey] = useState<number>(0);
  
  // Sync with external formData when it changes
  useEffect(() => {
    setLocalFormData({...formData});
  }, [formData.id]);
  
  // Helper to get current step fields
  const getCurrentStepFields = () => {
    return localFormData.steps[currentStep]?.fields || [];
  };
  
  // Save form data
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await onSave(localFormData);
      if (success) {
        toast.success(language === 'ar' ? 'تم حفظ النموذج بنجاح' : 'Form saved successfully');
      } else {
        toast.error(language === 'ar' ? 'فشل حفظ النموذج' : 'Failed to save the form');
      }
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error(language === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error during save');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Toggle publish state
  const handlePublishToggle = async () => {
    try {
      const success = await onPublish(localFormData.id, !localFormData.isPublished);
      if (success) {
        setLocalFormData(prev => ({...prev, isPublished: !prev.isPublished}));
        toast.success(
          localFormData.isPublished 
            ? (language === 'ar' ? 'تم إلغاء نشر النموذج' : 'Form unpublished') 
            : (language === 'ar' ? 'تم نشر النموذج' : 'Form published')
        );
      }
    } catch (error) {
      console.error('Error toggling publish state:', error);
      toast.error(language === 'ar' ? 'فشل تغيير حالة النشر' : 'Failed to change publish state');
    }
  };
  
  // Add a new step
  const handleAddStep = () => {
    const newStep: FormStep = {
      id: `step-${localFormData.steps.length + 1}`,
      title: language === 'ar' ? `خطوة ${localFormData.steps.length + 1}` : `Step ${localFormData.steps.length + 1}`,
      fields: []
    };
    
    setLocalFormData(prev => ({
      ...prev, 
      steps: [...prev.steps, newStep]
    }));
    setCurrentStep(localFormData.steps.length);
    refreshPreview();
  };
  
  // Add a field to the current step
  const handleAddField = (fieldType: string) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: fieldType as any,
      label: language === 'ar' ? 'حقل جديد' : 'New Field',
      required: false,
    };
    
    const updatedSteps = [...localFormData.steps];
    updatedSteps[currentStep].fields = [...updatedSteps[currentStep].fields, newField];
    
    setLocalFormData(prev => ({
      ...prev,
      steps: updatedSteps
    }));
    
    setSelectedFieldIndex(updatedSteps[currentStep].fields.length - 1);
    refreshPreview();
  };
  
  // Update a field
  const handleUpdateField = (fieldIndex: number, updatedField: FormField) => {
    const updatedSteps = [...localFormData.steps];
    updatedSteps[currentStep].fields[fieldIndex] = updatedField;
    
    setLocalFormData(prev => ({
      ...prev,
      steps: updatedSteps
    }));
    refreshPreview();
  };
  
  // Delete a field
  const handleDeleteField = (fieldIndex: number) => {
    const updatedSteps = [...localFormData.steps];
    updatedSteps[currentStep].fields = updatedSteps[currentStep].fields.filter((_, i) => i !== fieldIndex);
    
    setLocalFormData(prev => ({
      ...prev,
      steps: updatedSteps
    }));
    setSelectedFieldIndex(null);
    refreshPreview();
  };
  
  // Handle drag end for reordering fields
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = getCurrentStepFields().findIndex(field => field.id === active.id);
      const newIndex = getCurrentStepFields().findIndex(field => field.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const updatedSteps = [...localFormData.steps];
        updatedSteps[currentStep].fields = arrayMove(
          updatedSteps[currentStep].fields,
          oldIndex,
          newIndex
        );
        
        setLocalFormData(prev => ({
          ...prev,
          steps: updatedSteps
        }));
        
        if (selectedFieldIndex === oldIndex) {
          setSelectedFieldIndex(newIndex);
        }
        refreshPreview();
      }
    }
  };
  
  // Update style
  const handleUpdateStyle = (style: typeof localFormData.style) => {
    setLocalFormData(prev => ({
      ...prev,
      style
    }));
    refreshPreview();
  };
  
  // Update form metadata
  const handleUpdateMeta = (data: { title?: string, description?: string, submitButtonText?: string }) => {
    setLocalFormData(prev => ({
      ...prev,
      ...data
    }));
    refreshPreview();
  };
  
  // Refresh preview
  const refreshPreview = () => {
    setPreviewRefreshKey(prev => prev + 1);
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {language === 'ar' ? 'محرر النموذج' : 'Form Editor'}
          </h2>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsStyleEditorOpen(true)}
              className="flex items-center gap-2"
            >
              <Palette className="h-4 w-4" />
              {language === 'ar' ? 'تخصيص المظهر' : 'Customize Appearance'}
            </Button>
            
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving 
                ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                : (language === 'ar' ? 'حفظ' : 'Save')}
            </Button>
            
            <Button 
              variant={localFormData.isPublished ? "secondary" : "default"}
              onClick={handlePublishToggle}
            >
              {localFormData.isPublished 
                ? (language === 'ar' ? 'إلغاء النشر' : 'Unpublish')
                : (language === 'ar' ? 'نشر' : 'Publish')}
            </Button>
          </div>
        </div>
        
        <Card className="overflow-hidden">
          <Tabs defaultValue="elements" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="elements">
                {language === 'ar' ? 'العناصر' : 'Elements'}
              </TabsTrigger>
              <TabsTrigger value="settings">
                {language === 'ar' ? 'الإعدادات' : 'Settings'}
              </TabsTrigger>
              <TabsTrigger value="steps">
                {language === 'ar' ? 'الخطوات' : 'Steps'}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="elements" className="p-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ElementPanel onAddElement={handleAddField} />
                
                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-medium mb-4">
                    {language === 'ar' ? 'عناصر النموذج' : 'Form Elements'}
                  </h3>
                  
                  <DndContext 
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={getCurrentStepFields().map(field => field.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <FormCanvas 
                        fields={getCurrentStepFields()}
                        selectedFieldIndex={selectedFieldIndex}
                        onSelectField={setSelectedFieldIndex}
                        onUpdateField={handleUpdateField}
                        onDeleteField={handleDeleteField}
                      />
                    </SortableContext>
                  </DndContext>
                  
                  {getCurrentStepFields().length === 0 && (
                    <div className="flex flex-col items-center justify-center p-8 text-gray-500 border border-dashed rounded-md">
                      <p>{language === 'ar' ? 'لا توجد عناصر بعد' : 'No elements yet'}</p>
                      <p className="text-sm mt-2">
                        {language === 'ar' 
                          ? 'أضف عناصر من لوحة العناصر' 
                          : 'Add elements from the elements panel'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="p-4 border-t">
              <div className="grid gap-4">
                <div className="form-group">
                  <label className="block text-sm font-medium mb-1">
                    {language === 'ar' ? 'عنوان النموذج' : 'Form Title'}
                  </label>
                  <input 
                    type="text"
                    className="w-full p-2 border rounded"
                    value={localFormData.title}
                    onChange={(e) => handleUpdateMeta({ title: e.target.value })}
                  />
                </div>
                
                <div className="form-group">
                  <label className="block text-sm font-medium mb-1">
                    {language === 'ar' ? 'وصف النموذج' : 'Form Description'}
                  </label>
                  <textarea 
                    className="w-full p-2 border rounded h-24"
                    value={localFormData.description || ''}
                    onChange={(e) => handleUpdateMeta({ description: e.target.value })}
                  />
                </div>
                
                <div className="form-group">
                  <label className="block text-sm font-medium mb-1">
                    {language === 'ar' ? 'نص زر الإرسال' : 'Submit Button Text'}
                  </label>
                  <input 
                    type="text"
                    className="w-full p-2 border rounded"
                    value={localFormData.submitButtonText}
                    onChange={(e) => handleUpdateMeta({ submitButtonText: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="steps" className="p-4 border-t">
              <div className="space-y-4">
                {localFormData.steps.map((step, index) => (
                  <div 
                    key={step.id}
                    className={`p-3 border rounded cursor-pointer ${currentStep === index ? 'bg-gray-100 border-gray-400' : ''}`}
                    onClick={() => setCurrentStep(index)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{step.title}</span>
                      <span className="text-sm text-gray-500">
                        {step.fields.length} {language === 'ar' ? 'عنصر' : 'elements'}
                      </span>
                    </div>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleAddStep}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'إضافة خطوة جديدة' : 'Add New Step'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
      
      <div className="lg:col-span-4">
        <div className="sticky top-4">
          <FormPreviewPanel
            formTitle={localFormData.title}
            formDescription={localFormData.description}
            fields={localFormData.steps[previewStep - 1]?.fields || []}
            formStyle={localFormData.style}
            currentStep={previewStep}
            totalSteps={localFormData.steps.length}
            onPreviousStep={() => setPreviewStep(prev => Math.max(1, prev - 1))}
            onNextStep={() => setPreviewStep(prev => Math.min(localFormData.steps.length, prev + 1))}
            refreshKey={previewRefreshKey}
            submitButtonText={localFormData.submitButtonText}
          />
        </div>
      </div>
      
      <StyleEditor
        isOpen={isStyleEditorOpen}
        onOpenChange={setIsStyleEditorOpen}
        style={localFormData.style}
        onStyleChange={handleUpdateStyle}
      />
    </div>
  );
};

export default FormDesigner;
