
import React, { useState } from 'react';
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
  direction?: 'ltr' | 'rtl'; // Direction prop for form
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
  direction = 'ltr', // Default direction is left-to-right
}) => {
  const { language } = useI18n();
  
  // Improved field processing logic
  const sanitizedFields = React.useMemo(() => {
    // Process fields to ensure consistent properties
    const updatedFields = fields.map(field => {
      // Copy the field to avoid direct mutation
      const updatedField = { ...field };
      
      // Set default empty label for cart items and summary
      if ((field.type === 'cart-items' || field.type === 'cart-summary') && field.label === undefined) {
        updatedField.label = '';
      }
      
      // Convert empty icon to 'none' for consistent handling
      if (field.icon === '') {
        updatedField.icon = 'none';
      }
      
      // Ensure style.showIcon is defined if icon exists
      if (field.icon && field.icon !== 'none') {
        if (!updatedField.style) {
          updatedField.style = {};
        }
        
        // Set showIcon to true by default if icon exists and not explicitly set to false
        updatedField.style.showIcon = updatedField.style?.showIcon !== undefined 
          ? updatedField.style.showIcon 
          : true;
      }
      
      // Ensure basic style properties exist
      if (!updatedField.style) {
        updatedField.style = {};
      }
      
      // Ensure font size is explicitly set in px
      if (updatedField.style.fontSize && !updatedField.style.fontSize.includes('px')) {
        // Convert rem to px if needed
        if (updatedField.style.fontSize.includes('rem')) {
          const remValue = parseFloat(updatedField.style.fontSize);
          updatedField.style.fontSize = `${remValue * 16}px`;
        } else if (!isNaN(parseFloat(updatedField.style.fontSize))) {
          // If it's a number without unit, assume px
          updatedField.style.fontSize = `${updatedField.style.fontSize}px`;
        }
      }
      
      // Ensure label font size is explicitly set
      if (updatedField.style.labelFontSize && !updatedField.style.labelFontSize.includes('px')) {
        // Convert rem to px if needed
        if (updatedField.style.labelFontSize.includes('rem')) {
          const remValue = parseFloat(updatedField.style.labelFontSize);
          updatedField.style.labelFontSize = `${remValue * 16}px`;
        } else if (!isNaN(parseFloat(updatedField.style.labelFontSize))) {
          // If it's a number without unit, assume px
          updatedField.style.labelFontSize = `${updatedField.style.labelFontSize}px`;
        }
      } else if (!updatedField.style.labelFontSize) {
        // Set default label font size if not specified
        updatedField.style.labelFontSize = '16px';
      }
      
      // IMPORTANT: Title fields should preserve their own textAlign settings
      // Do NOT override based on form direction
      if (updatedField.type === 'form-title' || updatedField.type === 'title') {
        // Only set a default if no textAlign exists
        if (!updatedField.style.textAlign) {
          updatedField.style.textAlign = language === 'ar' ? 'right' : 'left';
        }
        // For title fields, don't modify the textAlign based on form direction
        // This is crucial - title alignment is independent of form direction
      }
      
      return updatedField;
    });
    
    // If there's already a form title, use it
    if (updatedFields.some(field => field.type === 'form-title')) {
      return updatedFields;
    }
    
    // If there's no form title, add one at the beginning with fixed pixel sizes
    // IMPORTANT: Title alignment is based on language, not form direction
    const formTitleField: FormField = {
      type: 'form-title',
      id: `form-title-${Date.now()}`,
      label: formTitle,
      helpText: formDescription,
      style: {
        color: '#ffffff',
        textAlign: language === 'ar' ? 'right' : 'left', // Based on language, not direction
        fontWeight: 'bold',
        fontSize: '24px', // Use fixed pixels 
        descriptionColor: 'rgba(255, 255, 255, 0.9)',
        descriptionFontSize: '14px', // Use fixed pixels
        backgroundColor: formStyle.primaryColor || '#9b87f5', // Primary background color
      }
    };
    
    // Check if there's already a submit button
    const hasSubmitButton = updatedFields.some(field => field.type === 'submit');
    
    let result = [formTitleField, ...updatedFields.filter(f => f.type !== 'form-title')];
    
    // If there's no submit button, add one
    if (!hasSubmitButton) {
      const submitButton: FormField = {
        type: 'submit',
        id: `submit-${Date.now()}`,
        label: language === 'ar' ? 'إرسال الطلب' : 'Submit Order',
        style: {
          backgroundColor: formStyle.primaryColor || '#9b87f5',
          color: '#ffffff',
          fontSize: '18px', // Use fixed pixels
          animation: true,
          animationType: 'pulse',
        },
      };
      result.push(submitButton);
    }
    
    return result;
  }, [fields, formTitle, formDescription, language, formStyle.primaryColor]);
  
  // Create unique ID for this form to ensure correct updating
  const formId = React.useMemo(() => `form-preview-${Date.now()}`, []);
  
  return (
    <div 
      className="rounded-lg border shadow-sm overflow-hidden bg-white codform-form"
      style={{
        fontSize: formStyle.fontSize,
        '--form-primary-color': formStyle.primaryColor,
        borderRadius: formStyle.borderRadius,
        backgroundColor: '#f5f5f5', // Change background to light gray to match store
        padding: '20px', // Add padding to outer container
      } as React.CSSProperties}
      data-form-preview-id={formId}
      data-primary-color={formStyle.primaryColor}
      data-border-radius={formStyle.borderRadius}
      data-font-size={formStyle.fontSize}
      data-button-style={formStyle.buttonStyle}
      data-form-direction={direction}
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
          direction: direction, // Use the form direction prop
          padding: '0', // Remove padding from inner content
        }}
        data-direction={direction}
      >
        {sanitizedFields.length > 0 ? (
          <div className="space-y-4">
            {sanitizedFields.map(field => (
              <FormFieldComponent 
                key={`${field.id}-${Date.now()}`}
                field={field} 
                formStyle={formStyle}
                direction={direction} // Pass direction to FormFieldComponent
                // IMPORTANT: List ALL field types that should ignore form direction
                ignoreDirectionForTypes={['form-title', 'title', 'submit']} 
              />
            ))}
          </div>
        ) : (
          children
        )}
      </div>

      {/* Show floating button if enabled and not hidden for preview */}
      {floatingButton && floatingButton.enabled && !hideFloatingButtonPreview && (
        <FloatingButton config={floatingButton} isPreview={true} />
      )}
    </div>
  );
};

export default FormPreview;
