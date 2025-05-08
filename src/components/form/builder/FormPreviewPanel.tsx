
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

// استخدام مكون خارجي للأزرار لمنع إعادة الرسم غير الضروري
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

// استخدام ref بدلاً من state لمنع التحديثات غير الضرورية
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
  
  const { t, language } = useI18n();
  
  // استخدام useMemo بدلاً من useRef وuseEffect
  const previewKey = React.useMemo(() => `preview-${refreshKey}-${currentStep}`, [refreshKey, currentStep]);
  
  // رسالة في حالة عدم وجود حقول - مذكرة لمنع إعادة الإنشاء
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

        {/* التحكم في النموذج متعدد الخطوات */}
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

export default React.memo(FormPreviewPanel);
