
import React, { useState } from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { ImagePlus } from 'lucide-react';

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
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  return (
    <div className="mb-6">
      <label className="block mb-2 font-medium text-gray-700">
        {field.label || (language === 'ar' ? 'إضافة صورة' : 'Add Image')}
        {field.required && <span className="text-red-500 mr-1">*</span>}
      </label>
      
      <div 
        className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-6 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
        style={{
          borderRadius: fieldStyle.borderRadius || formStyle.borderRadius,
          borderColor: fieldStyle.borderColor || '#d1d5db',
        }}
      >
        {previewImage ? (
          <div className="relative w-full">
            <img 
              src={previewImage} 
              alt={field.label || ''} 
              className="w-full h-auto rounded-md"
            />
            <button 
              type="button"
              className="mt-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              onClick={() => setPreviewImage(null)}
            >
              {language === 'ar' ? 'حذف الصورة' : 'Remove Image'}
            </button>
          </div>
        ) : (
          <>
            <ImagePlus 
              className="w-12 h-12 text-gray-400 mb-2" 
              style={{ color: fieldStyle.color || '#9ca3af' }}
            />
            <p className="text-sm text-gray-500 text-center mb-4">
              {language === 'ar' 
                ? 'انقر لتحميل صورة أو اسحب وأفلت الملف هنا'
                : 'Click to upload or drag and drop'}
            </p>
            <button
              type="button"
              className="px-4 py-2 rounded-md text-white transition-colors"
              style={{
                backgroundColor: fieldStyle.backgroundColor || formStyle.primaryColor || '#9b87f5',
              }}
              onClick={() => document.getElementById(`${field.id}-upload`)?.click()}
            >
              {language === 'ar' ? 'اختيار صورة' : 'Select Image'}
            </button>
          </>
        )}
        <input
          id={`${field.id}-upload`}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />
      </div>
      
      {field.helpText && (
        <div className="text-sm text-gray-500 mt-2">
          {field.helpText}
        </div>
      )}
    </div>
  );
};

export default ImageField;
