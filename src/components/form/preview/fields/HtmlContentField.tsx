
import React from 'react';
import { FormField } from '@/lib/form-utils';

interface HtmlContentFieldProps {
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

const HtmlContentField: React.FC<HtmlContentFieldProps> = ({ field, formStyle }) => {
  return (
    <div
      className="html-content"
      dangerouslySetInnerHTML={{ __html: field.content || '<p>HTML Content</p>' }}
      style={{
        fontSize: formStyle.fontSize,
        textAlign: field.style?.textAlign || 'left'
      }}
    />
  );
};

export default HtmlContentField;
