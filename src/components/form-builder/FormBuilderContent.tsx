
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';
import SortableStep from '@/components/form/SortableStep';
import { FormStep, FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';

interface FormBuilderContentProps {
  steps: FormStep[];
  currentEditStep: number;
  onStepSelect: (index: number) => void;
  onAddStep: () => void;
  availableFieldTypes: Array<{
    type: string;
    label: string;
    icon: React.ReactNode;
  }>;
  onAddField: (type: string) => void;
  formTitle: string;
  formDescription: string;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (desc: string) => void;
  formStyle: any;
  onStyleChange: (key: string, value: string) => void;
}

const FormBuilderContent = ({
  steps,
  currentEditStep,
  onStepSelect,
  onAddStep,
  availableFieldTypes,
  onAddField,
  formTitle,
  formDescription,
  onTitleChange,
  onDescriptionChange,
  formStyle,
  onStyleChange,
}: FormBuilderContentProps) => {
  const { language } = useI18n();

  return (
    <div className="lg:col-span-7 space-y-6">
      <Card>
        <CardContent>
          <Tabs defaultValue="steps">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="steps">{language === 'ar' ? 'الخطوات' : 'Steps'}</TabsTrigger>
              <TabsTrigger value="settings">{language === 'ar' ? 'الإعدادات' : 'Settings'}</TabsTrigger>
              <TabsTrigger value="design">{language === 'ar' ? 'التصميم' : 'Design'}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="steps" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-right">{language === 'ar' ? 'خطوات النموذج' : 'Form Steps'}</h3>
                  {steps.map((step, index) => (
                    <SortableStep
                      key={step.id}
                      step={step}
                      isActive={currentEditStep === index}
                      onClick={() => onStepSelect(index)}
                    />
                  ))}
                  
                  <Button 
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={onAddStep}
                  >
                    <Plus size={16} />
                    {language === 'ar' ? 'إضافة خطوة جديدة' : 'Add New Step'}
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-right">{language === 'ar' ? 'إضافة حقول' : 'Add Fields'}</h3>
                  {availableFieldTypes.map((fieldType) => (
                    <div 
                      key={fieldType.type} 
                      className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => onAddField(fieldType.type)}
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
            </TabsContent>
            
            <TabsContent value="settings" className="mt-6">
              <div className="space-y-4 text-right">
                <div className="form-control">
                  <label className="form-label">{language === 'ar' ? 'عنوان النموذج' : 'Form Title'}</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formTitle}
                    onChange={(e) => onTitleChange(e.target.value)}
                  />
                </div>
                
                <div className="form-control">
                  <label className="form-label">{language === 'ar' ? 'وصف النموذج' : 'Form Description'}</label>
                  <textarea 
                    className="form-input h-24" 
                    value={formDescription}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                  ></textarea>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="design" className="mt-6">
              <div className="space-y-4 text-right">
                <div className="form-control">
                  <label className="form-label">{language === 'ar' ? 'اللون الرئيسي' : 'Primary Color'}</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={formStyle.primaryColor}
                      onChange={(e) => onStyleChange('primaryColor', e.target.value)}
                      className="h-8 w-8 rounded"
                    />
                    <input
                      type="text"
                      value={formStyle.primaryColor}
                      onChange={(e) => onStyleChange('primaryColor', e.target.value)}
                      className="flex-1 form-input"
                    />
                  </div>
                </div>
                
                <div className="form-control">
                  <label className="form-label">{language === 'ar' ? 'استدارة الحواف' : 'Border Radius'}</label>
                  <select
                    className="form-select"
                    value={formStyle.borderRadius}
                    onChange={(e) => onStyleChange('borderRadius', e.target.value)}
                  >
                    <option value="0">{language === 'ar' ? 'بدون استدارة' : 'None'}</option>
                    <option value="0.25rem">{language === 'ar' ? 'استدارة خفيفة' : 'Small'}</option>
                    <option value="0.5rem">{language === 'ar' ? 'استدارة متوسطة' : 'Medium'}</option>
                    <option value="1rem">{language === 'ar' ? 'استدارة كبيرة' : 'Large'}</option>
                    <option value="9999px">{language === 'ar' ? 'دائري' : 'Round'}</option>
                  </select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default FormBuilderContent;
