
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
  
  // Use image source or default to the trust badges image
  const imageSrc = field.src || '/lovable-uploads/9e1cd769-7976-41fc-a2a0-189049772982.png';
  const imageAlt = field.alt || (language === 'ar' ? 'صورة' : 'Image');
  
  // Get width from field or default to 100%
  const imageWidth = typeof field.width === 'string' ? 
    (field.width.includes('%') ? field.width : `${field.width}%`) : 
    (field.width ? `${field.width}%` : '100%');
  
  // Set border radius for the image
  const imageBorderRadius = fieldStyle.borderRadius || formStyle.borderRadius || '0.5rem';
  
  // Get alignment from field style
  const alignment = fieldStyle.textAlign || 'center';
  
  return (
    <div className="mb-2">
      <div
        className="overflow-hidden"
        style={{
          maxWidth: '100%',
          width: imageWidth,
          margin: alignment === 'center' ? '0 auto' : 
                  alignment === 'right' ? '0 0 0 auto' : '0 auto 0 0',
          borderRadius: imageBorderRadius,
          textAlign: alignment
        }}
      >
        <img 
          src={imageSrc} 
          alt={imageAlt}
          className="w-full h-auto"
          style={{
            objectFit: 'cover',
            display: 'block'
          }}
        />
      </div>
      
      {field.helpText && (
        <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
      )}
    </div>
  );
};

export default ImageField;
