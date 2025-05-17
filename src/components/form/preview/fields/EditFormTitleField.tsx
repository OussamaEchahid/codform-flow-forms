
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';

interface EditFormTitleFieldProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
  };
  formDirection?: 'ltr' | 'rtl';
}

// Define valid text alignment types
type TextAlign = 'left' | 'center' | 'right';
// Define valid direction options
type Direction = 'ltr' | 'rtl' | 'initial' | 'inherit';

const EditFormTitleField: React.FC<EditFormTitleFieldProps> = ({ field, formStyle, formDirection }) => {
  const { language } = useI18n();
  
  // Extract field style and other properties
  const fieldStyle = field.style || {};
  const description = field.helpText || '';
  
  // Get language-based direction or use formDirection if provided
  const textDirection = formDirection || (language === 'ar' ? 'rtl' : 'ltr');
  
  // Title alignment (default to center)
  const titleAlignment = fieldStyle.titleAlignment || 'center';
  
  // Description alignment (default to center)
  const descriptionAlignment = fieldStyle.descriptionAlignment || 'center';
  
  // Show description flag (default to true)
  const showDescription = fieldStyle.showDescription !== false;
  
  // Font sizes with consistent pixel values
  const titleFontSize = fieldStyle.fontSize || '24px';
  const descriptionFontSize = fieldStyle.descriptionFontSize || '14px';
  
  // Colors
  const backgroundColor = fieldStyle.backgroundColor || formStyle.primaryColor || '#9b87f5';
  const titleColor = fieldStyle.color || '#ffffff';
  const descriptionColor = fieldStyle.descriptionColor || '#ffffff';
  
  // Ensure consistent border radius
  const borderRadiusValue = formStyle.borderRadius || '0.5rem';
  
  // Set up container styles
  const containerStyle: React.CSSProperties = {
    backgroundColor,
    padding: '16px',
    borderRadius: borderRadiusValue,
    width: '100%',
    boxSizing: 'border-box',
    marginBottom: '16px',
    overflow: 'hidden',
    direction: textDirection as Direction,
  };
  
  // Set up title styles
  const titleStyle: React.CSSProperties = {
    color: titleColor,
    fontSize: titleFontSize,
    textAlign: titleAlignment as React.CSSProperties['textAlign'],
    fontWeight: fieldStyle.fontWeight || 'bold',
    fontFamily: fieldStyle.fontFamily || 'inherit',
    margin: '0',
    padding: '0',
    lineHeight: '1.3',
    display: 'block',
    width: '100%',
  };
  
  // Set up description styles
  const descriptionStyle: React.CSSProperties = {
    color: descriptionColor,
    fontSize: descriptionFontSize,
    margin: '6px 0 0 0',
    padding: '0',
    textAlign: descriptionAlignment as React.CSSProperties['textAlign'],
    fontFamily: fieldStyle.fontFamily || 'inherit',
    fontWeight: 'normal',
    lineHeight: '1.5',
    opacity: '0.9',
    width: '100%',
    display: showDescription ? 'block' : 'none',
  };
  
  // Create a unique ID for this field
  const fieldId = `edit-form-title-${field.id}`;
  
  // Log rendering for debugging
  console.log(`EditFormTitleField rendering: id=${fieldId}, bg=${backgroundColor}, direction=${textDirection}`);
  console.log(`Title styles:`, titleStyle);
  console.log(`Description styles:`, descriptionStyle);

  return (
    <div 
      id={fieldId}
      className="mb-4 edit-form-title-field"
      data-testid="edit-form-title-field"
      data-title-align={titleAlignment}
      data-has-description={showDescription.toString()}
      data-title-color={titleColor}
      data-bg-color={backgroundColor}
      data-field-type="edit-form-title"
      data-direction={textDirection}
      dir={textDirection}
    >
      <div className="codform-edit-title-container" style={containerStyle} dir={textDirection}>
        <h3 
          className="codform-edit-title"
          style={titleStyle}
        >
          {field.label}
        </h3>
        
        {showDescription && description && (
          <p 
            className="codform-edit-description"
            style={descriptionStyle}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default EditFormTitleField;
