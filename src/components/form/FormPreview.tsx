
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
  hideFloatingButtonPreview?: boolean; // Add prop to control floating button visibility in preview
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
    fontSize: '16px', // Use fixed pixel value (1rem = 16px)
    buttonStyle: 'rounded',
  },
  fields = [],
  hideHeader = false,
  floatingButton,
  hideFloatingButtonPreview = false, // Default to false to show in preview
}) => {
  const { language } = useI18n();
  const [key] = useState(0);
  
  // Clean up fields and properly display form title
  const sanitizedFields = React.useMemo(() => {
    // Ensure cart-items and cart-summary have empty labels by default
    const updatedFields = fields.map(field => {
      if ((field.type === 'cart-items' || field.type === 'cart-summary') && field.label === undefined) {
        return { ...field, label: '' };
      }
      
      // Convert empty icon to 'none' for consistent handling
      if (field.icon === '') {
        return { ...field, icon: 'none' };
      }
      
      // Make sure style.showIcon is defined if icon is present
      if (field.icon && field.icon !== 'none' && field.style) {
        return { 
          ...field, 
          style: { 
            ...field.style,
            showIcon: field.style.showIcon !== undefined ? field.style.showIcon : true
          }
        };
      }
      
      return field;
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
      key={key}
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
        className="p-4" 
        style={{
          borderRadius: `0 0 ${formStyle.borderRadius} ${formStyle.borderRadius}`,
          direction: language === 'ar' ? 'rtl' : 'ltr',
        }}
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

      {/* Render floating button if enabled AND not hidden for preview purposes */}
      {floatingButton && floatingButton.enabled && !hideFloatingButtonPreview && (
        <FloatingButton config={floatingButton} isPreview={true} />
      )}
    </div>
  );
};

export default FormPreview;
