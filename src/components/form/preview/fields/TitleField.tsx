
import React, { useEffect } from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';

interface TitleFieldProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
  };
  formDirection?: 'ltr' | 'rtl';
}

const TitleField: React.FC<TitleFieldProps> = ({
  field,
  formStyle,
  formDirection
}) => {
  const { language } = useI18n();
  
  // تأكد من توجيه النص الصحيح
  const direction = formDirection || field.style?.formDirection || (language === 'ar' ? 'rtl' : 'ltr');
  
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
  
  // تسجيل معلومات التصحيح للمساعدة في تتبع المشكلات
  useEffect(() => {
    console.log(`[TitleField] Rendering title field with ID: ${field.id}`);
    console.log(`[TitleField] Background color: ${backgroundColor}`);
    console.log(`[TitleField] Text color: ${textColor}`);
    console.log(`[TitleField] Direction: ${direction}`);
    console.log(`[TitleField] Text alignment: ${textAlign}`);
  }, [field.id, backgroundColor, textColor, direction, textAlign]);
  
  if (!showTitle) {
    return null;
  }
  
  return (
    <div
      className="form-title-field w-full my-2 codform-title-container"
      style={{
        backgroundColor: backgroundColor,
        borderRadius: formStyle.borderRadius || '0.5rem',
        padding: '0.75rem',
        direction,
      }}
      dir={direction}
      data-form-direction={direction}
      data-field-type="title"
      data-testid="title-field"
    >
      <h2
        className="codform-form-title"
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
          className="codform-title-description"
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

export default TitleField;
