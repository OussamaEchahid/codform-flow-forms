
import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { FormField, FloatingButtonConfig } from '@/lib/form-utils';
import FormFieldComponent from './preview/FormField';
import FloatingButton from './preview/FloatingButton';

interface FormPreviewProps {
  formTitle: string;
  formDescription?: string;
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
  formStyle?: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
    buttonStyle?: string;
  };
  fields?: FormField[];
  hideHeader?: boolean;
  floatingButton?: FloatingButtonConfig;
  hideFloatingButtonPreview?: boolean;
}

const FormPreview: React.FC<FormPreviewProps> = ({
  formTitle,
  formDescription,
  currentStep,
  totalSteps,
  children,
  formStyle = {
    primaryColor: '#9b87f5',
    borderRadius: '0.5rem',
    fontSize: '16px',
    buttonStyle: 'rounded',
  },
  fields = [],
  hideHeader = false,
  floatingButton,
  hideFloatingButtonPreview = false,
}) => {
  const { language } = useI18n();
  
  // Process fields for display
  const sanitizedFields = useMemo(() => {
    // First, check if form-title exists
    const hasTitleField = fields.some(field => field.type === 'form-title');
    let processedFields = [...fields];
    
    // If there's no form title field and it's not hidden, add one
    if (!hasTitleField && !hideHeader) {
      const titleField: FormField = {
        type: 'form-title',
        id: `form-title-preview`,
        label: formTitle,
        helpText: formDescription,
        style: {
          backgroundColor: formStyle.primaryColor || '#9b87f5',
          color: '#ffffff',
          textAlign: language === 'ar' ? 'right' : 'center',
          fontSize: '24px',
          fontWeight: 'bold',
          descriptionColor: 'rgba(255, 255, 255, 0.9)',
          descriptionFontSize: '14px'
        },
      };
      
      // Add title field at the beginning
      processedFields = [titleField, ...processedFields];
    } 
    // Update existing title with current values if they differ
    else if (hasTitleField) {
      processedFields = processedFields.map(field => {
        if (field.type === 'form-title') {
          return {
            ...field,
            label: field.label || formTitle,
            helpText: field.helpText || formDescription
          };
        }
        return field;
      });
    }
    
    // Update fields with default values
    const updatedFields = processedFields.map(field => {
      const updatedField = { ...field };
      
      // Set empty label for cart items and summary
      if ((field.type === 'cart-items' || field.type === 'cart-summary') && field.label === undefined) {
        updatedField.label = '';
      }
      
      // Handle icon properties
      if (field.icon === '') {
        updatedField.icon = 'none';
      }
      
      // Ensure style.showIcon is defined if icon exists
      if (field.icon && field.icon !== 'none') {
        if (!updatedField.style) {
          updatedField.style = {};
        }
        
        updatedField.style.showIcon = updatedField.style?.showIcon !== undefined 
          ? updatedField.style.showIcon 
          : true;
      }
      
      // Ensure basic style properties exist
      if (!updatedField.style) {
        updatedField.style = {};
      }

      // Special handling for form-title fields
      if (field.type === 'form-title') {
        if (!updatedField.style.backgroundColor) {
          updatedField.style.backgroundColor = formStyle.primaryColor || '#9b87f5';
        }
        if (!updatedField.style.color) {
          updatedField.style.color = '#ffffff';
        }
        if (!updatedField.style.descriptionColor) {
          updatedField.style.descriptionColor = 'rgba(255, 255, 255, 0.9)';
        }
      }
      
      // Normalize font sizes to pixels
      if (updatedField.style.fontSize && !updatedField.style.fontSize.includes('px')) {
        if (updatedField.style.fontSize.includes('rem')) {
          const remValue = parseFloat(updatedField.style.fontSize);
          updatedField.style.fontSize = `${remValue * 16}px`;
        } else if (!isNaN(parseFloat(updatedField.style.fontSize))) {
          updatedField.style.fontSize = `${updatedField.style.fontSize}px`;
        }
      }
      
      // Normalize label font size
      if (updatedField.style.labelFontSize && !updatedField.style.labelFontSize.includes('px')) {
        if (updatedField.style.labelFontSize.includes('rem')) {
          const remValue = parseFloat(updatedField.style.labelFontSize);
          updatedField.style.labelFontSize = `${remValue * 16}px`;
        } else if (!isNaN(parseFloat(updatedField.style.labelFontSize))) {
          updatedField.style.labelFontSize = `${updatedField.style.labelFontSize}px`;
        }
      } else if (!updatedField.style.labelFontSize) {
        updatedField.style.labelFontSize = '16px';
      }
      
      return updatedField;
    });
    
    // Check if there is already a submit button
    const hasSubmitButton = updatedFields.some(field => field.type === 'submit');
    
    let result = [...updatedFields];
    
    // Add default submit button if needed
    if (!hasSubmitButton) {
      const submitButton: FormField = {
        type: 'submit',
        id: `submit-stable`,
        label: language === 'ar' ? 'إرسال الطلب' : 'Submit Order',
        style: {
          backgroundColor: formStyle.primaryColor || '#9b87f5',
          color: '#ffffff',
          fontSize: '18px',
          animation: true,
          animationType: 'pulse',
        },
      };
      result.push(submitButton);
    }
    
    return result;
  }, [fields, language, formStyle.primaryColor, formTitle, formDescription, hideHeader]);
  
  return (
    <div 
      className="rounded-lg border shadow-sm overflow-hidden bg-white codform-form"
      style={{
        fontSize: formStyle.fontSize,
        '--form-primary-color': formStyle.primaryColor,
        borderRadius: formStyle.borderRadius,
        backgroundColor: '#f5f5f5',
        padding: '20px',
      } as React.CSSProperties}
      data-form-preview-id="form-preview-stable"
      data-primary-color={formStyle.primaryColor}
      data-border-radius={formStyle.borderRadius}
      data-font-size={formStyle.fontSize}
      data-button-style={formStyle.buttonStyle}
    >
      {totalSteps > 1 && (
        <div className="px-4 py-2 bg-gray-50">
          <div className="flex items-center">
            <div className="flex-1 flex">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className="flex-1 flex items-center">
                  <div 
                    className={cn(
                      "h-2 flex-1",
                      i < currentStep ? "bg-[var(--form-primary-color)]" : "bg-gray-200"
                    )}
                  ></div>
                  <div 
                    className={cn(
                      "rounded-full h-5 w-5 flex items-center justify-center text-xs font-medium",
                      i + 1 === currentStep 
                        ? "bg-[var(--form-primary-color)] text-white" 
                        : i < currentStep 
                          ? "bg-[var(--form-primary-color)] text-white"
                          : "bg-gray-200 text-gray-600"
                    )}
                  >
                    {i + 1}
                  </div>
                  {i < totalSteps - 1 && (
                    <div 
                      className={cn(
                        "h-2 flex-1",
                        i + 1 < currentStep ? "bg-[var(--form-primary-color)]" : "bg-gray-200"
                      )}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div 
        className="codform-form-content" 
        style={{
          direction: language === 'ar' ? 'rtl' : 'ltr',
          padding: '0',
        }}
        data-direction={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {sanitizedFields.length > 0 ? (
          <div className="space-y-4">
            {sanitizedFields.map(field => (
              <FormFieldComponent 
                key={field.id} 
                field={field} 
                formStyle={formStyle}
              />
            ))}
          </div>
        ) : (
          children
        )}
      </div>

      {/* Show floating button if enabled and not hidden */}
      {floatingButton && floatingButton.enabled && !hideFloatingButtonPreview && (
        <FloatingButton config={floatingButton} isPreview={true} />
      )}
    </div>
  );
};

export default React.memo(FormPreview);
