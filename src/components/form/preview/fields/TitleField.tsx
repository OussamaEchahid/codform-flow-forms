
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
}

// تحويل الوحدات من rem إلى px للتوافق التام مع المتجر
const remToPx = (value: string | undefined, defaultValue: string): string => {
  if (!value) return defaultValue;
  
  if (value.includes('rem')) {
    const remValue = parseFloat(value);
    return `${Math.round(remValue * 16)}px`;
  }
  
  if (!value.includes('px') && !isNaN(parseFloat(value))) {
    return `${value}px`;
  }
  
  return value;
};

const TitleField: React.FC<TitleFieldProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  // الحصول على وصف من الحقل مع استخدام القيمة الافتراضية
  const description = field.helpText || '';
  
  // التحقق مما إذا كان يجب عرض العنوان والوصف
  const showTitle = fieldStyle.showTitle !== false;
  const showDescription = fieldStyle.showDescription !== false && !!description;
  
  // تعيين المحاذاة الافتراضية بناءً على اللغة
  const defaultAlignment = language === 'ar' ? 'right' : 'left';
  const alignment = fieldStyle.textAlign || defaultAlignment;
  
  // استخدم قيم بكسل دقيقة بدلاً من rem لتناسق الحجم بنسبة 100%
  const isFormTitle = field.type === 'form-title';
  const defaultTitleSize = isFormTitle ? '24px' : '20px';
  const defaultDescSize = '14px';
  
  // تحويل كل قيم الحجم إلى بكسل - مهم جدًا للتناسق
  const fontSize = remToPx(fieldStyle.fontSize, defaultTitleSize);
  const descriptionFontSize = remToPx(fieldStyle.descriptionFontSize, defaultDescSize);
  
  // الحصول على لون الخلفية مع القيمة الافتراضية
  const backgroundColor = fieldStyle.backgroundColor || formStyle.primaryColor || '#9b87f5';

  // استخدم محاذاة النص المناسبة
  const contentDirection = language === 'ar' ? 'rtl' : 'ltr';
  
  // مهم: استخدم !important على جميع خصائص النمط لتجاوز أنماط المتجر
  const backgroundStyle = {
    backgroundColor: `${backgroundColor} !important`,
    padding: '16px !important',
    borderRadius: `${formStyle.borderRadius || '8px'} !important`,
    width: '100% !important',
    boxSizing: 'border-box' as React.CSSProperties['boxSizing'],
    marginBottom: '16px !important',
    textAlign: alignment as React.CSSProperties['textAlign'],
    direction: contentDirection as React.CSSProperties['direction'],
  };

  // أنماط العنوان مع علامات !important
  const titleStyle = {
    color: `${fieldStyle.color || '#ffffff'} !important`,
    fontSize: `${fontSize} !important`,
    textAlign: `${alignment} !important` as React.CSSProperties['textAlign'],
    fontWeight: `${fieldStyle.fontWeight || (isFormTitle ? 'bold' : 'medium')} !important`,
    fontFamily: `${fieldStyle.fontFamily || 'inherit'} !important`,
    margin: '0 !important',
    padding: '0 !important',
    lineHeight: '1.3 !important',
    display: 'block !important',
    direction: contentDirection as React.CSSProperties['direction'],
  };

  // أنماط الوصف مع علامات !important
  const descriptionStyle = {
    color: `${fieldStyle.descriptionColor || 'rgba(255, 255, 255, 0.9)'} !important`,
    fontSize: `${descriptionFontSize} !important`,
    margin: '6px 0 0 0 !important',
    padding: '0 !important',
    textAlign: `${alignment} !important` as React.CSSProperties['textAlign'],
    fontFamily: `${fieldStyle.fontFamily || 'inherit'} !important`,
    fontWeight: 'normal !important',
    lineHeight: '1.5 !important',
    opacity: '0.9 !important',
    direction: contentDirection as React.CSSProperties['direction'],
  };

  // إنشاء معرف فريد لهذا الحقل لتصحيح مشاكل التنسيق
  const titleFieldId = `title-field-${field.id}`;

  console.log('TitleField rendering', { 
    id: field.id,
    backgroundColor,
    fieldType: field.type,
    fontSize,
    alignment,
    showTitle,
    showDescription,
    language
  });

  return (
    <div 
      id={titleFieldId}
      className="mb-4 codform-title-field"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      data-testid="title-field"
      data-title-align={alignment}
      data-has-bg="true"
      data-title-color={fieldStyle.color || '#ffffff'}
      data-bg-color={backgroundColor}
      data-font-family={fieldStyle.fontFamily || ''}
      data-field-type={field.type}
      data-font-size={fontSize}
      data-font-weight={fieldStyle.fontWeight || (isFormTitle ? 'bold' : 'medium')}
      data-desc-font-size={descriptionFontSize}
      data-desc-color={fieldStyle.descriptionColor || 'rgba(255, 255, 255, 0.9)'}
      data-desc-font-weight='normal'
      data-show-title={showTitle.toString()}
      data-show-description={showDescription.toString()}
      data-direction={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* <!-- بداية حقل العنوان --> */}
      <div 
        className="codform-title-container" 
        style={backgroundStyle}
      >
        {showTitle && (
          <h3 
            className={isFormTitle ? "codform-form-title" : "codform-section-title"}
            style={titleStyle}
          >
            {field.label}
          </h3>
        )}
        
        {showDescription && description && (
          <p 
            className="codform-title-description"
            style={descriptionStyle}
          >
            {description}
          </p>
        )}
      </div>
      {/* <!-- نهاية حقل العنوان --> */}
    </div>
  );
};

export default TitleField;
