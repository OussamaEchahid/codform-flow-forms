
import React, { useEffect } from 'react';
import { FormField } from '@/lib/form-utils';

interface EditFormTitleFieldProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
  };
  formDirection?: 'ltr' | 'rtl';
}

const EditFormTitleField: React.FC<EditFormTitleFieldProps> = ({
  field,
  formStyle,
  formDirection
}) => {
  // استخدم النمط من الحقل أو القيم الافتراضية
  const backgroundColor = field.style?.backgroundColor || '#9b87f5';
  const textColor = field.style?.color || '#ffffff';
  const descriptionColor = field.style?.descriptionColor || '#ffffff';
  
  // الحصول على محاذاة النص - تحقق من titleAlignment أولاً، ثم الرجوع إلى textAlign
  const textAlign = field.style?.titleAlignment || field.style?.textAlign || 'center';
  const descriptionAlign = field.style?.descriptionAlignment || field.style?.textAlign || 'center';
  
  const fontWeight = field.style?.fontWeight || 'bold';
  const titleFontSize = field.style?.titleFontSize || '24px';
  const descriptionFontSize = field.style?.descriptionFontSize || '14px';
  const showDescription = field.style?.showDescription !== false;
  const showTitle = field.style?.showTitle !== false;
  
  // استخدم اتجاه النموذج من الخصائص أو من نمط الحقل أو الافتراضي إلى 'ltr'
  const direction = formDirection || field.style?.formDirection || 'ltr';
  
  // تسجيل معلومات التصحيح للمساعدة في تتبع المشكلات
  useEffect(() => {
    console.log(`[EditFormTitleField] Rendering title field with ID: ${field.id}`);
    console.log(`[EditFormTitleField] Background color: ${backgroundColor}`);
    console.log(`[EditFormTitleField] Text color: ${textColor}`);
    console.log(`[EditFormTitleField] Direction: ${direction}`);
    console.log(`[EditFormTitleField] Text alignment: ${textAlign}`);
  }, [field.id, backgroundColor, textColor, direction, textAlign]);
  
  if (!showTitle) {
    return null;
  }
  
  return (
    <div
      className="form-title-field w-full my-2 codform-edit-title-container"
      style={{
        backgroundColor,
        borderRadius: formStyle.borderRadius || '0.5rem',
        padding: '0.75rem',
        direction,
      }}
      dir={direction}
      data-form-direction={direction}
      data-field-type="edit-form-title"
      data-testid="edit-form-title-field"
    >
      <h2
        className="codform-edit-title"
        style={{
          color: textColor,
          textAlign: textAlign as any,
          fontWeight: fontWeight as any,
          fontSize: titleFontSize,
          margin: 0,
        }}
      >
        {field.label}
      </h2>
      
      {showDescription && field.helpText && (
        <p
          className="codform-edit-description"
          style={{
            color: descriptionColor,
            textAlign: descriptionAlign as any,
            fontSize: descriptionFontSize,
            margin: '0.25rem 0 0 0',
          }}
        >
          {field.helpText}
        </p>
      )}
    </div>
  );
};

export default EditFormTitleField;
