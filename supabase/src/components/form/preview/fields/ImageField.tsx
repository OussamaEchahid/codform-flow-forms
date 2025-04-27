
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';

interface ImageFieldProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
  };
}

const ImageField: React.FC<ImageFieldProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  return (
    <div className="mb-6">
      <div 
        className="flex justify-center items-center bg-gray-100"
        style={{
          borderRadius: fieldStyle.borderRadius || formStyle.borderRadius,
          height: '200px',
        }}
      >
        <div className="text-gray-400">
          {language === 'ar' ? 'صورة توضيحية' : 'Placeholder Image'}
        </div>
      </div>
      {field.label && (
        <div 
          className="text-sm text-center mt-2"
          style={{ color: fieldStyle.color || 'inherit' }}
        >
          {field.label}
        </div>
      )}
    </div>
  );
};

export default ImageField;
