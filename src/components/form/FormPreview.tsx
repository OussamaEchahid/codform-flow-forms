
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
  const [key] = useState(0);
  
  // Clean up fields and properly display form title
  const sanitizedFields = React.useMemo(() => {
    // Ensure cart-items and cart-summary have empty labels by default
    const updatedFields = fields.map(field => {
      // Make a copy of the field to avoid mutation issues
      const updatedField = { ...field };
      
      // Set default empty label for cart items and summary
      if ((field.type === 'cart-items' || field.type === 'cart-summary') && field.label === undefined) {
        updatedField.label = '';
      }
      
      // Convert empty icon to 'none' for consistent handling
      if (field.icon === '') {
        updatedField.icon = 'none';
      }
      
      // Make sure style.showIcon is defined if icon is present
      if (field.icon && field.icon !== 'none') {
        if (!updatedField.style) {
          updatedField.style = {};
        }
        
        // Default showIcon to true if icon exists and not explicitly set to false
        updatedField.style.showIcon = updatedField.style.showIcon !== undefined 
          ? updatedField.style.showIcon 
          : true;
      }
      
      return updatedField;
    });
    
    // If there's already a form-title, use it
    if (updatedFields.some(field => field.type === 'form-title')) {
      return updatedFields;
    }
    
    // If there's no form-title, add one at the beginning with specific pixel sizes
    const formTitleField: FormField = {
      type: 'form-title',
      id: `form-title-${Date.now()}`,
      label: formTitle,
      helpText: formDescription,
      style: {
        color: '#ffffff',
        textAlign: language === 'ar' ? 'right' : 'left',
        fontWeight: 'bold',
        fontSize: '24px', // 1.5rem = 24px
        descriptionColor: '#ffffff',
        descriptionFontSize: '14px', // 0.875rem = 14px
        backgroundColor: '#9b87f5', // Primary background color
      }
    };
    
    // Check if there's already a submit button
    const hasSubmitButton = updatedFields.some(field => field.type === 'submit');
    
    let result = [formTitleField, ...updatedFields.filter(f => f.type !== 'form-title')];
    
    // If there's no submit button, add one with specific pixel sizes
    if (!hasSubmitButton) {
      const submitButton: FormField = {
        type: 'submit',
        id: `submit-${Date.now()}`,
        label: language === 'ar' ? 'إرسال الطلب' : 'Submit Order',
        style: {
          backgroundColor: formStyle.primaryColor || '#9b87f5',
          color: '#ffffff',
          fontSize: '18px', // 1.2rem = 18px
          animation: true,
          animationType: 'pulse',
        },
      };
      result.push(submitButton);
    }
    
    return result;
  }, [fields, formTitle, formDescription, language, formStyle.primaryColor]);
  
  return (
    <div 
      key={`form-preview-${Date.now()}`}
      className="rounded-lg border shadow-sm overflow-hidden bg-white codform-form"
      style={{
        fontSize: formStyle.fontSize,
        '--form-primary-color': formStyle.primaryColor,
        borderRadius: formStyle.borderRadius,
      } as React.CSSProperties}
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
        className="p-3" 
        style={{
          borderRadius: `0 0 ${formStyle.borderRadius} ${formStyle.borderRadius}`,
          direction: language === 'ar' ? 'rtl' : 'ltr',
        }}
      >
        {sanitizedFields.length > 0 ? (
          <div className="space-y-2">
            {sanitizedFields.map(field => (
              <FormFieldComponent 
                key={`${field.id}-${Date.now()}`}
                field={field} 
                formStyle={formStyle}
              />
            ))}
          </div>
        ) : (
          children
        )}
      </div>

      {/* Render floating button if enabled AND not hidden for preview purposes */}
      {floatingButton && floatingButton.enabled && !hideFloatingButtonPreview && (
        <FloatingButton config={floatingButton} isPreview={true} />
      )}
    </div>
  );
};

export default FormPreview;
