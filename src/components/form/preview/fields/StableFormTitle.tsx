
import React from 'react';
import { useI18n } from '@/lib/i18n';

interface StableFormTitleProps {
  title: string;
  description?: string;
  backgroundColor?: string;
  textColor?: string;
  descriptionColor?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  fontSize?: string;
  descriptionFontSize?: string;
  borderRadius?: string;
  id?: string;
}

// Define valid box-sizing values
type BoxSizing = 'border-box' | 'content-box' | 'initial' | 'inherit';

// Helper function to ensure value ends with px unit
const ensurePixelUnit = (value: string | undefined): string => {
  if (!value) return '16px';
  
  // If just a number, add "px"
  if (!isNaN(Number(value))) {
    return `${value}px`;
  }
  
  // If ends with rem, convert to px
  if (value.endsWith('rem')) {
    const remValue = parseFloat(value);
    return `${Math.round(remValue * 16)}px`;
  }
  
  // If already ends with px, return as is
  if (value.endsWith('px')) {
    return value;
  }
  
  // In other cases, add px
  return `${value}px`;
};

// Use React.memo with deep comparison to prevent unnecessary re-renders
const StableFormTitle = React.memo(
  ({ 
    title, 
    description, 
    backgroundColor = '#9b87f5', 
    textColor = '#ffffff', 
    descriptionColor = 'rgba(255, 255, 255, 0.9)',
    textAlign,
    fontSize = '24px',
    descriptionFontSize = '14px',
    borderRadius = '8px',
    id = 'stable-form-title'
  }: StableFormTitleProps) => {
    const { language } = useI18n();
    
    // Get default alignment based on language if not specified
    const defaultAlignment = language === 'ar' ? 'right' : 'left';
    const alignment = textAlign || defaultAlignment;
    
    // Ensure font sizes are in pixels
    const titleSize = ensurePixelUnit(fontSize);
    const descSize = ensurePixelUnit(descriptionFontSize);

    // Background style with precise pixel values for spacing
    const backgroundStyle = {
      backgroundColor: backgroundColor,
      padding: '16px',
      borderRadius: borderRadius,
      width: '100%',
      boxSizing: 'border-box' as BoxSizing,
      marginBottom: '16px',
      textAlign: alignment as React.CSSProperties['textAlign'],
    };

    // Title styles with precise values
    const titleStyle = {
      color: textColor,
      fontSize: titleSize,
      textAlign: alignment as React.CSSProperties['textAlign'],
      fontWeight: 'bold' as const,
      margin: '0',
      padding: '0',
      lineHeight: '1.3',
      display: 'block',
    };

    // Description styles with precise values
    const descriptionStyle = {
      color: descriptionColor,
      fontSize: descSize,
      margin: '6px 0 0 0',
      padding: '0',
      textAlign: alignment as React.CSSProperties['textAlign'],
      fontWeight: 'normal' as const,
      lineHeight: '1.5',
      opacity: '0.9',
    };

    return (
      <div 
        id={id}
        className="mb-4 codform-title"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
        data-testid="title-field"
        data-title-align={alignment}
        data-has-bg="true"
        data-title-color={textColor}
        data-bg-color={backgroundColor}
        data-field-type="form-title"
        data-field-id={id}
        data-font-size={titleSize}
        data-font-weight="bold"
        data-desc-font-size={descSize}
        data-desc-color={descriptionColor}
        data-desc-font-weight='normal'
      >
        <div className="codform-title-container" style={backgroundStyle}>
          <h3 
            className="codform-form-title"
            style={titleStyle}
          >
            {title}
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
  },
  // Deep comparison function to prevent unnecessary re-renders
  (prevProps, nextProps) => {
    // Simple object equality check
    if (prevProps === nextProps) return true;
    
    // Compare important properties
    return (
      prevProps.title === nextProps.title &&
      prevProps.description === nextProps.description &&
      prevProps.backgroundColor === nextProps.backgroundColor &&
      prevProps.textColor === nextProps.textColor &&
      prevProps.descriptionColor === nextProps.descriptionColor &&
      prevProps.textAlign === nextProps.textAlign &&
      prevProps.fontSize === nextProps.fontSize &&
      prevProps.descriptionFontSize === nextProps.descriptionFontSize &&
      prevProps.borderRadius === nextProps.borderRadius
    );
  }
);

StableFormTitle.displayName = 'StableFormTitle';

export default StableFormTitle;
