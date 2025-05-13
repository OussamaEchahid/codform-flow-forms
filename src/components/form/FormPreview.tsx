
import React from 'react';
import { useFormStore } from '@/hooks/useFormStore';

// A simple form preview component
const FormPreview = () => {
  const { formState } = useFormStore();
  
  if (!formState) {
    return (
      <div className="p-4 text-center">
        <p>No form data available to preview</p>
      </div>
    );
  }
  
  const { title, description, data = [], style = {} } = formState;
  
  const primaryColor = style.primaryColor || '#9b87f5';
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <div 
        className="p-4" 
        style={{ backgroundColor: primaryColor }}
      >
        <h3 className="text-xl font-bold text-white">{title}</h3>
        {description && <p className="mt-2 text-white opacity-80">{description}</p>}
      </div>
      
      <div className="p-4">
        {data.length > 0 ? (
          <div>
            {data.map((step, index) => (
              <div key={step.id || index} className="mb-4">
                <h4 className="font-medium mb-2">{step.title}</h4>
                
                <div className="space-y-4">
                  {step.fields && step.fields.map((field, fieldIndex) => (
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
              </div>
            ))}
            
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
    </div>
  );
};

export default FormPreview;
