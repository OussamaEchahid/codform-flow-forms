
import React, { useEffect, useState, useMemo } from 'react';
import { FormField, deepCloneField } from '@/lib/form-utils';
import FormPreview from '@/components/form/FormPreview';
import { useI18n } from '@/lib/i18n';

interface FormStyle {
  primaryColor: string;
  borderRadius: string;
  fontSize: string;
  buttonStyle: string;
  // Add new style properties
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

// Improved deep clone function with full TypeScript support
const deepCloneFields = (fields: FormField[]): FormField[] => {
  if (!fields) return [];
  
  return fields.map(field => {
    // Create a complete deep copy of the field
    const newField = deepCloneField(field);
    
    // Ensure style object is correctly copied with all properties
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
  
  // Use internal refresh key to prevent render loops
  const [internalRefreshKey, setInternalRefreshKey] = useState(0);
  
  // Only update internal key when refresh key increases
  useEffect(() => {
    if (refreshKey > internalRefreshKey) {
      setInternalRefreshKey(refreshKey);
    }
  }, [refreshKey, internalRefreshKey]);
  
  // Process all fields with deep cloning to prevent mutations - critical for form stability
  const processedFields = useMemo(() => {
    console.log("Processing fields for preview, original count:", fields?.length || 0);
    
    // Create a deep copy of all fields to prevent mutations
    const clonedFields = deepCloneFields(fields);
    
    // Add default submit button if needed
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
        },
      };
      clonedFields.push(submitButton);
    }
    
    // Apply current form direction to all fields that need it
    if (formStyle.formDirection) {
      return clonedFields.map(field => {
        // Skip fields that already have explicit direction
        if (field.style?.textAlign) return field;
        
        // Only update specific field types that benefit from direction
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

  // Prepare form style for preview with default background color
  // Make sure we have all required style properties with default values
  const previewFormStyle = {
    ...formStyle,
    backgroundColor: formStyle.backgroundColor || '#F9FAFB', // Default background color
    borderRadius: formStyle.borderRadius || '1.5rem', // Large border radius
    borderColor: formStyle.borderColor || '#9b87f5', // Default border color
    borderWidth: formStyle.borderWidth || '2px',     // Default border width
  };

  return (
    <div>
      <h3 className={`text-lg font-medium mb-3 ${language === 'ar' ? 'text-right' : ''}`}>
        {language === 'ar' ? 'معاينة مباشرة' : 'Live Preview'}
      </h3>
      
      <div className="border rounded-lg p-3 bg-gray-50">
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
