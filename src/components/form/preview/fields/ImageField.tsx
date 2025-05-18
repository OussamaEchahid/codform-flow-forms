
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
  formDirection?: 'ltr' | 'rtl';
}

const ImageField: React.FC<ImageFieldProps> = ({ field, formStyle, formDirection }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  // Determine direction based on formDirection prop or language
  const textDirection = formDirection || (language === 'ar' ? 'rtl' : 'ltr');
  
  // Use image source or placeholder
  const imageSrc = field.src || 'https://via.placeholder.com/800x400?text=Image';
  const imageAlt = field.alt || (language === 'ar' ? 'صورة' : 'Image');
  
  // Get width from field or default to 100%
  const imageWidth = field.width || '100%';
  
  // Set border radius for the image
  const imageBorderRadius = fieldStyle.borderRadius || formStyle.borderRadius || '0.5rem';
  
  // Determine label alignment based on direction
  const labelAlignment = textDirection === 'rtl' ? 'right' : 'left';
  
  return (
    <div 
      className="mb-4"
      dir={textDirection}
      data-field-type="image"
      data-direction={textDirection}
    >
      {field.label && (
        <div 
          className="mb-2"
          style={{ 
            color: fieldStyle.labelColor || '#334155',
            fontSize: fieldStyle.labelFontSize || formStyle.fontSize || '1rem',
            fontWeight: 500,
            textAlign: labelAlignment,
            direction: textDirection
          }}
          dir={textDirection}
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
        <p 
          className="mt-1 text-sm text-gray-500"
          style={{
            textAlign: labelAlignment,
            direction: textDirection
          }}
          dir={textDirection}
        >
          {field.helpText}
        </p>
      )}
    </div>
  );
};

export default ImageField;
