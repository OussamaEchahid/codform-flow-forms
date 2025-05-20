
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

// Helper function to ensure value ends with px unit
const ensurePixelUnit = (value: string): string => {
  if (!value) return '';
  
  // If just a number, add "px"
  if (!isNaN(Number(value))) {
    return `${value}px`;
  }
  
  // If ends with rem, convert to px
  if (value.endsWith('rem')) {
    return `${Math.round(parseFloat(value.replace('rem', '')) * 16)}px`;
  }
  
  // If already ends with px, return as is
  if (value.endsWith('px')) {
    return value;
  }
  
  // In other cases, add px
  return `${value}px`;
};

// Use React.memo with deep comparison to prevent unnecessary re-renders
const TitleField = React.memo(
  ({ field, formStyle }: TitleFieldProps) => {
    const { language } = useI18n();

    // Create defensive copies of objects to prevent mutation issues
    const safeField = React.useMemo(() => {
      return {
        ...field,
        id: field.id || `title-${Math.random().toString(36).substr(2, 9)}`,
        style: field.style ? { ...field.style } : {}
      };
    }, [field]);
    
    const safeStyle = React.useMemo(() => {
      return { ...formStyle };
    }, [formStyle]);
    
    // Ensure field properties exist even if empty
    if (!safeField || !safeField.id) {
      console.error("Missing field properties in TitleField:", field);
      return null;
    }
    
    // Extract description from field itself
    const description = safeField.helpText || '';
    
    // Get alignment from field style or default based on language
    const defaultAlignment: TextAlign = language === 'ar' ? 'right' : 'left';
    
    // Convert alignment string to TextAlign type with validation
    const getValidAlignment = (align?: string): TextAlign => {
      if (align === 'left' || align === 'center' || align === 'right' || align === 'justify') {
        return align as TextAlign;
      }
      return defaultAlignment;
    };
    
    // IMPORTANT: Ensure we have a proper style object even if none is provided
    const fieldStyle = safeField.style || {};
    
    const alignment = getValidAlignment(fieldStyle.textAlign);
    
    // Use precise pixel values instead of rem for consistent sizing across environments
    const isFormTitle = safeField.type === 'form-title';
    
    // Prepare font size with px units - ensure we use field values if available
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
    
    // IMPORTANT: Always use the field's backgroundColor if available, otherwise use formStyle
    const backgroundColor = fieldStyle.backgroundColor || safeStyle.primaryColor || '#9b87f5';
    
    // Background style with precise pixel values for spacing
    const backgroundStyle = {
      backgroundColor: backgroundColor,
      padding: '16px', // Precise values for consistency between preview and store
      borderRadius: safeStyle.borderRadius || '8px',
      width: '100%',
      boxSizing: 'border-box' as BoxSizing,
      marginBottom: '16px', // Precise values for consistency between preview and store
      textAlign: alignment as React.CSSProperties['textAlign'],
    };

    // Title styles - use field values as priority
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

    // Description styles - use field values as priority
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
    const titleFieldId = `title-field-${safeField.id}`;

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
        data-field-type={safeField.type}
        data-field-id={safeField.id}
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
            {safeField.label}
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
  // Deep comparison function for React.memo to prevent unnecessary re-renders
  (prevProps, nextProps) => {
    // Simple check for object equality
    if (prevProps === nextProps) return true;
    
    // Check if IDs match - critical for stability during drag operations
    if (prevProps.field.id !== nextProps.field.id) return false;
    
    // Check if label or helpText changed
    if (prevProps.field.label !== nextProps.field.label) return false;
    if (prevProps.field.helpText !== nextProps.field.helpText) return false;
    
    // Check styles (deep comparison of important properties)
    const prevStyle = prevProps.field.style || {};
    const nextStyle = nextProps.field.style || {};
    
    // Compare important style properties
    const styleKeys = [
      'textAlign', 'color', 'backgroundColor', 'fontSize', 
      'fontWeight', 'descriptionColor', 'descriptionFontSize'
    ];
    
    for (const key of styleKeys) {
      if (prevStyle[key] !== nextStyle[key]) {
        return false;
      }
    }
    
    // Check form style (mainly for default values)
    if (prevProps.formStyle?.primaryColor !== nextProps.formStyle?.primaryColor) return false;
    if (prevProps.formStyle?.borderRadius !== nextProps.formStyle?.borderRadius) return false;
    
    // If we get here, the components are effectively equal
    return true;
  }
);

TitleField.displayName = 'TitleField';

export default TitleField;
