
import React from 'react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { FormField } from '@/lib/form-utils';

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
}

const FormPreview = ({
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
}: FormPreviewProps) => {
  const { language } = useI18n();
  
  const renderField = (field: FormField) => {
    const fieldStyle = field.style || {};
    
    return (
      <div key={field.id} className="form-control text-right mb-4">
        <label className="form-label" style={{ color: fieldStyle.color }}>
          {field.label}
          {field.required && <span className="text-red-500 mr-1">*</span>}
        </label>
        
        {field.type === 'text' || field.type === 'email' || field.type === 'phone' ? (
          <input
            type={field.type === 'email' ? 'email' : 'text'}
            placeholder={field.placeholder}
            className="form-input"
            style={{
              backgroundColor: fieldStyle.backgroundColor,
              color: fieldStyle.color,
              fontSize: fieldStyle.fontSize,
              borderRadius: fieldStyle.borderRadius,
              borderWidth: fieldStyle.borderWidth,
              borderColor: fieldStyle.borderColor,
            }}
            disabled
          />
        ) : field.type === 'textarea' ? (
          <textarea
            placeholder={field.placeholder}
            className="form-input h-24"
            style={{
              backgroundColor: fieldStyle.backgroundColor,
              color: fieldStyle.color,
              fontSize: fieldStyle.fontSize,
              borderRadius: fieldStyle.borderRadius,
              borderWidth: fieldStyle.borderWidth,
              borderColor: fieldStyle.borderColor,
            }}
            disabled
          />
        ) : field.type === 'select' ? (
          <select 
            className="form-select" 
            disabled
            style={{
              backgroundColor: fieldStyle.backgroundColor,
              color: fieldStyle.color,
              fontSize: fieldStyle.fontSize,
              borderRadius: fieldStyle.borderRadius,
              borderWidth: fieldStyle.borderWidth,
              borderColor: fieldStyle.borderColor,
            }}
          >
            <option value="">-- اختر --</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : field.type === 'checkbox' ? (
          <div className="space-y-2">
            {field.options?.map(option => (
              <div key={option} className="flex items-center space-x-2 rtl:space-x-reverse">
                <input
                  type="checkbox"
                  id={`check-${option}`}
                  className="form-checkbox"
                  disabled
                />
                <label 
                  htmlFor={`check-${option}`}
                  style={{ color: fieldStyle.color, fontSize: fieldStyle.fontSize }}
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        ) : field.type === 'radio' ? (
          <div className="space-y-2">
            {field.options?.map(option => (
              <div key={option} className="flex items-center space-x-2 rtl:space-x-reverse">
                <input
                  type="radio"
                  id={`radio-${option}`}
                  name={`radio-${field.id}`}
                  className="form-radio"
                  disabled
                />
                <label 
                  htmlFor={`radio-${option}`}
                  style={{ color: fieldStyle.color, fontSize: fieldStyle.fontSize }}
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  };
  
  return (
    <div 
      className="rounded-lg border shadow-sm overflow-hidden bg-white"
      style={{
        fontSize: formStyle.fontSize,
        '--form-primary-color': formStyle.primaryColor,
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
        }}
      >
        {fields.length > 0 ? (
          <div className="space-y-4">
            {fields.map(field => renderField(field))}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default FormPreview;
