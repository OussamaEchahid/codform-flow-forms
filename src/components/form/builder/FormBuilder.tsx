
import React, { useState } from 'react';
import { FormStep } from '@/lib/form-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface FormBuilderProps {
  data: FormStep[];
  onChange: (newData: FormStep[]) => void;
}

const FormBuilder: React.FC<FormBuilderProps> = ({ data, onChange }) => {
  const { language } = useI18n();
  const [activeStep, setActiveStep] = useState(0);

  // Create a new empty step
  const handleAddStep = () => {
    const newStep: FormStep = {
      id: (data.length + 1).toString(),
      title: language === 'ar' ? `خطوة ${data.length + 1}` : `Step ${data.length + 1}`,
      fields: []
    };
    
    const newData = [...data, newStep];
    onChange(newData);
    setActiveStep(newData.length - 1);
  };

  // Add a field to the current step
  const handleAddField = () => {
    if (!data[activeStep]) return;
    
    const newField = {
      id: `field-${Date.now()}`,
      type: 'text',
      label: language === 'ar' ? 'حقل نصي جديد' : 'New Text Field',
      required: false
    };
    
    const newData = [...data];
    newData[activeStep].fields.push(newField);
    onChange(newData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className={language === 'ar' ? 'text-right' : ''}>
          {language === 'ar' ? 'بناء النموذج' : 'Form Builder'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Step navigation */}
          <div className="flex flex-wrap gap-2 mb-4">
            {data.map((step, index) => (
              <Button
                key={step.id}
                variant={activeStep === index ? 'default' : 'outline'}
                onClick={() => setActiveStep(index)}
              >
                {step.title}
              </Button>
            ))}
            <Button variant="outline" onClick={handleAddStep}>
              <Plus className="mr-1" size={16} />
              {language === 'ar' ? 'إضافة خطوة' : 'Add Step'}
            </Button>
          </div>

          {/* Current step fields */}
          <div className="border rounded-md p-4">
            <h3 className={`text-lg font-medium mb-4 ${language === 'ar' ? 'text-right' : ''}`}>
              {data[activeStep]?.title || (language === 'ar' ? 'بدء النموذج' : 'Start Building')}
            </h3>
            
            <div className="space-y-4">
              {data[activeStep]?.fields.map((field, fieldIndex) => (
                <div 
                  key={field.id} 
                  className="border rounded p-3 bg-gray-50 flex justify-between items-center"
                >
                  <span>{field.label}</span>
                  <span className="text-sm text-gray-500">{field.type}</span>
                </div>
              ))}
              
              {data[activeStep]?.fields.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>{language === 'ar' ? 'لا توجد حقول بعد' : 'No fields yet'}</p>
                  <p className="text-sm">
                    {language === 'ar' ? 'انقر على "إضافة حقل" لبدء بناء النموذج' : 'Click "Add Field" to start building your form'}
                  </p>
                </div>
              )}
              
              <Button onClick={handleAddField}>
                <Plus className="mr-1" size={16} />
                {language === 'ar' ? 'إضافة حقل' : 'Add Field'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FormBuilder;
