
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
  // Get title text from content or label
  const titleText = field.content || field.label || 'عنوان النموذج';
  
  // Apply styles from field settings - USE DYNAMIC VALUES FROM FIELD.STYLE
  const fieldStyle = field.style || {};
  const textColor = fieldStyle.color || '#000000'; // Use field color or default black
  const fontSize = fieldStyle.fontSize || '1.5rem';
  const fontWeight = fieldStyle.fontWeight || '600';
  const fontFamily = fieldStyle.fontFamily || 'Tajawal, Arial, sans-serif';
  const textAlign = fieldStyle.textAlign || 'center';
  
  // Get padding values with defaults
  const paddingTop = fieldStyle.paddingTop || '12px';
  const paddingBottom = fieldStyle.paddingBottom || '12px';
  const paddingLeft = fieldStyle.paddingLeft || '0px';
  const paddingRight = fieldStyle.paddingRight || '0px';

  // DYNAMIC title style that respects field settings
  const titleStyle: React.CSSProperties = {
    color: textColor, // Use the actual color from field style
    fontSize: fontSize,
    fontWeight: fontWeight,
    fontFamily: fontFamily,
    textAlign: textAlign as 'left' | 'center' | 'right',
    margin: '0 0 1rem 0',
    lineHeight: '1.4',
    direction: formStyle.formDirection || 'ltr',
    paddingTop: paddingTop,
    paddingBottom: paddingBottom,
    paddingLeft: paddingLeft,
    paddingRight: paddingRight,
    width: '100%',
    display: 'block',
    backgroundColor: 'transparent',
    background: 'none',
    border: 'none',
  };

  console.log('FormTitleField DYNAMIC RENDERING:', {
    titleText,
    textColor,
    fontSize,
    fontWeight,
    textAlign,
    fieldStyle: fieldStyle
  });

  return (
    <div 
      className="form-title-field w-full"
      style={titleStyle}
      data-field-type="form-title"
      data-field-id={field.id}
      data-text-color={textColor}
      data-background="transparent"
      data-dynamic-color="true"
    >
      {titleText}
    </div>
  );
};

export default React.memo(FormTitleField);
