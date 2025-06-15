import React, { useEffect, useState, useMemo } from 'react';
import { FormField, deepCloneField } from '@/lib/form-utils';
import FormPreview from '@/components/form/FormPreview';
import { useI18n } from '@/lib/i18n';
import { useFormStore } from '@/hooks/useFormStore';
import { Button } from '@/components/ui/button';

interface FormStyle {
  primaryColor: string;
  borderRadius: string;
  fontSize: string;
  buttonStyle: string;
  borderColor?: string;
  borderWidth?: string;
  backgroundColor?: string;
  paddingTop?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  paddingRight?: string;
  formGap?: string;
  formDirection?: 'ltr' | 'rtl';
  floatingLabels?: boolean;
}

interface FormPreviewPanelProps {
  formTitle: string;
  formDescription: string;
  currentStep: number;
  totalSteps: number;
  formStyle: FormStyle;
  fields: FormField[];
  onPreviousStep?: () => void;
  onNextStep?: () => void;
  refreshKey: number;
}

const deepCloneFields = (fields: FormField[]): FormField[] => {
  if (!fields) return [];
  
  return fields.map(field => {
    const newField = deepCloneField(field);
    if (field.style) {
      newField.style = JSON.parse(JSON.stringify(field.style));
    }
    return newField;
  });
};

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
  const { updateFormStyle } = useFormStore();
  
  const [internalRefreshKey, setInternalRefreshKey] = useState(0);
  
  useEffect(() => {
    if (refreshKey > internalRefreshKey) {
      setInternalRefreshKey(refreshKey);
    }
  }, [refreshKey, internalRefreshKey]);
  
  const toggleDirection = () => {
    const newDirection = formStyle.formDirection === 'rtl' ? 'ltr' : 'rtl';
    updateFormStyle({ formDirection: newDirection });
  };
  
  const processedFields = useMemo(() => {
    console.log("Processing fields for preview, original count:", fields?.length || 0);
    
    const clonedFields = deepCloneFields(fields);
    
    const hasSubmitButton = clonedFields.some(field => field.type === 'submit');
    
    if (!hasSubmitButton) {
      const submitButton: FormField = {
        type: 'submit',
        id: `submit-stable`,
        label: language === 'ar' ? 'إرسال الطلب' : 'Submit Order',
        style: {
          backgroundColor: formStyle.primaryColor || '#9b87f5',
          color: '#ffffff',
          fontSize: '18px',
          animation: true,
          animationType: 'pulse',
          borderRadius: formStyle.borderRadius || '1.5rem',
        },
      };
      clonedFields.push(submitButton);
    }
    
    if (formStyle.formDirection) {
      return clonedFields.map(field => {
        if (field.style?.textAlign) return field;
        
        if (['text', 'textarea', 'email', 'phone'].includes(field.type)) {
          return {
            ...field,
            style: {
              ...field.style,
              textAlign: (formStyle.formDirection === 'rtl' ? 'right' : 'left') as 'right' | 'left'
            }
          };
        }
        
        return field;
      });
    }
    
    console.log("Final processed fields count:", clonedFields.length);
    return clonedFields;
  }, [fields, language, formStyle.primaryColor, formStyle.backgroundColor, formStyle.borderRadius, formStyle.formDirection]);

  const previewFormStyle = {
    ...formStyle,
    backgroundColor: formStyle.backgroundColor || '#ffffff',
    borderRadius: formStyle.borderRadius || '1.5rem', // FIX: Match default
    borderColor: formStyle.borderColor || '#9b87f5',
    borderWidth: formStyle.borderWidth || '2px',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className={`text-lg font-medium ${language === 'ar' ? 'text-right' : ''}`}>
          {language === 'ar' ? 'معاينة مباشرة' : 'Live Preview'}
        </h3>
        <Button variant="outline" size="sm" onClick={toggleDirection}>
          {language === 'ar' ? 'تغيير الاتجاه' : 'Direction'}: {formStyle.formDirection?.toUpperCase() || 'LTR'}
        </Button>
      </div>
      
      <div 
        className="rounded-xl p-6 shadow-sm"
        style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0'
        }}
      >
        <FormPreview 
          key={`preview-${internalRefreshKey}`}
          formTitle=""
          formDescription=""
          currentStep={currentStep}
          totalSteps={totalSteps}
          formStyle={previewFormStyle}
          fields={processedFields}
        >
          <div></div>
        </FormPreview>
      </div>
      
      <div className="mt-2 text-xs text-gray-500 p-2 rounded text-center">
        {language === 'ar' 
          ? 'المعاينة تعكس بدقة كيف سيظهر النموذج في متجر Shopify'
          : 'This preview accurately reflects how the form will appear in your Shopify store'}
      </div>
    </div>
  );
};

export default React.memo(FormPreviewPanel);
