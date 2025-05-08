
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

// Memoized step navigation buttons to prevent unnecessary re-renders
const StepButtons = React.memo(({ 
  currentStep,
  totalSteps,
  onPreviousStep,
  onNextStep,
  language
}: { 
  currentStep: number;
  totalSteps: number;
  onPreviousStep: () => void;
  onNextStep: () => void;
  language: string;
}) => {
  if (totalSteps <= 1) return null;
  
  return (
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
  );
});

StepButtons.displayName = 'StepButtons';

// Custom comparison function to prevent unnecessary re-renders
const arePreviewPanelPropsEqual = (prev: FormPreviewPanelProps, next: FormPreviewPanelProps) => {
  return (
    prev.formTitle === next.formTitle &&
    prev.formDescription === next.formDescription &&
    prev.currentStep === next.currentStep &&
    prev.totalSteps === next.totalSteps &&
    prev.refreshKey === next.refreshKey &&
    prev.submitButtonText === next.submitButtonText &&
    JSON.stringify(prev.fields) === JSON.stringify(next.fields) &&
    JSON.stringify(prev.formStyle) === JSON.stringify(next.formStyle)
  );
};

// Optimized FormPreviewPanel with stabilized key generation
const FormPreviewPanel = (props: FormPreviewPanelProps) => {
  const {
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
  } = props;
  
  const { language } = useI18n();
  
  // Generate a stable key using useMemo to control when preview needs to refresh
  const previewKey = React.useMemo(() => 
    `preview-${refreshKey}-${currentStep}`, 
    [refreshKey, currentStep]
  );
  
  // Empty fields message - memoized to prevent recreation
  const emptyFieldsMessage = React.useMemo(() => {
    if (!fields || fields.length === 0) {
      return (
        <div className="text-center p-6">
          <p className="text-gray-500 mb-4">
            {language === 'ar' 
              ? 'أضف عناصر إلى النموذج لمعاينتها هنا'
              : 'Add form elements to preview them here'}
          </p>
        </div>
      );
    }
    return null;
  }, [fields, language]);
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">
          {language === 'ar' ? 'معاينة النموذج' : 'Form Preview'}
        </h2>

        {/* Multi-step form navigation */}
        {totalSteps > 1 && (
          <StepButtons 
            currentStep={currentStep}
            totalSteps={totalSteps}
            onPreviousStep={onPreviousStep}
            onNextStep={onNextStep}
            language={language}
          />
        )}
      </div>

      <div className="form-preview-container flex-1 overflow-auto border rounded-md">
        <FormPreview
          key={previewKey}
          formTitle={formTitle}
          formDescription={formDescription}
          currentStep={currentStep}
          totalSteps={totalSteps}
          formStyle={formStyle}
          fields={fields}
          submitButtonText={submitButtonText}
        >
          {emptyFieldsMessage}
        </FormPreview>
      </div>
    </div>
  );
};

export default React.memo(FormPreviewPanel, arePreviewPanelPropsEqual);
