
import React from 'react';
import { FormField } from '@/lib/form-utils';

interface FormTitleFieldProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
    buttonStyle?: string;
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
  };
}

const FormTitleField: React.FC<FormTitleFieldProps> = ({ field, formStyle }) => {
  // Get title text from field content or label
  const titleText = field.content || field.label || 'عنوان النموذج';
  
  // Get style properties with defaults - simple styling
  const textColor = field.style?.color || '#000000';
  const fontSize = field.style?.fontSize || '1.5rem';
  const fontWeight = field.style?.fontWeight || '600';
  const textAlign = field.style?.textAlign || 'center';
  const fontFamily = field.style?.fontFamily || 'inherit';

  return (
    <div 
      className="form-title-field"
      style={{
        color: textColor,
        fontSize: fontSize,
        fontWeight: fontWeight,
        textAlign: textAlign as 'left' | 'center' | 'right',
        fontFamily: fontFamily,
        margin: '0 0 1rem 0',
        lineHeight: '1.2',
        direction: formStyle.formDirection || 'ltr'
      }}
      data-field-type="form-title"
      data-field-id={field.id}
    >
      {titleText}
    </div>
  );
};

export default React.memo(FormTitleField);
