
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
  const imageSrc = field.src || 'https://via.placeholder.com/800x400?text=Image';
  const imageAlt = field.alt || (language === 'ar' ? 'صورة' : 'Image');
  
  // Get width from field or default to 100%
  const imageWidth = field.width || '100%';
  
  // Set border radius for the image
  const imageBorderRadius = fieldStyle.borderRadius || formStyle.borderRadius || '0.5rem';
  
  // إضافة معرف فريد لهذا الحقل
  const imageFieldId = `image-field-${field.id}-${Date.now()}`;
  
  return (
    <div 
      className="mb-4 codform-image-field"
      id={imageFieldId}
      data-field-id={field.id}
      data-field-type={field.type}
      data-image-src={imageSrc}
      data-image-alt={imageAlt}
      data-image-width={imageWidth}
      data-image-border-radius={imageBorderRadius}
    >
      {field.label && (
        <div 
          className="mb-2 codform-image-label"
          style={{ 
            color: fieldStyle.labelColor || '#334155',
            fontSize: fieldStyle.labelFontSize || formStyle.fontSize || '1rem',
            fontWeight: 500
          }}
          data-label-text={field.label}
        >
          {field.label}
        </div>
      )}
      
      <div 
        className="overflow-hidden codform-image-container"
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
          className="w-full h-auto codform-image"
          style={{
            objectFit: 'cover',
            display: 'block'
          }}
        />
      </div>
      
      {field.helpText && (
        <p className="mt-1 text-sm text-gray-500 codform-image-help-text">{field.helpText}</p>
      )}
    </div>
  );
};

export default ImageField;
