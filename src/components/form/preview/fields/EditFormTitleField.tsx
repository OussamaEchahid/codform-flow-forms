
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
  
  // Get text alignment - check for titleAlignment first, then fall back to textAlign
  const textAlign = field.style?.titleAlignment || field.style?.textAlign || 'center';
  const descriptionAlign = field.style?.descriptionAlignment || field.style?.textAlign || 'center';
  
  const fontWeight = field.style?.fontWeight || 'bold';
  const titleFontSize = field.style?.titleFontSize || '24px';
  const descriptionFontSize = field.style?.descriptionFontSize || '14px';
  const showDescription = field.style?.showDescription !== false;
  const showTitle = field.style?.showTitle !== false;
  
  if (!showTitle) {
    return null;
  }
  
  // Use formDirection from props or from field style or default to 'ltr'
  const direction = formDirection || field.style?.formDirection || 'ltr';
  
  // Use inline styles with !important to force the correct display
  const containerStyle: React.CSSProperties = {
    backgroundColor: `${backgroundColor} !important`,
    borderRadius: `${formStyle.borderRadius || '0.5rem'} !important`,
    padding: '0.75rem !important',
    direction,
    width: '100% !important',
    display: 'block !important',
    boxSizing: 'border-box' as 'border-box',
    margin: '0.5rem 0 !important',
    overflow: 'hidden !important'
  };
  
  const titleStyle = {
    color: `${textColor} !important`,
    textAlign: textAlign as any,
    fontWeight: fontWeight as any,
    fontSize: titleFontSize,
    margin: '0 !important',
    padding: '0 !important',
    lineHeight: '1.3 !important',
    width: '100% !important',
    display: 'block !important'
  };
  
  const descriptionStyle = {
    color: `${descriptionColor} !important`,
    textAlign: descriptionAlign as any,
    fontSize: descriptionFontSize,
    margin: '0.25rem 0 0 0 !important',
    width: '100% !important',
    display: 'block !important'
  };
  
  return (
    <div
      className="form-title-field w-full my-2"
      style={containerStyle}
      dir={direction}
      data-form-direction={direction}
      data-field-type="edit-form-title"
      data-testid="edit-form-title-field"
      data-background-color={backgroundColor}
    >
      <h2 style={titleStyle}>
        {field.label}
      </h2>
      
      {showDescription && field.helpText && (
        <p style={descriptionStyle}>
          {field.helpText}
        </p>
      )}
    </div>
  );
};

export default EditFormTitleField;
