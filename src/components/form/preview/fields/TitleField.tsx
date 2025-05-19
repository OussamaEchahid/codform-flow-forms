
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

// Helper function to convert rem units to px units
const convertRemToPx = (remValue: string): string => {
  if (remValue.endsWith('rem')) {
    // Extract the numeric value from rem
    const numValue = parseFloat(remValue.replace('rem', ''));
    // Convert rem to px (1rem = 16px typically)
    return `${Math.round(numValue * 16)}px`;
  }
  return remValue;
};

// Helper function to ensure value ends with px unit
const ensurePixelUnit = (value: string): string => {
  if (!value) return '';
  
  // If just a number, add "px"
  if (!isNaN(Number(value))) {
    return `${value}px`;
  }
  
  // If ends with rem, convert to px
  if (value.endsWith('rem')) {
    return convertRemToPx(value);
  }
  
  // If already ends with px, return as is
  if (value.endsWith('px')) {
    return value;
  }
  
  // In other cases, add px
  return `${value}px`;
};

// Use React.memo to prevent unnecessary re-renders
const TitleField: React.FC<TitleFieldProps> = React.memo(({ field, formStyle }) => {
  const { language } = useI18n();
  
  // Ensure field properties exist even if empty
  if (!field || !field.id) {
    console.error("Missing field properties in TitleField:", field);
    return null;
  }
  
  // Use available field style or create empty object
  const fieldStyle = field.style || {};
  
  // Extract description from field itself
  const description = field.helpText || '';
  
  // Get alignment from field style or default based on language
  const defaultAlignment: TextAlign = language === 'ar' ? 'right' : 'left';
  
  // Convert alignment string to TextAlign type with validation
  const getValidAlignment = (align?: string): TextAlign => {
    if (align === 'left' || align === 'center' || align === 'right' || align === 'justify') {
      return align as TextAlign;
    }
    return defaultAlignment;
  };
  
  const alignment = getValidAlignment(fieldStyle.textAlign);
  
  // Use precise pixel values instead of rem for consistent sizing across environments
  const isFormTitle = field.type === 'form-title';
  
  // Prepare font size with px units
  let titleFontSize = isFormTitle ? '24px' : '20px'; // Default value
  if (fieldStyle.fontSize) {
    // Ensure rem units are converted to px and px units are preserved
    titleFontSize = ensurePixelUnit(fieldStyle.fontSize);
  }
  
  // Prepare description font size with px units
  let descriptionFontSize = '14px'; // Default value
  if (fieldStyle.descriptionFontSize) {
    descriptionFontSize = ensurePixelUnit(fieldStyle.descriptionFontSize);
  }
  
  // Get background color with default
  const backgroundColor = fieldStyle.backgroundColor || formStyle.primaryColor || '#9b87f5';
  
  // Background style with precise pixel values for spacing
  const backgroundStyle = {
    backgroundColor: backgroundColor,
    padding: '16px', // Precise values for consistency between preview and store
    borderRadius: formStyle.borderRadius || '8px',
    width: '100%',
    boxSizing: 'border-box' as BoxSizing,
    marginBottom: '16px', // Precise values for consistency between preview and store
    textAlign: alignment as React.CSSProperties['textAlign'],
  };

  // Title styles
  const titleStyle = {
    color: fieldStyle.color || '#ffffff',
    fontSize: titleFontSize,
    textAlign: alignment as React.CSSProperties['textAlign'],
    fontWeight: fieldStyle.fontWeight || (isFormTitle ? 'bold' : 'medium'),
    fontFamily: fieldStyle.fontFamily || 'inherit',
    margin: '0',
    padding: '0',
    lineHeight: '1.3', // Consistent value
    display: 'block',
  };

  // Description styles
  const descriptionStyle = {
    color: fieldStyle.descriptionColor || 'rgba(255, 255, 255, 0.9)',
    fontSize: descriptionFontSize,
    margin: '6px 0 0 0', // Precise value for consistency
    padding: '0',
    textAlign: alignment as React.CSSProperties['textAlign'],
    fontFamily: fieldStyle.fontFamily || 'inherit',
    fontWeight: 'normal',
    lineHeight: '1.5', // Consistent value
    opacity: '0.9',
  };

  // Use stable field ID - critical for drag and drop operations
  const titleFieldId = `title-field-${field.id}`;

  return (
    <div 
      id={titleFieldId}
      className={`mb-4 ${isFormTitle ? 'codform-title' : ''}`}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      data-testid="title-field"
      data-title-align={alignment}
      data-has-bg="true"
      data-title-color={fieldStyle.color || '#ffffff'}
      data-bg-color={backgroundColor}
      data-font-family={fieldStyle.fontFamily || ''}
      data-field-type={field.type}
      data-field-id={field.id}
      data-font-size={titleFontSize}
      data-font-weight={fieldStyle.fontWeight || (isFormTitle ? 'bold' : 'medium')}
      data-desc-font-size={descriptionFontSize}
      data-desc-color={fieldStyle.descriptionColor || 'rgba(255, 255, 255, 0.9)'}
      data-desc-font-weight='normal'
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
});

TitleField.displayName = 'TitleField';

export default TitleField;
