import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { FormField, FormStep } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Save, Palette, Globe } from 'lucide-react';
import { toast } from 'sonner';
import ElementPanel from './ElementPanel';
import FormCanvas from './FormCanvas';
import StyleEditor from './StyleEditor';
import FormPreviewPanel from '../builder/FormPreviewPanel';
import ShopifyFormSync from '../builder/ShopifyFormSync';
import ShopifyConnectionStatus from '../builder/ShopifyConnectionStatus';
import ShopifyIntegration from '../builder/ShopifyIntegration';

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
  const [localFormData, setLocalFormData] = useState<FormDesignData>({...formData});
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isStyleEditorOpen, setIsStyleEditorOpen] = useState<boolean>(false);
  const [previewStep, setPreviewStep] = useState<number>(1);
  const [previewRefreshKey, setPreviewRefreshKey] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>("editor");

  // Sync with external formData when it changes
  useEffect(() => {
    setLocalFormData({...formData});
  }, [formData.id]);

  // Helper to get current step fields
  const getCurrentStepFields = () => {
    return localFormData.steps[currentStep]?.fields || [];
  };

  // Save form changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Validate form data
      if (!localFormData.title.trim()) {
        toast.error(language === 'ar' ? 'عنوان النموذج مطلوب' : 'Form title is required');
        setIsSaving(false);
        return;
      }
      
      const success = await onSave(localFormData);
      if (success) {
        toast.success(language === 'ar' ? 'تم حفظ النموذج بنجاح' : 'Form saved successfully');
        console.log('Form saved successfully:', localFormData);
      } else {
        toast.error(language === 'ar' ? 'فشل في حفظ النموذج' : 'Failed to save form');
      }
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error(language === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error occurred during save');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle form publish state
  const handlePublishToggle = async () => {
    try {
      const willPublish = !localFormData.isPublished;
      const success = await onPublish(localFormData.id, willPublish);
      
      if (success) {
        setLocalFormData(prev => ({
          ...prev,
          isPublished: willPublish
        }));
        
        toast.success(
          willPublish 
            ? (language === 'ar' ? 'تم نشر النموذج بنجاح' : 'Form published successfully')
            : (language === 'ar' ? 'تم إلغاء نشر النموذج' : 'Form unpublished')
        );
      } else {
        toast.error(language === 'ar' ? 'فشل تغيير حالة النشر' : 'Failed to change publish state');
      }
    } catch (error) {
      console.error('Error toggling publish state:', error);
      toast.error(language === 'ar' ? 'حدث خطأ أثناء تغيير حالة النشر' : 'Error changing publish state');
    }
  };

  // Add a new step to the form
  const handleAddStep = () => {
    const newStepId = `step-${Date.now()}`;
    const newStep = {
      id: newStepId,
      title: language === 'ar' ? `الخطوة ${localFormData.steps.length + 1}` : `Step ${localFormData.steps.length + 1}`,
      fields: []
    };
    
    setLocalFormData(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
    
    // Switch to the new step
    setCurrentStep(localFormData.steps.length);
    setSelectedFieldIndex(null);
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

  // Update a field in the current step
  const handleUpdateField = (index: number, updatedField: FormField) => {
    const updatedSteps = [...localFormData.steps];
    updatedSteps[currentStep].fields[index] = updatedField;
    
    setLocalFormData(prev => ({
      ...prev,
      steps: updatedSteps
    }));
    
    refreshPreview();
  };

  // Delete a field from the current step
  const handleDeleteField = (index: number) => {
    const updatedSteps = [...localFormData.steps];
    updatedSteps[currentStep].fields.splice(index, 1);
    
    setLocalFormData(prev => ({
      ...prev,
      steps: updatedSteps
    }));
    
    if (selectedFieldIndex === index) {
      setSelectedFieldIndex(null);
    } else if (selectedFieldIndex !== null && selectedFieldIndex > index) {
      setSelectedFieldIndex(selectedFieldIndex - 1);
    }
    
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

  // Update the form style
  const handleUpdateStyle = (style: FormDesignData['style']) => {
    setLocalFormData(prev => ({
      ...prev,
      style
    }));
    
    refreshPreview();
  };

  // Update form metadata (title, description, etc)
  const handleUpdateMeta = (field: string, value: string) => {
    setLocalFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    refreshPreview();
  };

  // Update current step title
  const handleUpdateStepTitle = (title: string) => {
    const updatedSteps = [...localFormData.steps];
    updatedSteps[currentStep].title = title;
    
    setLocalFormData(prev => ({
      ...prev,
      steps: updatedSteps
    }));
    
    refreshPreview();
  };

  // Refresh the preview by updating the key
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
              <Globe className="h-4 w-4 mr-2" />
              {localFormData.isPublished 
                ? (language === 'ar' ? 'إلغاء النشر' : 'Unpublish')
                : (language === 'ar' ? 'نشر' : 'Publish')}
            </Button>
          </div>
        </div>
        
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="editor">
                {language === 'ar' ? 'محرر الحقول' : 'Field Editor'}
              </TabsTrigger>
              <TabsTrigger value="shopify">
                {language === 'ar' ? 'تكامل Shopify' : 'Shopify Integration'}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="editor" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-3">
                  <ElementPanel onAddField={handleAddField} />
                </div>
                
                <div className="md:col-span-9">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium">
                          {language === 'ar' ? 'خطوات النموذج' : 'Form Steps'}
                        </h3>
                        <span className="text-xs text-gray-500 ml-2">
                          ({localFormData.steps.length})
                        </span>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleAddStep}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        {language === 'ar' ? 'إضافة خطوة' : 'Add Step'}
                      </Button>
                    </div>
                    
                    <div className="flex space-x-2 overflow-x-auto pb-2">
                      {localFormData.steps.map((step, index) => (
                        <Button
                          key={step.id}
                          variant={currentStep === index ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setCurrentStep(index);
                            setSelectedFieldIndex(null);
                          }}
                        >
                          {step.title || (language === 'ar' ? `الخطوة ${index + 1}` : `Step ${index + 1}`)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {localFormData.steps.length > 0 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          {language === 'ar' ? 'عنوان الخطوة' : 'Step Title'}
                        </label>
                        <input
                          type="text"
                          value={localFormData.steps[currentStep]?.title || ''}
                          onChange={(e) => handleUpdateStepTitle(e.target.value)}
                          className="w-full border rounded-md p-2"
                          placeholder={language === 'ar' ? 'عنوان الخطوة' : 'Step Title'}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          {language === 'ar' ? 'حقول الخطوة' : 'Step Fields'}
                        </label>
                        
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
                          <div className="text-center p-6 border rounded-md border-dashed">
                            <p className="text-gray-500 mb-2">
                              {language === 'ar' 
                                ? 'لا توجد حقول في هذه الخطوة' 
                                : 'No fields in this step'}
                            </p>
                            <p className="text-gray-500 text-sm">
                              {language === 'ar' 
                                ? 'اختر نوع الحقل من القائمة لإضافته' 
                                : 'Choose a field type from the panel to add'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="shopify">
              <div className="p-4">
                <div className="mb-4">
                  <div className="bg-gray-50 p-3 rounded-md mb-4">
                    <ShopifyConnectionStatus />
                  </div>
                  <ShopifyIntegration formId={localFormData.id} />
                  <ShopifyFormSync formId={localFormData.id} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
      
      <div className="lg:col-span-4">
        <div className="sticky top-4">
          <div className="space-y-4 bg-white p-4 rounded-lg shadow-sm mb-4">
            <h3 className="text-lg font-medium">
              {language === 'ar' ? 'إعدادات النموذج' : 'Form Settings'}
            </h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                {language === 'ar' ? 'عنوان النموذج' : 'Form Title'}
              </label>
              <input
                type="text"
                value={localFormData.title}
                onChange={(e) => handleUpdateMeta('title', e.target.value)}
                className="w-full border rounded-md p-2"
                placeholder={language === 'ar' ? 'عنوان النموذج' : 'Form Title'}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                {language === 'ar' ? 'وصف النموذج' : 'Form Description'}
              </label>
              <textarea
                value={localFormData.description || ''}
                onChange={(e) => handleUpdateMeta('description', e.target.value)}
                className="w-full border rounded-md p-2"
                rows={2}
                placeholder={language === 'ar' ? 'وصف النموذج (اختياري)' : 'Form Description (optional)'}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                {language === 'ar' ? 'نص زر الإرسال' : 'Submit Button Text'}
              </label>
              <input
                type="text"
                value={localFormData.submitButtonText}
                onChange={(e) => handleUpdateMeta('submitButtonText', e.target.value)}
                className="w-full border rounded-md p-2"
                placeholder={language === 'ar' ? 'إرسال الطلب' : 'Submit Order'}
              />
            </div>
          </div>
          
          <FormPreviewPanel
            formTitle={localFormData.title}
            formDescription={localFormData.description}
            currentStep={previewStep}
            totalSteps={localFormData.steps.length}
            formStyle={localFormData.style}
            fields={localFormData.steps[previewStep - 1]?.fields || []}
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
