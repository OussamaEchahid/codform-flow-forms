
import React from 'react';
import { useI18n } from '@/lib/i18n';

// Updated interface matching how the component is being used
interface FormBuilderProps {
  formData: any[];
  onChange: (newFormData: any[]) => void;
}

const FormBuilder: React.FC<FormBuilderProps> = ({ formData, onChange }) => {
  const { language } = useI18n();

  // Handle form data changes
  const handleFormDataChange = (newData: any) => {
    onChange(newData);
  };

  return (
    <div className="form-builder">
      {/* This is a placeholder - the actual implementation would have fields and elements */}
      <div className="p-4 border rounded-md bg-gray-50">
        {formData && formData.length > 0 ? (
          <div className="space-y-4">
            {formData.map((field, index) => (
              <div key={index} className="p-3 border rounded bg-white">
                <p>{field.type || 'Field'} {index + 1}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {language === 'ar' 
              ? 'لم تتم إضافة أي حقول بعد. أضف حقولًا لبدء إنشاء النموذج.'
              : 'No fields added yet. Add fields to start building your form.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormBuilder;
