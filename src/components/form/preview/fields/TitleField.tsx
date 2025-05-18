
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

// Define valid text alignment types
type TextAlign = 'left' | 'center' | 'right' | 'justify';
// Define valid box-sizing values
type BoxSizing = 'border-box' | 'content-box' | 'initial' | 'inherit';

// Convert rem to px for consistent styling
const remToPx = (value: string | undefined, defaultValue: string): string => {
  if (!value) return defaultValue;
  
  if (value.includes('rem')) {
    const remValue = parseFloat(value);
    return `${Math.round(remValue * 16)}px`;
  }
  
  if (!value.includes('px') && !isNaN(parseFloat(value))) {
    return `${value}px`;
  }
  
  return value;
};

const TitleField: React.FC<TitleFieldProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  // Get description from field
  const description = field.helpText || '';
  
  // Check if title and description should be shown
  const showTitle = fieldStyle.showTitle !== false;
  const showDescription = fieldStyle.showDescription !== false;
  
  // Set default alignment based on language
  const defaultAlignment: TextAlign = language === 'ar' ? 'right' : 'left';
  
  // Validate and get text alignment
  const getValidAlignment = (align?: string): TextAlign => {
    if (align === 'left' || align === 'center' || align === 'right' || align === 'justify') {
      return align as TextAlign;
    }
    return defaultAlignment;
  };
  
  const alignment = getValidAlignment(fieldStyle.textAlign);
  
  // Use precise px values instead of rem for consistent sizing
  const isFormTitle = field.type === 'form-title';
  
  // Use consistent px values instead of rem to ensure exact size matching
  const defaultTitleSize = isFormTitle ? '24px' : '20px';
  const defaultDescSize = '14px';
  
  // Convert all size values to pixels - extremely important for consistency
  const fontSize = remToPx(fieldStyle.fontSize, defaultTitleSize);
  const descriptionFontSize = remToPx(fieldStyle.descriptionFontSize, defaultDescSize);
  
  // Get background color with default
  const backgroundColor = fieldStyle.backgroundColor || formStyle.primaryColor || '#9b87f5';
  
  // Background style with fixed px padding
  const backgroundStyle = {
    backgroundColor: backgroundColor,
    padding: '16px', // Exact padding to match between preview and store
    borderRadius: formStyle.borderRadius || '8px',
    width: '100%',
    boxSizing: 'border-box' as BoxSizing,
    marginBottom: '16px', // Exact margin to match between preview and store
    textAlign: alignment as React.CSSProperties['textAlign'],
  };

  // Title styles
  const titleStyle = {
    color: fieldStyle.color || '#ffffff',
    fontSize: fontSize,
    textAlign: alignment as React.CSSProperties['textAlign'],
    fontWeight: fieldStyle.fontWeight || (isFormTitle ? 'bold' : 'medium'),
    fontFamily: fieldStyle.fontFamily || 'inherit',
    margin: '0',
    padding: '0',
    lineHeight: '1.3', // Consistent line height
    display: 'block',
  };

  // Description styles
  const descriptionStyle = {
    color: fieldStyle.descriptionColor || '#ffffff',
    fontSize: descriptionFontSize,
    margin: '6px 0 0 0', // Consistent margin
    padding: '0',
    textAlign: alignment as React.CSSProperties['textAlign'],
    fontFamily: fieldStyle.fontFamily || 'inherit',
    fontWeight: 'normal',
    lineHeight: '1.5', // Consistent line height
    opacity: '0.9',
  };

  // Create unique ID for this field - ensures field is updated on changes
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
      data-font-size={fontSize}
      data-font-weight={fieldStyle.fontWeight || (isFormTitle ? 'bold' : 'medium')}
      data-desc-font-size={descriptionFontSize}
      data-desc-color={fieldStyle.descriptionColor || '#ffffff'}
      data-desc-font-weight='normal'
      data-show-title={showTitle.toString()}
      data-show-description={showDescription.toString()}
    >
      <div 
        className="codform-title-container" 
        style={backgroundStyle}
      >
        {showTitle && (
          <h3 
            className={isFormTitle ? "codform-form-title" : ""}
            style={titleStyle}
          >
            {field.label}
          </h3>
        )}
        
        {showDescription && description && (
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
