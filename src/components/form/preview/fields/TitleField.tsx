
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';

interface TitleFieldProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
    buttonStyle?: string;
    direction?: 'ltr' | 'rtl';
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
  
  // Get alignment from field style or default based on direction
  const direction = formStyle.direction || (language === 'ar' ? 'rtl' : 'ltr');
  const defaultAlignment: TextAlign = direction === 'rtl' ? 'right' : 'left';
  
  // Convert string alignment to TextAlign type with validation
  const getValidAlignment = (align?: string): TextAlign => {
    if (align === 'left' || align === 'center' || align === 'right' || align === 'justify') {
      return align as TextAlign;
    }
    return defaultAlignment;
  };
  
  const alignment = getValidAlignment(fieldStyle.textAlign);
  
  // Background styling - Always use a background color for form-title type
  const backgroundColor = fieldStyle.backgroundColor || (field.type === 'form-title' ? '#9b87f5' : undefined);
  const backgroundStyle = backgroundColor ? {
    backgroundColor: backgroundColor,
    padding: '16px', // Explicitly use 16px for exact matching with store
    borderRadius: formStyle.borderRadius || '8px', // Use 8px as default for consistent rounding
    width: '100%',
    boxSizing: 'border-box' as BoxSizing,
    marginBottom: '0', // No bottom margin to match store display
  } : {};

  // Title styles
  const titleStyle = {
    color: fieldStyle.color || (backgroundColor ? '#ffffff' : '#1A1F2C'),
    fontSize: fieldStyle.fontSize || (field.type === 'form-title' ? '1.5rem' : formStyle.fontSize || '1.25rem'),
    textAlign: alignment,
    fontWeight: fieldStyle.fontWeight || (field.type === 'form-title' ? 'bold' : 'medium'),
    fontFamily: fieldStyle.fontFamily || 'inherit',
    margin: '0',
    padding: '0',
    lineHeight: '1.3',
  };

  // Description styles inside the same background container
  const descriptionStyle = {
    color: fieldStyle.descriptionColor || (backgroundColor ? '#ffffff' : '#6b7280'),
    fontSize: fieldStyle.descriptionFontSize || '0.875rem',
    margin: '8px 0 0 0', // Consistent 8px top margin
    padding: '0',
    textAlign: alignment,
    fontFamily: fieldStyle.fontFamily || 'inherit',
  };

  // Use larger styling for form-title type
  const isFormTitle = field.type === 'form-title';
  
  return (
    <div 
      className={`mb-4 ${isFormTitle ? 'codform-title' : ''}`}
      dir={direction}
      data-testid="title-field"
      data-title-align={alignment}
      data-has-bg={backgroundColor ? "true" : "false"}
      data-title-color={fieldStyle.color || (backgroundColor ? '#ffffff' : '#1A1F2C')}
      data-bg-color={backgroundColor || ""}
      data-font-family={fieldStyle.fontFamily || ''}
      data-field-type={field.type}
      data-font-size={fieldStyle.fontSize || (isFormTitle ? '1.5rem' : '1.25rem')}
    >
      <div style={backgroundStyle} className="codform-title-container">
        <h3 
          className={isFormTitle ? "text-2xl font-bold" : "text-lg font-medium"}
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
