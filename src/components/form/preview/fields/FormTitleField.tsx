
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
  
  // Apply styles from field settings - FORCE BLACK COLOR FOR ALL TITLES
  const fieldStyle = field.style || {};
  // FORCE BLACK COLOR: إجبار جميع العناوين على اللون الأسود بغض النظر عن القيمة المحفوظة
  const textColor = '#000000'; // إجبار اللون الأسود دائماً
  const fontSize = fieldStyle.fontSize || '1.5rem';
  const fontWeight = fieldStyle.fontWeight || '700';
  const fontFamily = fieldStyle.fontFamily || 'Cairo, Tajawal, Arial, sans-serif';
  
  // ALWAYS center align the title regardless of form direction
  const textAlign = 'center';
  
  // Get padding values with defaults
  const paddingTop = fieldStyle.paddingTop || '0px';
  const paddingBottom = fieldStyle.paddingBottom || '20px';
  const paddingLeft = fieldStyle.paddingLeft || '0px';
  const paddingRight = fieldStyle.paddingRight || '0px';

  // Clean title style with proper centering and BLACK default color
  const titleStyle: React.CSSProperties = {
    color: textColor,
    fontSize: fontSize,
    fontWeight: fontWeight,
    fontFamily: fontFamily,
    textAlign: textAlign,
    margin: '0 0 20px 0',
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
