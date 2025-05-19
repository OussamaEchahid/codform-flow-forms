
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

// Helper function to convert rem units to px units for consistency
const convertRemToPx = (remValue: string): string => {
  if (remValue.endsWith('rem')) {
    // Extract numeric value from rem
    const numValue = parseFloat(remValue.replace('rem', ''));
    // Convert rem to px (1rem = 16px typically)
    return `${Math.round(numValue * 16)}px`;
  }
  return remValue;
};

// Helper function to ensure value ends with px
const ensurePixelUnit = (value: string): string => {
  if (!value) return '';
  
  // If it's just a number, add "px"
  if (!isNaN(Number(value))) {
    return `${value}px`;
  }
  
  // If it ends with rem, convert to px
  if (value.endsWith('rem')) {
    return convertRemToPx(value);
  }
  
  // If it already ends with px, return as is
  if (value.endsWith('px')) {
    return value;
  }
  
  // In other cases, add px
  return `${value}px`;
};

// Helper function to ensure we always have consistent style properties
const ensureStyleDefaults = (field: FormField): FormField => {
  const style = field.style || {};
  
  // Create a new field with ensured style properties
  return {
    ...field,
    style: {
      ...style,
      backgroundColor: style.backgroundColor || '#9b87f5',
      color: style.color || '#ffffff',
      descriptionColor: style.descriptionColor || 'rgba(255, 255, 255, 0.9)',
      fontSize: style.fontSize || '24px',
      descriptionFontSize: style.descriptionFontSize || '14px',
      fontWeight: style.fontWeight || 'bold'
    }
  };
};

const TitleField: React.FC<TitleFieldProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  
  // Apply style defaults to ensure consistency
  const safeField = ensureStyleDefaults(field);
  const fieldStyle = safeField.style || {};
  
  // Extract description from the field
  const description = field.helpText || '';
  
  // Get text alignment based on field style or default based on language
  const defaultAlignment: TextAlign = language === 'ar' ? 'right' : 'left';
  
  // Convert string alignment to TextAlign type with validation
  const getValidAlignment = (align?: string): TextAlign => {
    if (align === 'left' || align === 'center' || align === 'right' || align === 'justify') {
      return align as TextAlign;
    }
    return defaultAlignment;
  };
  
  const alignment = getValidAlignment(fieldStyle.textAlign);
  
  // Use precise pixel values instead of rem for consistent sizing across environments
  const isFormTitle = field.type === 'form-title';
  
  // Prepare font size ensuring px units
  let titleFontSize = isFormTitle ? '24px' : '20px'; // Default value
  if (fieldStyle.fontSize) {
    // Ensure rem units are converted to px and px units are preserved
    titleFontSize = ensurePixelUnit(fieldStyle.fontSize);
  }
  
  // Prepare description font size ensuring px units
  let descriptionFontSize = '14px'; // Default value
  if (fieldStyle.descriptionFontSize) {
    descriptionFontSize = ensurePixelUnit(fieldStyle.descriptionFontSize);
  }
  
  // Get background color with default
  const backgroundColor = fieldStyle.backgroundColor || formStyle.primaryColor || '#9b87f5';
  
  // Background style with fixed pixel values for padding
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

  // Create unique ID for this field
  const titleFieldId = `title-field-${field.id}-${Date.now()}`;

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
};

export default TitleField;
