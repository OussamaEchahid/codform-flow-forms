
import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { FormField } from '@/lib/form-utils';
import FormFieldComponent from './preview/FormField';

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
  submitButtonText?: string;
}

const FormPreview: React.FC<FormPreviewProps> = React.memo(({
  formTitle,
  formDescription,
  currentStep,
  totalSteps,
  children,
  formStyle = {
    primaryColor: '#9b87f5',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    buttonStyle: 'rounded',
  },
  fields = [],
  submitButtonText = 'إرسال الطلب',
}) => {
  const { language } = useI18n();
  // Remove the state that was causing re-renders
  const refreshKey = 0;
  
  // Memoize the CSS variables to prevent re-calculation on each render
  const cssVars = useMemo(() => {
    return {
      fontSize: formStyle.fontSize,
      '--form-primary-color': formStyle.primaryColor,
      borderRadius: formStyle.borderRadius,
    } as React.CSSProperties;
  }, [formStyle.fontSize, formStyle.primaryColor, formStyle.borderRadius]);
  
  // Memoize the step indicators to prevent unnecessary re-renders
  const stepIndicators = useMemo(() => {
    if (totalSteps <= 1) return null;
    
    return (
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
    );
  }, [currentStep, totalSteps]);

  // Memoize form fields to prevent unnecessary re-renders
  const formFieldElements = useMemo(() => {
    if (!fields || fields.length === 0) {
      return children;
    }
    
    return (
      <div className="space-y-4">
        {fields.map(field => (
          <FormFieldComponent 
            key={field.id} 
            field={field} 
            formStyle={formStyle}
          />
        ))}
        
        <button
          className="w-full py-2 px-4 text-white font-medium"
          style={{
            backgroundColor: formStyle.primaryColor || '#9b87f5',
            borderRadius: formStyle.buttonStyle === 'rounded' ? '9999px' : 
                          formStyle.buttonStyle === 'pill' ? '9999px' : '0.375rem',
          }}
          type="button"
        >
          {submitButtonText}
        </button>
      </div>
    );
  }, [fields, children, formStyle, submitButtonText]);
  
  return (
    <div 
      key={refreshKey}
      className="rounded-lg border shadow-sm overflow-hidden bg-white"
      style={cssVars}
    >
      <div 
        className="p-4 border-b" 
        style={{ 
          backgroundColor: formStyle.primaryColor || '#9b87f5',
          color: 'white',
          borderRadius: `${formStyle.borderRadius} ${formStyle.borderRadius} 0 0`,
        }}
      >
        <h2 className={cn("text-xl font-medium", language === 'ar' ? "text-right" : "text-left")}>{formTitle}</h2>
        {formDescription && <p className={cn("text-sm opacity-90", language === 'ar' ? "text-right" : "text-left")}>{formDescription}</p>}
      </div>
      
      {stepIndicators}
      
      <div 
        className="p-4" 
        style={{
          borderRadius: `0 0 ${formStyle.borderRadius} ${formStyle.borderRadius}`,
          direction: language === 'ar' ? 'rtl' : 'ltr',
        }}
      >
        {formFieldElements}
      </div>
    </div>
  );
});

FormPreview.displayName = 'FormPreview';

export default FormPreview;
