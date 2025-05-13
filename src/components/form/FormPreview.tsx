
import React from 'react';

interface FormPreviewProps {
  formTitle?: string;
  formDescription?: string;
  currentStep?: number;
  totalSteps?: number;
  style?: any;
  fields?: any[];
  children?: React.ReactNode;
  floatingButton?: any;
  hideFloatingButtonPreview?: boolean;
}

// A simple form preview component
const FormPreview: React.FC<FormPreviewProps> = ({
  formTitle,
  formDescription,
  style = {},
  fields = [],
  children,
}) => {
  const primaryColor = style.primaryColor || '#9b87f5';
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <div 
        className="p-4" 
        style={{ backgroundColor: primaryColor }}
      >
        <h3 className="text-xl font-bold text-white">{formTitle}</h3>
        {formDescription && <p className="mt-2 text-white opacity-80">{formDescription}</p>}
      </div>
      
      <div className="p-4">
        {fields.length > 0 ? (
          <div>
            <div className="space-y-4">
              {fields.map((field, fieldIndex) => (
                <div key={field.id || fieldIndex} className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  {field.type === 'text' && (
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded"
                      placeholder={field.placeholder || ''}
                      disabled
                    />
                  )}
                  
                  {field.type === 'textarea' && (
                    <textarea
                      className="w-full px-3 py-2 border rounded"
                      rows={3}
                      placeholder={field.placeholder || ''}
                      disabled
                    />
                  )}
                  
                  {field.type === 'checkbox' && field.options && (
                    <div className="space-y-2">
                      {field.options.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center">
                          <input
                            type="checkbox"
                            className="mr-2"
                            disabled
                          />
                          <span>{option.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <button
              className="w-full py-3 mt-4 rounded font-medium text-white"
              style={{ backgroundColor: primaryColor }}
              disabled
            >
              Submit
            </button>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            No form fields have been added yet.
          </div>
        )}
      </div>
      {children}
    </div>
  );
};

export default FormPreview;
