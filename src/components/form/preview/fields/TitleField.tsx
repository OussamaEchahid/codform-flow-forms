
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
  // If field already has a backgroundColor, use it; otherwise use #9b87f5
  const backgroundColor = fieldStyle.backgroundColor || '#9b87f5'; // Always have a background color
  const backgroundStyle = {
    backgroundColor: backgroundColor,
    padding: '1rem', // Increased padding for better spacing
    borderRadius: formStyle.borderRadius || '0.375rem',
    width: '100%',
    boxSizing: 'border-box' as BoxSizing,
    marginBottom: description ? '0' : '0.5rem', // No bottom margin if there's a description
  };

  // Description styles inside the same background container
  const descriptionStyle = {
    color: fieldStyle.descriptionColor || '#ffffff',
    fontSize: fieldStyle.descriptionFontSize || '0.875rem',
    margin: '0.5rem 0 0 0',
    padding: '0',
    textAlign: alignment,
  };

  // Use larger styling for form-title type
  const isFormTitle = field.type === 'form-title';
  
  return (
    <div 
      className={`mb-4 ${isFormTitle ? 'pt-2 pb-0 codform-title' : ''}`}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      data-testid="title-field"
      data-title-align={alignment}
      data-has-bg="true"
      data-title-color={fieldStyle.color || '#ffffff'}
      data-bg-color={backgroundColor}
      data-font-family={fieldStyle.fontFamily || ''}
      data-field-type={field.type}
    >
      <div style={backgroundStyle} className="codform-title-container">
        <h3 
          className={isFormTitle ? "text-2xl font-bold" : "text-lg font-medium"}
          style={{
            color: fieldStyle.color || '#ffffff', // Default to white text for contrast with background
            fontSize: fieldStyle.fontSize || (isFormTitle ? '1.5rem' : formStyle.fontSize),
            textAlign: alignment,
            fontWeight: fieldStyle.fontWeight || (isFormTitle ? 'bold' : 'medium'),
            fontFamily: fieldStyle.fontFamily || 'inherit',
            margin: '0',
            padding: '0',
          }}
        >
          {field.label}
        </h3>
        
        {description && (
          <p 
            className="text-sm mt-1 codform-title-description"
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
