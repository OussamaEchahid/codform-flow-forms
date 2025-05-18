
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
  formDirection?: 'ltr' | 'rtl';
}

const FormPreview: React.FC<FormPreviewProps> = ({
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
  formDirection,
}) => {
  const { language } = useI18n();
  
  // Use the formDirection prop if provided, otherwise fall back to language-based direction
  const direction = formDirection || (language === 'ar' ? 'rtl' : 'ltr');
  
  // Ensure field processing for consistent display - DO NOT filter out title fields
  const sanitizedFields = React.useMemo(() => {
    // Add specific CSS classes for better styling
    const formTitleBgColor = formStyle.primaryColor || '#9b87f5';
    
    // Ensure cart items and cart summary fields have empty labels by default
    const updatedFields = fields.map(field => {
      // Copy field to avoid direct mutation issues
      const updatedField = { ...field };
      
      // Set empty default label for cart items and summary
      if ((field.type === 'cart-items' || field.type === 'cart-summary') && field.label === undefined) {
        updatedField.label = '';
      }
      
      // Special handling for title fields to ensure background color renders correctly
      if (field.type === 'form-title' || field.type === 'edit-form-title' || field.type === 'title') {
        if (!updatedField.style) {
          updatedField.style = {};
        }
        // Set explicit background color if not already set
        if (!updatedField.style.backgroundColor) {
          updatedField.style.backgroundColor = formTitleBgColor;
        }
      }
      
      // Convert empty icon to 'none' for consistent handling
      if (field.icon === '') {
        updatedField.icon = 'none';
      }
      
      // Make sure style.showIcon is defined if icon exists
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
      
      // Make sure font size is explicitly specified with px
      if (updatedField.style.fontSize && !updatedField.style.fontSize.includes('px')) {
        if (updatedField.style.fontSize.includes('rem')) {
          const remValue = parseFloat(updatedField.style.fontSize);
          updatedField.style.fontSize = `${remValue * 16}px`;
        } else if (!isNaN(parseFloat(updatedField.style.fontSize))) {
          updatedField.style.fontSize = `${updatedField.style.fontSize}px`;
        }
      }
      
      return updatedField;
    });
    
    const hasSubmitButton = updatedFields.some(field => field.type === 'submit');
    
    let result = [...updatedFields];
    
    // If no submit button exists, add one
    if (!hasSubmitButton) {
      const submitButton: FormField = {
        type: 'submit',
        id: `submit-${Date.now()}`,
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
  }, [fields, language, formStyle.primaryColor]);
  
  // Create unique ID for this form
  const formId = React.useMemo(() => `form-preview-${Date.now()}`, []);
  
  // Use consistent background color for form
  const formBackgroundColor = "#F9FAFB";
  
  // Direction class for the form
  const dirClass = direction === 'rtl' ? 'rtl' : 'ltr';
  
  // Apply specific styling for title fields via style tag to ensure specificity
  React.useEffect(() => {
    // Create a style element to inject high-specificity CSS
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-form-title-styles', formId);
    styleEl.textContent = `
      /* High-specificity selectors for title fields */
      .codform-form .form-title-field,
      .codform-form [data-field-type="title"],
      .codform-form [data-field-type="form-title"],
      .codform-form [data-field-type="edit-form-title"],
      .codform-form [data-testid="title-field"],
      .codform-form [data-testid="edit-form-title-field"] {
        background-color: ${formStyle.primaryColor || '#9b87f5'} !important;
        border-radius: ${formStyle.borderRadius || '0.5rem'} !important;
        padding: 0.75rem !important;
        margin-bottom: 1rem !important;
        width: 100% !important;
        display: block !important;
        box-sizing: border-box !important;
      }
      
      .codform-form .form-title-field h2,
      .codform-form [data-field-type="title"] h2,
      .codform-form [data-field-type="form-title"] h2,
      .codform-form [data-testid="title-field"] h2,
      .codform-form [data-testid="edit-form-title-field"] h2 {
        color: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
        line-height: 1.3 !important;
        width: 100% !important;
        display: block !important;
      }
      
      .codform-form .form-title-field p,
      .codform-form [data-field-type="title"] p,
      .codform-form [data-field-type="form-title"] p,
      .codform-form [data-testid="title-field"] p,
      .codform-form [data-testid="edit-form-title-field"] p {
        color: rgba(255, 255, 255, 0.9) !important;
        margin: 0.25rem 0 0 0 !important;
        width: 100% !important;
        display: block !important;
      }
    `;
    
    document.head.appendChild(styleEl);
    
    return () => {
      // Clean up on unmount
      const existingStyle = document.querySelector(`style[data-form-title-styles="${formId}"]`);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [formId, formStyle.primaryColor, formStyle.borderRadius]);
  
  return (
    <div 
      className={`rounded-lg border shadow-sm overflow-hidden codform-form ${dirClass}`}
      style={{
        fontSize: formStyle.fontSize,
        backgroundColor: formBackgroundColor,
        '--form-primary-color': formStyle.primaryColor,
        borderRadius: formStyle.borderRadius,
      } as React.CSSProperties}
      data-form-preview-id={formId}
      data-direction={direction}
      dir={direction}
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
        className={`p-3 ${dirClass}`} 
        style={{
          borderRadius: `0 0 ${formStyle.borderRadius} ${formStyle.borderRadius}`,
          direction: direction,
          backgroundColor: formBackgroundColor
        }}
        dir={direction}
      >
        {sanitizedFields.length > 0 ? (
          <div className="space-y-2" style={{backgroundColor: 'transparent'}}>
            {sanitizedFields.map(field => (
              <FormFieldComponent 
                key={`${field.id}-${Date.now()}`}
                field={field} 
                formStyle={formStyle}
                formDirection={direction}
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
      
      {/* Debugging information (hidden from user but useful for development) */}
      <div style={{ display: 'none' }} data-debug-info>
        Direction: {direction}
        Form ID: {formId}
        Fields count: {sanitizedFields.length}
      </div>
    </div>
  );
};

export default FormPreview;
