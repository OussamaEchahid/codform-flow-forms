
import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import FormPreview from '@/components/form/FormPreview';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { FormField, FormStep } from '@/lib/form-utils';

interface FormBuilderSidebarProps {
  formTitle: string;
  formDescription: string;
  currentStep: number;
  totalSteps: number;
  formStyle: any;
  fields: FormField[];
  onStepChange: (step: number) => void;
}

const FormBuilderSidebar = ({
  formTitle,
  formDescription,
  currentStep,
  totalSteps,
  formStyle,
  fields,
  onStepChange,
}: FormBuilderSidebarProps) => {
  const { language } = useI18n();

  return (
    <div className="lg:col-span-5">
      <div className="sticky top-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-500">معاينة مباشرة</div>
          <h3 className="text-lg font-medium text-right">معاينة النموذج</h3>
        </div>
        
        <FormPreview 
          formTitle={formTitle}
          formDescription={formDescription}
          currentStep={currentStep}
          totalSteps={totalSteps}
          formStyle={formStyle}
          fields={fields}
        >
          <div></div>
        </FormPreview>
        
        <div className="mt-4 flex justify-end">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onStepChange(Math.max(currentStep - 1, 1))}
              disabled={currentStep === 1}
            >
              {language === 'ar' ? 'السابق' : 'Previous'}
            </Button>
            
            {currentStep < totalSteps ? (
              <Button 
                variant="default"
                style={{ backgroundColor: formStyle.primaryColor }}
                onClick={() => onStepChange(Math.min(currentStep + 1, totalSteps))}
              >
                {language === 'ar' ? 'التالي' : 'Next'}
              </Button>
            ) : (
              <Button 
                variant="default"
                style={{ backgroundColor: formStyle.primaryColor }}
              >
                {language === 'ar' ? 'إرسال الطلب' : 'Submit'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBuilderSidebar;
