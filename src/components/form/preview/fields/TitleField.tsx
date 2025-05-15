
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
  
  // Background styling - Always use a background color for form-title type
  const backgroundColor = fieldStyle.backgroundColor || '#9b87f5'; // Always have a background color
  const backgroundStyle = {
    backgroundColor: backgroundColor,
    padding: '16px', // Explicitly use 16px for exact matching with store
    borderRadius: formStyle.borderRadius || '8px', // Use 8px as default for consistent rounding
    width: '100%',
    boxSizing: 'border-box' as BoxSizing,
    marginBottom: '0', // No bottom margin to match store display
  };

  // Use larger styling for form-title type
  const isFormTitle = field.type === 'form-title';
  
  // Determine font size for title - Make sure it's stored correctly for store rendering
  const fontSize = fieldStyle.fontSize || (isFormTitle ? '1.5rem' : '1.25rem');
  const fontWeight = fieldStyle.fontWeight || (isFormTitle ? 'bold' : 'medium');
  
  // Description styles inside the same background container
  const descriptionStyle = {
    color: fieldStyle.descriptionColor || '#ffffff',
    fontSize: fieldStyle.descriptionFontSize || '0.875rem',
    margin: '8px 0 0 0', // Consistent 8px top margin
    padding: '0',
    textAlign: alignment,
    fontFamily: fieldStyle.fontFamily || 'inherit',
    fontWeight: fieldStyle.descriptionFontWeight || 'normal',
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
      data-font-size={fontSize}
      data-font-weight={fontWeight}
      data-desc-font-size={fieldStyle.descriptionFontSize || '0.875rem'}
      data-desc-font-weight={fieldStyle.descriptionFontWeight || 'normal'}
    >
      <div style={backgroundStyle} className="codform-title-container">
        <h3 
          className={isFormTitle ? "text-2xl" : "text-lg"}
          style={{
            color: fieldStyle.color || '#ffffff', // Default to white text for contrast with background
            fontSize: fontSize,
            textAlign: alignment,
            fontWeight: fontWeight,
            fontFamily: fieldStyle.fontFamily || 'inherit',
            margin: '0',
            padding: '0',
            lineHeight: '1.3', // Add line height for better text appearance
          }}
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
