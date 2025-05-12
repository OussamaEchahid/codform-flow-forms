
import React from 'react';
import { FormField } from '@/lib/form-utils';
import FormPreview from '@/components/form/FormPreview';
import { useI18n } from '@/lib/i18n';

interface FormStyle {
  primaryColor: string;
  borderRadius: string;
  fontSize: string;
  buttonStyle: string;
}

interface FormPreviewPanelProps {
  formTitle: string;
  formDescription: string;
  currentStep: number;
  totalSteps: number;
  formStyle: FormStyle;
  fields: FormField[];
  onPreviousStep: () => void;
  onNextStep: () => void;
  refreshKey: number;
}

const FormPreviewPanel: React.FC<FormPreviewPanelProps> = ({
  formTitle,
  formDescription,
  currentStep,
  totalSteps,
  formStyle,
  fields,
  onPreviousStep,
  onNextStep,
  refreshKey
}) => {
  const { language } = useI18n();
  
  // We won't manipulate fields here - this is just for debugging
  console.log('FormPreviewPanel rendering with fields:', fields);
  const formTitleField = fields.find(f => f.type === 'form-title');
  console.log('Form title field exists:', formTitleField);

  return (
    <div>
      <h3 className={`text-lg font-medium mb-4 ${language === 'ar' ? 'text-right' : ''}`}>
        {language === 'ar' ? 'معاينة مباشرة' : 'Live Preview'}
      </h3>
      
      <div className="border rounded-lg p-4 bg-gray-50">
        <FormPreview 
          key={refreshKey}
          formTitle={formTitle}
          formDescription={formDescription}
          currentStep={currentStep}
          totalSteps={totalSteps}
          formStyle={formStyle}
          fields={fields}
        >
          <div></div>
        </FormPreview>
      </div>
    </div>
  );
};

export default FormPreviewPanel;
