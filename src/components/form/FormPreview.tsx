
import React from 'react';
import { FormStyle } from '@/hooks/useFormStore';

interface FormPreviewProps {
  formTitle?: string;
  formDescription?: string;
  currentStep?: number;
  totalSteps?: number;
  style?: FormStyle | Record<string, string>; // Make sure style accepts FormStyle or object
  formStyle?: FormStyle; // Added formStyle prop
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
  formStyle, // Add formStyle prop (will be used if style is not provided)
  fields = [],
  children,
}) => {
  // Make sure we have a properly typed style object with default values
  const defaultStyle: FormStyle = {
    primaryColor: '#9b87f5',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    buttonStyle: 'rounded',
  };
  
  // Use either style or formStyle, with style taking precedence
  // Ensure it's properly typed by merging with defaultStyle
  const styles: FormStyle = {
    ...defaultStyle,
    ...(Object.keys(style || {}).length > 0 ? style as FormStyle : formStyle || {})
  };
  
  // Now we can safely access primaryColor
  const primaryColor = styles.primaryColor;
  
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
