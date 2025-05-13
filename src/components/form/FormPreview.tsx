
import React from 'react';
import { FormStyle } from '@/hooks/useFormStore';

export interface FormPreviewProps {
  children?: React.ReactNode;
  formTitle: string;
  formDescription: string;
  currentStep: number;
  totalSteps: number;
  fields: any[];
  style?: FormStyle;
}

const FormPreview: React.FC<FormPreviewProps> = ({
  children,
  formTitle,
  formDescription,
  currentStep,
  totalSteps,
  fields,
  style = {
    primaryColor: '#9b87f5',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    buttonStyle: 'rounded',
  }
}) => {
  const buttonRadius = style?.buttonStyle === 'pill' ? '9999px' : style?.borderRadius || '0.5rem';
  
  // Safely access style properties with fallbacks
  const primaryColor = style?.primaryColor || '#9b87f5';
  const borderRadius = style?.borderRadius || '0.5rem';
  const fontSize = style?.fontSize || '1rem';
  
  return (
    <div
      className="bg-white rounded-lg shadow-sm border p-6"
      style={{
        borderRadius: borderRadius,
        fontSize: fontSize
      }}
    >
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold mb-2">{formTitle}</h3>
        {formDescription && (
          <p className="text-gray-600">{formDescription}</p>
        )}
      </div>
      
      {/* Progress indicator */}
      {totalSteps > 1 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">الخطوة {currentStep} من {totalSteps}</span>
            <span className="text-sm font-medium">{Math.round((currentStep / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="h-2.5 rounded-full" 
              style={{
                width: `${(currentStep / totalSteps) * 100}%`,
                backgroundColor: primaryColor
              }}
            ></div>
          </div>
        </div>
      )}
      
      {/* Form fields */}
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id || index} className="space-y-2">
            {field.type === 'text' && (
              <>
                <label className="block text-sm font-medium text-gray-700">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border rounded-md" 
                  style={{ borderRadius: borderRadius }}
                  placeholder={field.placeholder || ''}
                />
              </>
            )}
            
            {field.type === 'textarea' && (
              <>
                <label className="block text-sm font-medium text-gray-700">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <textarea 
                  className="w-full px-3 py-2 border rounded-md" 
                  style={{ borderRadius: borderRadius }}
                  placeholder={field.placeholder || ''}
                  rows={4}
                ></textarea>
              </>
            )}
            
            {field.type === 'select' && (
              <>
                <label className="block text-sm font-medium text-gray-700">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <select 
                  className="w-full px-3 py-2 border rounded-md bg-white" 
                  style={{ borderRadius: borderRadius }}
                >
                  <option value="">{field.placeholder || 'اختر...'}</option>
                  {(field.options || []).map((option: any, optIdx: number) => (
                    <option key={optIdx} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </>
            )}
            
            {field.type === 'checkbox' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <div className="space-y-1">
                  {(field.options || []).map((option: any, optIdx: number) => (
                    <div key={optIdx} className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        id={`option-${field.id}-${optIdx}`}
                      />
                      <label htmlFor={`option-${field.id}-${optIdx}`} className="mr-2 text-sm text-gray-700">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {field.type === 'radio' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <div className="space-y-1">
                  {(field.options || []).map((option: any, optIdx: number) => (
                    <div key={optIdx} className="flex items-center">
                      <input
                        type="radio"
                        className="h-4 w-4 text-indigo-600 border-gray-300"
                        id={`radio-${field.id}-${optIdx}`}
                        name={field.id}
                      />
                      <label htmlFor={`radio-${field.id}-${optIdx}`} className="mr-2 text-sm text-gray-700">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {field.type === 'email' && (
              <>
                <label className="block text-sm font-medium text-gray-700">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <input 
                  type="email" 
                  className="w-full px-3 py-2 border rounded-md" 
                  style={{ borderRadius: borderRadius }}
                  placeholder={field.placeholder || ''}
                />
              </>
            )}
            
            {field.type === 'phone' && (
              <>
                <label className="block text-sm font-medium text-gray-700">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <input 
                  type="tel" 
                  className="w-full px-3 py-2 border rounded-md" 
                  style={{ borderRadius: borderRadius }}
                  placeholder={field.placeholder || ''}
                />
              </>
            )}

            {field.type === 'submit' && (
              <button
                type="button"
                className="w-full py-2 px-4 text-white font-medium shadow-sm"
                style={{ 
                  backgroundColor: primaryColor,
                  borderRadius: buttonRadius
                }}
              >
                {field.label || 'إرسال'}
              </button>
            )}
          </div>
        ))}
      </div>
      
      {children}
    </div>
  );
};

export default FormPreview;
