
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
  
  // Apply styles from field settings - مطابقة للمتجر
  const fieldStyle = field.style || {};
  const textColor = fieldStyle.color || '#000000';
  const fontSize = fieldStyle.fontSize || '24px';
  const fontWeight = fieldStyle.fontWeight || 'bold';
  const fontFamily = fieldStyle.fontFamily || "'Cairo', inherit";
  
  // ALWAYS center align the title regardless of form direction
  const textAlign = 'center';
  
  // Get padding values with defaults
  const paddingTop = fieldStyle.paddingTop || '0px';
  const paddingBottom = fieldStyle.paddingBottom || '20px';
  const paddingLeft = fieldStyle.paddingLeft || '0px';
  const paddingRight = fieldStyle.paddingRight || '0px';

  // Clean title style - مطابقة للمتجر
  const titleStyle: React.CSSProperties = {
    color: textColor,
    fontSize: fontSize,
    fontWeight: fontWeight,
    fontFamily: fontFamily,
    textAlign: textAlign,
    padding: '0',
    margin: '0 0 20px 0',
    background: 'none',
    border: 'none',
    width: '100%',
    display: 'block'
  };

  console.log('FormTitleField - FIXED BLACK COLOR:', {
    titleText,
    textColor: textColor, // يجب أن يكون #000000 للنماذج الجديدة
    fontSize,
    fontWeight,
    textAlign: 'center',
    fieldStyle: fieldStyle,
    isDefaultBlackColor: textColor === '#000000'
  });

  return (
    <div 
      className="form-title-field w-full"
      style={titleStyle}
      data-field-type="form-title"
      data-field-id={field.id}
      data-text-align="center"
      data-clean-title="true"
      data-text-color={textColor}
    >
      {titleText}
    </div>
  );
};

export default React.memo(FormTitleField);
