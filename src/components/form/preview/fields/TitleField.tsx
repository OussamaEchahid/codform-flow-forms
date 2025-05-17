
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';

interface TitleFieldProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
  };
  formDirection?: 'ltr' | 'rtl';
}

// Define valid text alignment options
type TextAlign = 'left' | 'center' | 'right' | 'justify';
// Define valid box-sizing options
type BoxSizing = 'border-box' | 'content-box' | 'initial' | 'inherit';
// Define valid direction options for TypeScript CSSProperties
type Direction = 'ltr' | 'rtl' | 'initial' | 'inherit';

const TitleField: React.FC<TitleFieldProps> = ({ field, formStyle, formDirection }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  // Extract description from the field itself
  const description = field.helpText || '';
  
  // Get language-based direction or use formDirection if provided
  const textDirection = formDirection || (language === 'ar' ? 'rtl' : 'ltr');
  
  // Always use center alignment for title fields
  const alignment: TextAlign = 'center';
  
  // Use precise pixel values instead of rem for consistent size across environments
  const isFormTitle = field.type === 'form-title';
  
  // Use consistent pixel values to ensure exact size match
  const fontSize = isFormTitle ? '24px' : '20px'; 
  const descriptionFontSize = '14px';
  
  // Ensure we always have a consistent background color
  // Default to purple (#9b87f5) if no backgroundColor or primaryColor is defined
  const backgroundColor = fieldStyle.backgroundColor || formStyle.primaryColor || '#9b87f5';
  
  // Background style with fixed pixel values for padding
  const backgroundStyle: React.CSSProperties = {
    backgroundColor: backgroundColor,
    padding: '16px',
    borderRadius: formStyle.borderRadius || '8px',
    width: '100%',
    boxSizing: 'border-box' as BoxSizing,
    marginBottom: '16px',
    textAlign: alignment as React.CSSProperties['textAlign'],
    display: 'block',
  };

  // Title styles
  const titleStyle: React.CSSProperties = {
    color: fieldStyle.color || '#ffffff',
    fontSize: fieldStyle.fontSize || fontSize,
    textAlign: alignment as React.CSSProperties['textAlign'],
    fontWeight: fieldStyle.fontWeight || (isFormTitle ? 'bold' : 'medium'),
    fontFamily: fieldStyle.fontFamily || 'inherit',
    margin: '0',
    padding: '0',
    lineHeight: '1.3',
    display: 'block',
    direction: textDirection as Direction,
    width: '100%',
  };

  // Description styles
  const descriptionStyle: React.CSSProperties = {
    color: fieldStyle.descriptionColor || '#ffffff',
    fontSize: fieldStyle.descriptionFontSize || descriptionFontSize,
    margin: '6px 0 0 0',
    padding: '0',
    textAlign: alignment as React.CSSProperties['textAlign'],
    fontFamily: fieldStyle.fontFamily || 'inherit',
    fontWeight: 'normal',
    lineHeight: '1.5',
    opacity: '0.9',
    direction: textDirection as Direction,
    width: '100%',
    display: 'block',
  };

  // Create a unique ID for this field to avoid conflicts
  const titleFieldId = `title-field-${field.id}`;

  return (
    <div 
      id={titleFieldId}
      className={`mb-4 ${isFormTitle ? 'codform-title' : ''}`}
      data-testid="title-field"
      data-title-align={alignment}
      data-has-bg="true"
      data-title-color={fieldStyle.color || '#ffffff'}
      data-bg-color={backgroundColor}
      data-field-type={field.type}
      data-direction={textDirection}
      dir={textDirection}
    >
      <div className="codform-title-container" style={backgroundStyle} dir={textDirection}>
        <h3 
          className={isFormTitle ? "codform-form-title" : ""}
          style={titleStyle}
          dir={textDirection}
        >
          {field.label}
        </h3>
        
        {description && (
          <p 
            className="codform-title-description"
            style={descriptionStyle}
            dir={textDirection}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default TitleField;
