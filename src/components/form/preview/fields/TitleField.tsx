
import React from 'react';
import { FormField } from '@/lib/form-utils';

interface TitleFieldProps {
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

const TitleField: React.FC<TitleFieldProps> = ({ field, formStyle }) => {
  return (
    <div className="text-center space-y-2">
      {field.style?.showTitle !== false && field.label && (
        <h2
          className="text-2xl font-bold"
          style={{
            color: field.style?.color || formStyle.primaryColor || '#000000',
            fontSize: field.style?.fontSize || '1.5rem',
            textAlign: field.style?.textAlign || 'center'
          }}
        >
          {field.label}
        </h2>
      )}
      {field.style?.showDescription !== false && field.helpText && (
        <p
          className="text-gray-600"
          style={{
            color: field.style?.descriptionColor || '#6b7280',
            fontSize: field.style?.descriptionFontSize || '1rem',
            textAlign: field.style?.textAlign || 'center'
          }}
        >
          {field.helpText}
        </p>
      )}
    </div>
  );
};

export default TitleField;
