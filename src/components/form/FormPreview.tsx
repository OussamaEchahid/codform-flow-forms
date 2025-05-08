
import React from 'react';
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
  formStyle: {
    primaryColor: string;
    borderRadius: string;
    fontSize: string;
    buttonStyle: string;
  };
  fields?: FormField[];
  submitButtonText: string;
}

const FormPreview: React.FC<FormPreviewProps> = ({
  formTitle,
  formDescription,
  currentStep,
  totalSteps,
  children,
  formStyle,
  fields = [],
  submitButtonText = 'إرسال الطلب',
}) => {
  const { language } = useI18n();
  
  return (
    <div 
      className="rounded-lg border shadow-sm overflow-hidden bg-white"
      style={{
        fontSize: formStyle.fontSize,
        '--form-primary-color': formStyle.primaryColor,
        borderRadius: formStyle.borderRadius,
      } as React.CSSProperties}
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

export default FormPreview;
