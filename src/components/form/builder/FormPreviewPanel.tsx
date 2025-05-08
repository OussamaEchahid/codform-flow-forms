
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import FormPreview from '@/components/form/FormPreview';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FormStyle } from './FormStyleEditor';

interface FormPreviewPanelProps {
  formTitle: string;
  formDescription?: string;
  fields: FormField[];
  formStyle?: Partial<FormStyle>;
  currentStep: number;
  totalSteps: number;
  onPreviousStep: () => void;
  onNextStep: () => void;
  refreshKey?: number;
  submitButtonText?: string;
}

const FormPreviewPanel: React.FC<FormPreviewPanelProps> = ({
  formTitle,
  formDescription,
  fields,
  formStyle,
  currentStep,
  totalSteps,
  onPreviousStep,
  onNextStep,
  refreshKey = 0,
  submitButtonText = 'إرسال الطلب',
}) => {
  const { t, language } = useI18n();
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">
          {language === 'ar' ? 'معاينة النموذج' : 'Form Preview'}
        </h2>

        {/* Controls for multi-step form */}
        {totalSteps > 1 && (
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Button 
              size="sm" 
              variant="outline"
              onClick={onPreviousStep}
              disabled={currentStep <= 1}
              type="button"
            >
              {language === 'ar' ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            <span className="text-sm font-medium">
              {currentStep} / {totalSteps}
            </span>
            <Button 
              size="sm" 
              variant="outline"
              onClick={onNextStep}
              disabled={currentStep >= totalSteps}
              type="button"
            >
              {language === 'ar' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </div>

      <div className="form-preview-container flex-1 overflow-auto border rounded-md">
        <FormPreview
          key={`preview-${refreshKey}-${currentStep}`}
          formTitle={formTitle}
          formDescription={formDescription}
          currentStep={currentStep}
          totalSteps={totalSteps}
          formStyle={formStyle}
          fields={fields}
          submitButtonText={submitButtonText}
        >
          {(!fields || fields.length === 0) && (
            <div className="text-center p-6">
              <p className="text-gray-500 mb-4">
                {language === 'ar' 
                  ? 'أضف عناصر إلى النموذج لمعاينتها هنا'
                  : 'Add form elements to preview them here'}
              </p>
            </div>
          )}
        </FormPreview>
      </div>
    </div>
  );
};

export default React.memo(FormPreviewPanel);
