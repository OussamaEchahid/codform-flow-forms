
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';

interface FormTitleFieldProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
    buttonStyle?: string;
  };
}

const FormTitleField: React.FC<FormTitleFieldProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  
  // Extract style properties or use defaults, prioritizing field-specific styles
  const styles = field.style || {};
  
  // IMPORTANT: First check field's specific backgroundColor, THEN fall back to primaryColor
  const backgroundColor = styles.backgroundColor || formStyle.primaryColor || '#9b87f5';
  
  // Extract all other style properties with fallbacks
  const {
    color = '#ffffff',
    textAlign = language === 'ar' ? 'right' : 'center',
    fontSize = '24px',
    fontWeight = 'bold',
    descriptionColor = 'rgba(255, 255, 255, 0.9)',
    descriptionFontSize = '14px',
    borderRadius = formStyle.borderRadius || '8px',
    paddingY = '16px',
    borderColor,
    borderWidth
  } = styles;

  // Explicitly handle boolean values with default true if undefined
  const showTitle = styles.showTitle !== false;
  const showDescription = styles.showDescription !== false;

  // If both title and description are hidden, don't render anything
  if (showTitle === false && showDescription === false) {
    // Return a hidden placeholder instead of null to maintain DOM structure
    return (
      <div 
        className="form-title-container hidden" 
        style={{ 
          height: 0, 
          overflow: 'hidden', 
          margin: 0, 
          padding: 0 
        }}
        data-field-type="form-title"
        data-field-id={field.id}
        data-show-title="false"
        data-show-description="false"
        data-title-hidden="true"
      />
    );
  }
  
  // Store styling properties in data attributes for debugging and consistency
  const dataAttributes = {
    'data-field-type': 'form-title',
    'data-field-id': field.id,
    'data-bg-color': backgroundColor,
    'data-border-radius': borderRadius,
    'data-padding-y': paddingY,
    'data-show-title': showTitle ? 'true' : 'false',
    'data-show-description': showDescription ? 'true' : 'false',
    'data-has-border': (borderWidth && borderColor) ? 'true' : 'false',
    'data-vertical-padding': paddingY || '16px',
    'data-style-properties': JSON.stringify({
      backgroundColor, color, textAlign, fontSize, fontWeight,
      descriptionColor, descriptionFontSize, borderRadius, paddingY,
      showTitle, showDescription
    })
  };

  return (
    <div 
      className="form-title-container mb-6" 
      style={{
        backgroundColor,
        borderRadius,
        padding: `${paddingY} 16px`,
        marginTop: '0',
        textAlign: textAlign as any,
        border: borderWidth ? `${borderWidth} solid ${borderColor || 'transparent'}` : undefined,
      }}
      {...dataAttributes}
    >
      {showTitle && (
        <h1 
          style={{
            color,
            fontSize,
            fontWeight,
            margin: '0',
            padding: '0'
          }}
        >
          {field.label || ''}
        </h1>
      )}
      
      {showDescription && field.helpText && (
        <p 
          style={{
            color: descriptionColor,
            fontSize: descriptionFontSize,
            margin: (showTitle ? '8px 0 0 0' : '0'),
            padding: '0'
          }}
        >
          {field.helpText}
        </p>
      )}
    </div>
  );
};

// Use React.memo with custom comparison to prevent unnecessary re-renders
export default React.memo(FormTitleField);
