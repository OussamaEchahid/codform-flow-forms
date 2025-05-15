
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';
import { ensureString, ensureColor, ensureSize } from '@/lib/utils';

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
  const imageSrc = ensureString(field.src) || 'https://via.placeholder.com/800x400?text=Image';
  const imageAlt = ensureString(field.alt) || (language === 'ar' ? 'صورة' : 'Image');
  
  // Get width from field or default to 100%
  const imageWidth = ensureString(field.width) || '100%';
  
  // Set border radius for the image
  const imageBorderRadius = ensureSize(fieldStyle.borderRadius) || ensureSize(formStyle.borderRadius) || '0.5rem';
  
  return (
    <div className="mb-4">
      {field.label && (
        <div 
          className="mb-2"
          style={{ 
            color: ensureColor(fieldStyle.labelColor) || '#334155',
            fontSize: ensureSize(fieldStyle.labelFontSize) || ensureSize(formStyle.fontSize) || '1rem',
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
          margin: '0 auto',
          borderRadius: imageBorderRadius
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
