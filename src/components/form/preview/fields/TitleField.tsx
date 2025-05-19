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
  direction?: 'ltr' | 'rtl'; // We accept direction but COMPLETELY ignore it for TitleField
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
  
  // IMPORTANT: Always use the text alignment directly from field style
  // This ensures title alignment is independent of form direction
  const textAlignment = style.textAlign || 'left';
  
  // Create new field with ensured style properties
  return {
    ...field,
    style: {
      ...style,
      backgroundColor: style.backgroundColor || '#9b87f5',
      color: style.color || '#ffffff',
      descriptionColor: style.descriptionColor || 'rgba(255, 255, 255, 0.9)',
      fontSize: style.fontSize || '24px',
      descriptionFontSize: style.descriptionFontSize || '14px',
      fontWeight: style.fontWeight || 'bold',
      textAlign: textAlignment // Always use field's own textAlign property
    }
  };
};

const TitleField: React.FC<TitleFieldProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  
  // Apply default settings to ensure consistency
  // CRITICAL: We COMPLETELY IGNORE the direction parameter
  const safeField = ensureStyleDefaults(field);
  const fieldStyle = safeField.style || {};
  
  // Extract description from the field
  const description = field.helpText || '';
  
  // Get text alignment directly from the field style, NEVER from form direction
  // This is critical to fix the alignment issue
  const alignment: TextAlign = (fieldStyle.textAlign as TextAlign) || 'left';
  
  // Use precise pixel values instead of rem for consistent sizing across environments
  const isFormTitle = field.type === 'form-title';
  
  // Set up font size with ensured px units
  let titleFontSize = isFormTitle ? '24px' : '20px'; // default value
  if (fieldStyle.fontSize) {
    // Ensure conversion of rem units to px and preserve px units
    titleFontSize = ensurePixelUnit(fieldStyle.fontSize);
  }
  
  // Set up description font size with ensured px units
  let descriptionFontSize = '14px'; // default value
  if (fieldStyle.descriptionFontSize) {
    descriptionFontSize = ensurePixelUnit(fieldStyle.descriptionFontSize);
  }
  
  // Get background color with default
  const backgroundColor = fieldStyle.backgroundColor || formStyle.primaryColor || '#9b87f5';
  
  // Determine direction based on the alignment NOT on the form direction
  // This ensures title keeps its own alignment regardless of form direction
  const titleDirection = alignment === 'right' ? 'rtl' : 
                        alignment === 'left' ? 'ltr' : 
                        alignment === 'center' ? 'ltr' : 'ltr';
  
  // Background style with precise pixel values for consistency
  const backgroundStyle = {
    backgroundColor: backgroundColor,
    padding: '16px', // precise values for consistency between preview and store
    borderRadius: formStyle.borderRadius || '8px',
    width: '100%',
    boxSizing: 'border-box' as BoxSizing,
    marginBottom: '16px', // precise values for consistency between preview and store
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
    lineHeight: '1.3', // consistent value
    display: 'block',
  };

  // Description styles
  const descriptionStyle = {
    color: fieldStyle.descriptionColor || 'rgba(255, 255, 255, 0.9)',
    fontSize: descriptionFontSize,
    margin: '6px 0 0 0', // precise value for consistency
    padding: '0',
    textAlign: alignment as React.CSSProperties['textAlign'],
    fontFamily: fieldStyle.fontFamily || 'inherit',
    fontWeight: 'normal',
    lineHeight: '1.5', // consistent value
    opacity: '0.9',
  };

  // Create unique id for this field
  const titleFieldId = `title-field-${field.id}-${Date.now()}`;

  return (
    <div 
      id={titleFieldId}
      className={`mb-4 ${isFormTitle ? 'codform-title' : ''}`}
      dir={titleDirection} // Use title's own direction based on alignment, NOT form direction
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
      data-ignore-form-direction="true" // Always ignore form direction
      data-title-direction={titleDirection} // Add this to track what direction we're using
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
