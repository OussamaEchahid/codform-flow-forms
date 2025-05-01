
import React from 'react';
import FormPreview from '../FormPreview';
import { useI18n } from '@/lib/i18n';

interface FormPreviewPanelProps {
  formData: any; // Use any for now as the structure may vary
  sectionConfig: any;
}

const FormPreviewPanel: React.FC<FormPreviewPanelProps> = ({ formData, sectionConfig }) => {
  const { language } = useI18n();
  const [currentStep, setCurrentStep] = React.useState(1);
  
  if (!formData) {
    return (
      <div className="text-center py-8 text-gray-500">
        {language === 'ar' ? 'لا يوجد بيانات للعرض' : 'No form data to preview'}
      </div>
    );
  }
  
  const formFields = formData.data && formData.data[currentStep - 1]?.fields || [];
  const totalSteps = formData.data?.length || 1;
  
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-center mb-4">
        {language === 'ar' ? 'معاينة النموذج' : 'Form Preview'}
      </h2>
      
      <FormPreview
        formTitle={formData.title || (language === 'ar' ? 'نموذج بدون عنوان' : 'Untitled Form')}
        formDescription={formData.description}
        currentStep={currentStep}
        totalSteps={totalSteps}
        formStyle={formData.style || {}}
        fields={formFields}
      >
        <div>{language === 'ar' ? 'محتوى النموذج' : 'Form content'}</div>
      </FormPreview>
      
      <div className="flex justify-between mt-4">
        <button
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50"
          disabled={currentStep === 1}
        >
          {language === 'ar' ? 'السابق' : 'Previous'}
        </button>
        
        <button
          onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          disabled={currentStep === totalSteps}
        >
          {language === 'ar' ? 'التالي' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default FormPreviewPanel;
