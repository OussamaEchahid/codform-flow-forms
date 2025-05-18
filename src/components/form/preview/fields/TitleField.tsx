
import React from 'react';
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

const TitleField: React.FC<TitleFieldProps> = ({ field, formStyle, formDirection }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  // استخراج الوصف من الحقل نفسه
  const description = field.helpText || '';
  
  // الحصول على اتجاه اللغة بناءً على اللغة المستخدمة
  const textDirection = formDirection || (language === 'ar' ? 'rtl' : 'ltr');
  
  // استخدام قيم بكسل دقيقة بدلاً من rem لضمان حجم متناسق
  const isFormTitle = field.type === 'form-title';
  
  // تحديد حجم الخط بشكل دقيق
  const fontSize = fieldStyle.fontSize || (isFormTitle ? '24px' : '20px');
  const descriptionFontSize = fieldStyle.descriptionFontSize || '14px';
  
  // الحصول على لون الخلفية من نمط الحقل، أو استخدام اللون الأساسي في النموذج، ثم الافتراضي
  const backgroundColor = fieldStyle.backgroundColor || formStyle.primaryColor || '#9b87f5';
  
  // استخدام نفس قيمة نصف القطر للحدود كما في المتجر
  const borderRadiusValue = formStyle.borderRadius || '0.5rem';
  
  // نمط الخلفية بقيم متناسقة للمتجر والمعاينة
  const backgroundStyle: React.CSSProperties = {
    backgroundColor: backgroundColor,
    padding: '16px',
    borderRadius: borderRadiusValue,
    width: '100%',
    boxSizing: 'border-box',
    marginBottom: '16px',
    textAlign: 'center',
    display: 'block',
    overflow: 'hidden',
  };

  // أنماط العنوان بهامش صفر لمطابقة المعاينة
  const titleStyle: React.CSSProperties = {
    color: fieldStyle.color || '#ffffff',
    fontSize: fontSize,
    textAlign: 'center',
    fontWeight: fieldStyle.fontWeight || (isFormTitle ? 'bold' : 'medium'),
    fontFamily: fieldStyle.fontFamily || 'inherit',
    margin: '0',
    padding: '0',
    lineHeight: '1.3',
    display: 'block',
    direction: textDirection,
    width: '100%',
  };

  // أنماط الوصف بهامش علوي 6 بكسل تماماً لمطابقة المعاينة
  const descriptionStyle: React.CSSProperties = {
    color: fieldStyle.descriptionColor || '#ffffff',
    fontSize: descriptionFontSize,
    margin: '6px 0 0 0',
    padding: '0',
    textAlign: 'center',
    fontFamily: fieldStyle.fontFamily || 'inherit',
    fontWeight: 'normal',
    lineHeight: '1.5',
    opacity: '0.9',
    direction: textDirection,
    width: '100%',
    display: 'block',
  };

  // إنشاء معرف فريد لهذا الحقل لتجنب التعارضات
  const titleFieldId = `title-field-${field.id}`;

  console.log(`Rendering TitleField with styles:`, { 
    backgroundColor, 
    titleColor: fieldStyle.color || '#ffffff',
    fontSize,
    fontWeight: fieldStyle.fontWeight || (isFormTitle ? 'bold' : 'medium'),
    descriptionColor: fieldStyle.descriptionColor || '#ffffff',
    descriptionFontSize,
    direction: textDirection
  });

  return (
    <div 
      id={titleFieldId}
      className={`mb-4 ${isFormTitle ? 'codform-title' : ''}`}
      data-testid="title-field"
      data-title-align="center"
      data-has-bg="true"
      data-title-color={fieldStyle.color || '#ffffff'}
      data-bg-color={backgroundColor}
      data-field-type={field.type}
      data-direction={textDirection}
      dir={textDirection}
    >
      <div 
        className="codform-title-container" 
        style={backgroundStyle} 
        dir={textDirection}
        data-title-style="true"
      >
        <h3 
          className={isFormTitle ? "codform-form-title" : "codform-section-title"}
          style={titleStyle}
          dir={textDirection}
        >
          {field.label}
        </h3>
        
        {description && (
          <p 
            className="codform-title-description"
            style={descriptionStyle}
            dir={textDirection}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default TitleField;
