
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
        {field.type !== 'submit' && field.type !== 'title' && field.type !== 'whatsapp' && field.type !== 'cart-items' && field.type !== 'cart-summary' && field.type !== 'image' && (
          <label className="form-label mb-2 block" style={{ color: fieldStyle.color }}>
            {field.label}
            {field.required && <span className="text-red-500 mr-1">*</span>}
          </label>
        )}
        
        {field.type === 'title' && (
          <h2 className="text-xl font-bold mb-4 text-right" style={{ color: fieldStyle.color || 'inherit' }}>
            {field.label}
          </h2>
        )}
        
        {field.type === 'text' && (
          <input
            type="text"
            placeholder={field.placeholder}
            className="form-input w-full p-2 border"
            style={commonInputStyle}
            disabled
          />
        )}
        
        {field.type === 'email' && (
          <input
            type="email"
            placeholder={field.placeholder || 'البريد الإلكتروني'}
            className="form-input w-full p-2 border"
            style={commonInputStyle}
            disabled
          />
        )}
        
        {field.type === 'phone' && (
          <input
            type="tel"
            placeholder={field.placeholder || 'رقم الهاتف'}
            className="form-input w-full p-2 border"
            style={commonInputStyle}
            disabled
          />
        )}
        
        {field.type === 'textarea' && (
          <textarea
            placeholder={field.placeholder}
            className="form-input h-24 w-full p-2 border"
            style={commonInputStyle}
            disabled
          />
        )}
        
        {field.type === 'select' && (
          <select 
            className="form-select w-full p-2 border" 
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
              <div key={option} className="flex items-center gap-2 justify-end">
                <label 
                  htmlFor={`radio-${option}`}
                  style={{ 
                    color: fieldStyle.color || 'inherit',
                    fontSize: fieldStyle.fontSize || formStyle.fontSize
                  }}
                >
                  {option}
                </label>
                <input
                  type="radio"
                  id={`radio-${option}`}
                  name={`radio-${field.id}`}
                  className="form-radio"
                  disabled
                />
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
            {field.label || 'إرسال'}
          </button>
        )}
        
        {field.type === 'cart-items' && (
          <div className="border rounded-md p-3 bg-gray-50 mb-4">
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
        
        {field.type === 'cart-summary' && (
          <div className="border-t border-gray-200 pt-3 mb-4">
            <div className="flex justify-between py-1">
              <span>0.00 ريال</span>
              <span>{language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>0.00 ريال</span>
              <span>{language === 'ar' ? 'الخصم' : 'Discount'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>0.00 ريال</span>
              <span>{language === 'ar' ? 'الشحن' : 'Shipping'}</span>
            </div>
            <div className="flex justify-between py-1 font-bold">
              <span>0.00 ريال</span>
              <span>{language === 'ar' ? 'المجموع' : 'Total'}</span>
            </div>
          </div>
        )}

        {field.type === 'whatsapp' && (
          <button 
            className="w-full py-2 px-4 mt-2 mb-4 flex justify-center items-center text-white" 
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
          <div className="text-center py-4 border rounded bg-gray-50 mb-4">
            <div className="text-gray-400">{field.label || 'صورة'}</div>
          </div>
        )}
        
        {field.type === 'shipping' && (
          <div className="space-y-2 mb-4">
            <label className="block mb-2">{field.label || 'خيارات الشحن'}</label>
            <div className="flex items-center justify-between border rounded p-2">
              <div className="flex items-center">
                <input type="radio" id="shipping-1" name={`shipping-${field.id}`} disabled className="ml-2" />
                <label htmlFor="shipping-1">توصيل عادي</label>
              </div>
              <span>0.00 ريال</span>
            </div>
            <div className="flex items-center justify-between border rounded p-2">
              <div className="flex items-center">
                <input type="radio" id="shipping-2" name={`shipping-${field.id}`} disabled className="ml-2" />
                <label htmlFor="shipping-2">توصيل سريع</label>
              </div>
              <span>20.00 ريال</span>
            </div>
          </div>
        )}
        
        {field.type === 'countdown' && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-center mb-4">
            <div className="text-sm text-red-700 mb-1">{field.label || 'العرض ينتهي خلال'}</div>
            <div className="flex justify-center gap-2 text-red-700 font-bold">
              <div className="bg-white px-2 py-1 rounded">01</div>:
              <div className="bg-white px-2 py-1 rounded">23</div>:
              <div className="bg-white px-2 py-1 rounded">45</div>:
              <div className="bg-white px-2 py-1 rounded">30</div>
            </div>
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
          <div className="space-y-2">
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
