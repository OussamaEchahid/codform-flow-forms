
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
  
  // Get style properties with defaults
  const textColor = field.style?.color || field.style?.labelColor || '#000000';
  const fontSize = field.style?.fontSize || field.style?.labelFontSize || '1.5rem';
  const fontWeight = field.style?.fontWeight || field.style?.labelFontWeight || '700';
  const textAlign = field.style?.textAlign || 'center';
  const fontFamily = field.style?.fontFamily || 'inherit';
  const paddingTop = field.style?.paddingTop || '6px';
  const paddingBottom = field.style?.paddingBottom || '6px';
  const paddingLeft = field.style?.paddingLeft || '0px';
  const paddingRight = field.style?.paddingRight || '0px';

  return (
    <div 
      className="form-title-field"
      style={{
        color: textColor,
        fontSize: fontSize,
        fontWeight: fontWeight,
        textAlign: textAlign as 'left' | 'center' | 'right',
        fontFamily: fontFamily,
        paddingTop: paddingTop,
        paddingBottom: paddingBottom,
        paddingLeft: paddingLeft,
        paddingRight: paddingRight,
        margin: '0',
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
