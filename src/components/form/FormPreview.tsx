
import React, { useEffect, useState } from 'react';
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
  const [key, setKey] = useState(0);
  
  // Force re-render when props change
  useEffect(() => {
    setKey(prevKey => prevKey + 1);
  }, [formStyle, formTitle, formDescription, currentStep, totalSteps, fields]);
  
  const renderField = (field: FormField) => {
    const fieldStyle = field.style || {};
    
    if (!field || !field.type) {
      console.warn('Invalid field:', field);
      return null;
    }

    const commonInputStyle = {
      backgroundColor: fieldStyle.backgroundColor || 'white',
      color: fieldStyle.color || 'inherit',
      fontSize: fieldStyle.fontSize || formStyle.fontSize,
      borderRadius: fieldStyle.borderRadius || formStyle.borderRadius,
      borderWidth: fieldStyle.borderWidth || '1px',
      borderColor: fieldStyle.borderColor || '#e2e8f0',
    };
    
    return (
      <div key={field.id} className="form-control text-right mb-4">
        {field.type !== 'submit' && field.type !== 'title' && (
          <label className="form-label" style={{ color: fieldStyle.color }}>
            {field.label}
            {field.required && <span className="text-red-500 mr-1">*</span>}
          </label>
        )}
        
        {field.type === 'title' && (
          <h2 className="text-xl font-bold mb-4 text-right" style={{ color: fieldStyle.color || 'inherit' }}>
            {field.label}
          </h2>
        )}
        
        {(field.type === 'text' || field.type === 'email' || field.type === 'phone') && (
          <input
            type={field.type === 'email' ? 'email' : 'text'}
            placeholder={field.placeholder}
            className="form-input w-full"
            style={commonInputStyle}
            disabled
          />
        )}
        
        {field.type === 'textarea' && (
          <textarea
            placeholder={field.placeholder}
            className="form-input h-24 w-full"
            style={commonInputStyle}
            disabled
          />
        )}
        
        {field.type === 'select' && (
          <select 
            className="form-select w-full" 
            disabled
            style={commonInputStyle}
          >
            <option value="">-- اختر --</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )}
        
        {field.type === 'checkbox' && (
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
                  style={{ 
                    color: fieldStyle.color || 'inherit',
                    fontSize: fieldStyle.fontSize || formStyle.fontSize
                  }}
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        )}
        
        {field.type === 'radio' && (
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
                  style={{ 
                    color: fieldStyle.color || 'inherit',
                    fontSize: fieldStyle.fontSize || formStyle.fontSize
                  }}
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        )}
        
        {field.type === 'submit' && (
          <button 
            className="w-full text-white py-2 px-4 mt-4 flex justify-center items-center" 
            style={{ 
              backgroundColor: formStyle.primaryColor,
              borderRadius: formStyle.borderRadius,
              fontSize: formStyle.fontSize,
            }}
            disabled
          >
            {field.label}
          </button>
        )}
        
        {field.type === 'cart-items' && (
          <div className="border rounded-md p-3 bg-gray-50">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-bold">{language === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'} 120 ريال</span>
              <span>2 × منتج</span>
            </div>
            <div className="py-2">
              <div className="flex justify-between items-center py-1">
                <span>60 ريال</span>
                <span>1 × قميص أبيض</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span>60 ريال</span>
                <span>1 × قميص أسود</span>
              </div>
            </div>
          </div>
        )}

        {field.type === 'whatsapp' && (
          <button 
            className="w-full py-2 px-4 mt-2 flex justify-center items-center text-white" 
            style={{ 
              backgroundColor: '#25D366',
              borderRadius: formStyle.borderRadius,
              fontSize: formStyle.fontSize,
            }}
            disabled
          >
            {field.label || 'تواصل عبر واتساب'}
          </button>
        )}
        
        {field.type === 'image' && (
          <div className="text-center py-4 border rounded bg-gray-50">
            {field.label || 'صورة'}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div 
      key={key}
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
        {fields && fields.length > 0 ? (
          <div className="space-y-4">
            {fields.map((field, index) => renderField(field))}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default FormPreview;
