
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
}

// Define valid text alignment options
type TextAlign = 'left' | 'center' | 'right' | 'justify';
// Define valid box-sizing values
type BoxSizing = 'border-box' | 'content-box' | 'initial' | 'inherit';

const TitleField: React.FC<TitleFieldProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  // Extract the description from the field itself
  const description = field.helpText || '';
  
  // Get alignment from field style or default based on language
  const defaultAlignment: TextAlign = language === 'ar' ? 'right' : 'left';
  
  // Convert string alignment to TextAlign type with validation
  const getValidAlignment = (align?: string): TextAlign => {
    if (align === 'left' || align === 'center' || align === 'right' || align === 'justify') {
      return align as TextAlign;
    }
    return defaultAlignment;
  };
  
  const alignment = getValidAlignment(fieldStyle.textAlign);
  
  // Use exact pixel values instead of rem for consistent size across environments
  const isFormTitle = field.type === 'form-title';
  
  // Use consistent pixel values rather than rem to ensure exact size matching
  const fontSize = isFormTitle ? '24px' : '20px'; // 1.5rem = 24px, 1.25rem = 20px
  const descriptionFontSize = '14px'; // 0.875rem = 14px
  
  // Get background color with default
  const backgroundColor = fieldStyle.backgroundColor || '#9b87f5';
  
  // Background styling with fixed pixel values for padding
  const backgroundStyle = {
    backgroundColor: backgroundColor,
    padding: '16px', // Exact pixel value for consistent padding
    borderRadius: formStyle.borderRadius || '8px',
    width: '100%',
    boxSizing: 'border-box' as BoxSizing,
    marginBottom: '16px', // Consistent bottom margin
  };

  // Title styles
  const titleStyle = {
    color: fieldStyle.color || '#ffffff',
    fontSize: fieldStyle.fontSize || fontSize,
    textAlign: alignment,
    fontWeight: fieldStyle.fontWeight || (isFormTitle ? 'bold' : 'medium'),
    fontFamily: fieldStyle.fontFamily || 'inherit',
    margin: '0',
    padding: '0',
    lineHeight: '1.3', // Consistent line height
  };

  // Description styles
  const descriptionStyle = {
    color: fieldStyle.descriptionColor || '#ffffff',
    fontSize: fieldStyle.descriptionFontSize || descriptionFontSize,
    margin: '8px 0 0 0', // Consistent margins
    padding: '0',
    textAlign: alignment,
    fontFamily: fieldStyle.fontFamily || 'inherit',
    fontWeight: fieldStyle.descriptionFontWeight || 'normal',
    lineHeight: '1.5', // Consistent line height for description
  };

  return (
    <div 
      className={`mb-4 ${isFormTitle ? 'codform-title' : ''}`}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
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
      data-desc-font-weight={fieldStyle.descriptionFontWeight || 'normal'}
    >
      <div style={backgroundStyle} className="codform-title-container">
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
