
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
const TitleField: React.FC<TitleFieldProps> = ({
  field,
  formStyle,
  formDirection
}) => {
  const {
    language
  } = useI18n();
  const fieldStyle = field.style || {};

  // Extract description from the field itself
  const description = field.helpText || '';

  // Get language-based direction or use formDirection if provided
  const textDirection = formDirection || (language === 'ar' ? 'rtl' : 'ltr');

  // For title fields, force center alignment - critical for store consistency!
  const alignment = 'center';

  // Use precise pixel values instead of rem for consistent size across environments
  const isFormTitle = field.type === 'form-title';

  // Use consistent pixel values to ensure exact size match
  const fontSize = isFormTitle ? '24px' : '20px';
  const descriptionFontSize = '14px';

  // Get background color from field style, DO NOT override with formStyle.primaryColor to allow user selection
  // This is the key fix for the background color issue
  const backgroundColor = fieldStyle.backgroundColor || formStyle.primaryColor || '#9b87f5';
  console.log(`TitleField rendering: Background color = ${backgroundColor}, Field style =`, fieldStyle);

  // Use the same borderRadius value as in the store
  const borderRadiusValue = formStyle.borderRadius || '0.5rem';

  // Background style with consistent values for store and preview
  const backgroundStyle: React.CSSProperties = {
    backgroundColor: backgroundColor,
    padding: '16px',
    borderRadius: borderRadiusValue,
    width: '100%',
    boxSizing: 'border-box' as BoxSizing,
    marginBottom: '16px',
    textAlign: alignment as React.CSSProperties['textAlign'],
    display: 'block',
    overflow: 'hidden' // Ensure content doesn't overflow - critical for consistent appearance
  };

  // Title styles with zero margin to match preview
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
    width: '100%'
  };

  // Description styles with exactly 6px top margin to match preview
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
    display: 'block'
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
      <div className="title-field-container" style={backgroundStyle}>
        <h3 className="title-field-heading" style={titleStyle}>
          {field.label || 'Form Title'}
        </h3>
        
        {description && (
          <p className="title-field-description" style={descriptionStyle}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
};
export default TitleField;
