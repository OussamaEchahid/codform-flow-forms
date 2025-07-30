
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
  
  // Use image source or placeholder
  const imageSrc = field.src || 'https://codform.com/assets/image_place_holder.avif';
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
    <div className="mb-4">
      {field.label && (
        <div 
          className="mb-2"
          style={{ 
            color: fieldStyle.labelColor || '#334155',
            fontSize: fieldStyle.labelFontSize || formStyle.fontSize || '1rem',
            fontWeight: 500
          }}
        >
          {field.label}
        </div>
      )}
      
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
