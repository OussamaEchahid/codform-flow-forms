
import React, { useEffect, useState, useMemo } from 'react';
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

const FormPreview: React.FC<FormPreviewProps> = ({
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
  const [key, setKey] = useState(0);
  
  // Use a ref to track prop changes to avoid infinite loops
  const lastProps = React.useRef({
    formStyle,
    formTitle,
    formDescription,
    currentStep,
    totalSteps,
    submitButtonText,
    fieldsLength: fields?.length || 0
  });
  
  useEffect(() => {
    // Only update key if important props have changed
    const currentProps = {
      formStyle,
      formTitle,
      formDescription,
      currentStep,
      totalSteps,
      submitButtonText,
      fieldsLength: fields?.length || 0
    };
    
    const hasChanged = Object.keys(currentProps).some(key => {
      // Special case for formStyle since it's an object
      if (key === 'formStyle') {
        return JSON.stringify(currentProps.formStyle) !== JSON.stringify(lastProps.current.formStyle);
      }
      // @ts-ignore
      return currentProps[key] !== lastProps.current[key];
    });
    
    if (hasChanged) {
      setKey(prevKey => prevKey + 1);
      lastProps.current = currentProps;
    }
  }, [formStyle, formTitle, formDescription, currentStep, totalSteps, fields, submitButtonText]);

  // Memoize the CSS variables to prevent re-calculation on each render
  const cssVars = useMemo(() => {
    return {
      fontSize: formStyle.fontSize,
      '--form-primary-color': formStyle.primaryColor,
      borderRadius: formStyle.borderRadius,
    } as React.CSSProperties;
  }, [formStyle.fontSize, formStyle.primaryColor, formStyle.borderRadius]);
  
  return (
    <div 
      key={key}
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
        {fields && fields.length > 0 ? (
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
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default React.memo(FormPreview);
