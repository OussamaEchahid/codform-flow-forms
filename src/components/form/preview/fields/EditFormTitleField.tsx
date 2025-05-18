
import React from 'react';
import { FormField } from '@/lib/form-utils';

interface EditFormTitleFieldProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
  };
  formDirection?: 'ltr' | 'rtl';
}

const EditFormTitleField: React.FC<EditFormTitleFieldProps> = ({
  field,
  formStyle,
  formDirection
}) => {
  // Use style from the field or fallback to defaults
  const backgroundColor = field.style?.backgroundColor || '#9b87f5';
  const textColor = field.style?.color || '#ffffff';
  const descriptionColor = field.style?.descriptionColor || '#ffffff';
  const textAlign = field.style?.textAlign || 'center';
  const fontWeight = field.style?.fontWeight || 'bold';
  const titleFontSize = field.style?.titleFontSize || '24px';
  const descriptionFontSize = field.style?.descriptionFontSize || '14px';
  const showDescription = field.style?.showDescription !== false;
  const showTitle = field.style?.showTitle !== false;
  
  if (!showTitle) {
    return null;
  }
  
  // Use formDirection from props or from field style
  const direction = formDirection || field.style?.formDirection || 'ltr';
  
  return (
    <div
      className="form-title-field w-full my-2"
      style={{
        backgroundColor,
        borderRadius: formStyle.borderRadius || '0.5rem',
        padding: '0.75rem',
        direction,
      }}
      dir={direction}
    >
      <h2
        style={{
          color: textColor,
          textAlign: textAlign as any,
          fontWeight: fontWeight as any,
          fontSize: titleFontSize,
          margin: 0,
        }}
      >
        {field.label}
      </h2>
      
      {showDescription && field.helpText && (
        <p
          style={{
            color: descriptionColor,
            textAlign: textAlign as any,
            fontSize: descriptionFontSize,
            margin: '0.25rem 0 0 0',
          }}
        >
          {field.helpText}
        </p>
      )}
    </div>
  );
};

export default EditFormTitleField;
