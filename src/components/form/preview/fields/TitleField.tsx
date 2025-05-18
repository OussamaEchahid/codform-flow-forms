
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

// Convert rem units to px for exact store compatibility
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
  
  // Get description from field with default value
  const description = field.helpText || '';
  
  // Check if title and description should be shown
  const showTitle = fieldStyle.showTitle !== false;
  const showDescription = fieldStyle.showDescription !== false && !!description;
  
  // Set default alignment based on language
  const defaultAlignment = language === 'ar' ? 'right' : 'left';
  const alignment = fieldStyle.textAlign || defaultAlignment;
  
  // Use exact pixel values instead of rem for 100% size consistency
  const isFormTitle = field.type === 'form-title';
  const defaultTitleSize = isFormTitle ? '24px' : '20px';
  const defaultDescSize = '14px';
  
  // Convert all size values to pixels - critical for consistency
  const fontSize = remToPx(fieldStyle.fontSize, defaultTitleSize);
  const descriptionFontSize = remToPx(fieldStyle.descriptionFontSize, defaultDescSize);
  
  // Get background color with default value
  const backgroundColor = fieldStyle.backgroundColor || formStyle.primaryColor || '#9b87f5';

  // Use appropriate text alignment
  const contentDirection = language === 'ar' ? 'rtl' : 'ltr';
  
  // Important: Use !important on all style properties to override store styles
  const backgroundStyle: React.CSSProperties = {
    backgroundColor: `${backgroundColor} !important`,
    padding: '16px !important',
    borderRadius: `${formStyle.borderRadius || '8px'} !important`,
    width: '100% !important',
    boxSizing: 'border-box',
    marginBottom: '16px !important',
    textAlign: alignment as React.CSSProperties['textAlign'],
    direction: contentDirection as React.CSSProperties['direction'],
  };

  // Title styles with !important flags
  const titleStyle: React.CSSProperties = {
    color: `${fieldStyle.color || '#ffffff'} !important`,
    fontSize: `${fontSize} !important`,
    textAlign: `${alignment} !important` as React.CSSProperties['textAlign'],
    fontWeight: `${fieldStyle.fontWeight || (isFormTitle ? 'bold' : 'medium')} !important`,
    fontFamily: `${fieldStyle.fontFamily || 'inherit'} !important`,
    margin: '0 !important',
    padding: '0 !important',
    lineHeight: '1.3 !important',
    display: 'block !important',
    direction: contentDirection as React.CSSProperties['direction'],
  };

  // Description styles with !important flags
  const descriptionStyle: React.CSSProperties = {
    color: `${fieldStyle.descriptionColor || 'rgba(255, 255, 255, 0.9)'} !important`,
    fontSize: `${descriptionFontSize} !important`,
    margin: '6px 0 0 0 !important',
    padding: '0 !important',
    textAlign: `${alignment} !important` as React.CSSProperties['textAlign'],
    fontFamily: `${fieldStyle.fontFamily || 'inherit'} !important`,
    fontWeight: 'normal !important',
    lineHeight: '1.5 !important',
    opacity: '0.9 !important',
    direction: contentDirection as React.CSSProperties['direction'],
  };

  // Create unique id for this field to fix formatting issues
  const titleFieldId = `title-field-${field.id}`;

  console.log('TitleField rendering', { 
    id: field.id,
    backgroundColor,
    fieldType: field.type,
    fontSize,
    alignment,
    showTitle,
    showDescription,
    language,
    fieldStyle
  });

  return (
    <div 
      id={titleFieldId}
      className="mb-4 codform-title-field"
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
      data-desc-color={fieldStyle.descriptionColor || 'rgba(255, 255, 255, 0.9)'}
      data-desc-font-weight='normal'
      data-show-title={showTitle.toString()}
      data-show-description={showDescription.toString()}
      data-direction={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* <!-- بداية حقل العنوان --> */}
      <div 
        className="codform-title-container" 
        style={backgroundStyle}
      >
        {showTitle && (
          <h3 
            className={isFormTitle ? "codform-form-title" : "codform-section-title"}
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
      {/* <!-- نهاية حقل العنوان --> */}
    </div>
  );
};

export default TitleField;
