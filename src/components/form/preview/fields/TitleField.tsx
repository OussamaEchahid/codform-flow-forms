
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

const TitleField: React.FC<TitleFieldProps> = ({ field, formStyle, formDirection }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  // Extract description from the field itself
  const description = field.helpText || '';
  
  // Get language-based direction (ignoring formDirection as titles always have fixed alignment)
  const textDirection = language === 'ar' ? 'rtl' : 'ltr';
  
  // Force center alignment for title regardless of direction
  const alignment: TextAlign = 'center';
  
  // Use precise pixel values instead of rem for consistent size across environments
  const isFormTitle = field.type === 'form-title';
  
  // Use consistent pixel values instead of rem to ensure exact size match
  const fontSize = isFormTitle ? '24px' : '20px'; 
  const descriptionFontSize = '14px';
  
  // CRITICAL FIX: ENSURE WE ALWAYS HAVE A PURPLE BACKGROUND
  // Default to purple (#9b87f5) if no backgroundColor or primaryColor is defined
  const backgroundColor = fieldStyle.backgroundColor || formStyle.primaryColor || '#9b87f5';
  
  // Background style with fixed pixel values for padding - add !important to ensure application
  const backgroundStyle = {
    backgroundColor: `${backgroundColor} !important`,
    padding: '16px !important', // Exact padding to match between preview and store
    borderRadius: `${formStyle.borderRadius || '8px'} !important`,
    width: '100% !important',
    boxSizing: 'border-box' as BoxSizing,
    marginBottom: '16px !important', // Exact margin to match between preview and store
    textAlign: alignment as React.CSSProperties['textAlign'],
    display: 'block !important', // Ensure block display
  };

  // Title styles
  const titleStyle = {
    color: `${fieldStyle.color || '#ffffff'} !important`,
    fontSize: `${fieldStyle.fontSize || fontSize} !important`,
    textAlign: alignment as React.CSSProperties['textAlign'],
    fontWeight: fieldStyle.fontWeight || (isFormTitle ? 'bold' : 'medium'),
    fontFamily: fieldStyle.fontFamily || 'inherit',
    margin: '0 !important',
    padding: '0 !important',
    lineHeight: '1.3 !important', // Consistent line height
    display: 'block !important',
    direction: textDirection,
  };

  // Description styles
  const descriptionStyle = {
    color: `${fieldStyle.descriptionColor || '#ffffff'} !important`,
    fontSize: `${fieldStyle.descriptionFontSize || descriptionFontSize} !important`,
    margin: '6px 0 0 0 !important', // Consistent margin
    padding: '0 !important',
    textAlign: alignment as React.CSSProperties['textAlign'],
    fontFamily: fieldStyle.fontFamily || 'inherit',
    fontWeight: 'normal !important',
    lineHeight: '1.5 !important', // Consistent line height
    opacity: '0.9 !important',
    direction: textDirection,
  };

  // Create a unique ID for this field
  const titleFieldId = `title-field-${field.id}-${Date.now()}`;

  return (
    <div 
      id={titleFieldId}
      className={`mb-4 ${isFormTitle ? 'codform-title' : ''}`}
      data-testid="title-field"
      data-title-align={alignment}
      data-has-bg="true"
      data-title-color={fieldStyle.color || '#ffffff'}
      data-bg-color={backgroundColor}
      data-font-family={fieldStyle.fontFamily || ''}
      data-field-type={field.type}
      data-font-size={fieldStyle.fontSize || fontSize}
      data-font-weight={fieldStyle.fontWeight || (isFormTitle ? 'bold' : 'medium')}
      data-desc-font-size={fieldStyle.descriptionFontSize || descriptionFontSize}
      data-desc-font-weight='normal'
      data-direction={textDirection}
    >
      <div className="codform-title-container" style={backgroundStyle}>
        <h3 
          className={isFormTitle ? "codform-form-title" : ""}
          style={titleStyle}
        >
          {field.label}
        </h3>
        
        {description && (
          <p 
            className="codform-title-description"
            style={descriptionStyle}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default TitleField;
