
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

// تحديد خيارات محاذاة النص الصالحة
type TextAlign = 'left' | 'center' | 'right' | 'justify';
// تحديد قيم box-sizing الصالحة
type BoxSizing = 'border-box' | 'content-box' | 'initial' | 'inherit';

// وظيفة مساعدة لتحويل وحدات rem إلى وحدات px
const convertRemToPx = (remValue: string): string => {
  if (remValue.endsWith('rem')) {
    // استخراج القيمة العددية من rem
    const numValue = parseFloat(remValue.replace('rem', ''));
    // تحويل rem إلى px (1rem = 16px عادة)
    return `${Math.round(numValue * 16)}px`;
  }
  return remValue;
};

// وظيفة مساعدة لضمان أن القيمة تنتهي بـ px
const ensurePixelUnit = (value: string): string => {
  if (!value) return '';
  
  // إذا كانت رقم فقط، أضف "px"
  if (!isNaN(Number(value))) {
    return `${value}px`;
  }
  
  // إذا كانت تنتهي بـ rem، حول إلى px
  if (value.endsWith('rem')) {
    return convertRemToPx(value);
  }
  
  // إذا كانت تنتهي بـ px، أعدها كما هي
  if (value.endsWith('px')) {
    return value;
  }
  
  // في حالات أخرى، أضف px
  return `${value}px`;
};

const TitleField: React.FC<TitleFieldProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  const fieldStyle = field.style || {};
  
  // استخراج الوصف من الحقل نفسه
  const description = field.helpText || '';
  
  // الحصول على المحاذاة من نمط الحقل أو الافتراضي بناءً على اللغة
  const defaultAlignment: TextAlign = language === 'ar' ? 'right' : 'left';
  
  // تحويل محاذاة السلسلة إلى نوع TextAlign مع التحقق
  const getValidAlignment = (align?: string): TextAlign => {
    if (align === 'left' || align === 'center' || align === 'right' || align === 'justify') {
      return align as TextAlign;
    }
    return defaultAlignment;
  };
  
  const alignment = getValidAlignment(fieldStyle.textAlign);
  
  // استخدام قيم بكسل دقيقة بدلاً من rem للحصول على حجم متسق عبر البيئات
  const isFormTitle = field.type === 'form-title';
  
  // تجهيز حجم الخط مع ضمان استخدام وحدات px
  let titleFontSize = isFormTitle ? '24px' : '20px'; // القيمة الافتراضية
  if (fieldStyle.fontSize) {
    // تأكد من تحويل وحدات rem إلى px والمحافظة على وحدات px
    titleFontSize = ensurePixelUnit(fieldStyle.fontSize);
  }
  
  // تجهيز حجم خط الوصف مع ضمان استخدام وحدات px
  let descriptionFontSize = '14px'; // القيمة الافتراضية
  if (fieldStyle.descriptionFontSize) {
    descriptionFontSize = ensurePixelUnit(fieldStyle.descriptionFontSize);
  }
  
  // الحصول على لون الخلفية مع القيمة الافتراضية
  const backgroundColor = fieldStyle.backgroundColor || formStyle.primaryColor || '#9b87f5';
  
  // نمط الخلفية مع قيم بكسل ثابتة للبادينغ
  const backgroundStyle = {
    backgroundColor: backgroundColor,
    padding: '16px', // قيم دقيقة لتطابق بين المعاينة والمتجر
    borderRadius: formStyle.borderRadius || '8px',
    width: '100%',
    boxSizing: 'border-box' as BoxSizing,
    marginBottom: '16px', // قيم دقيقة لتطابق بين المعاينة والمتجر
    textAlign: alignment as React.CSSProperties['textAlign'],
  };

  // أنماط العنوان
  const titleStyle = {
    color: fieldStyle.color || '#ffffff',
    fontSize: titleFontSize,
    textAlign: alignment as React.CSSProperties['textAlign'],
    fontWeight: fieldStyle.fontWeight || (isFormTitle ? 'bold' : 'medium'),
    fontFamily: fieldStyle.fontFamily || 'inherit',
    margin: '0',
    padding: '0',
    lineHeight: '1.3', // قيمة متسقة 
    display: 'block',
  };

  // أنماط الوصف
  const descriptionStyle = {
    color: fieldStyle.descriptionColor || 'rgba(255, 255, 255, 0.9)',
    fontSize: descriptionFontSize,
    margin: '6px 0 0 0', // قيمة دقيقة للتطابق
    padding: '0',
    textAlign: alignment as React.CSSProperties['textAlign'],
    fontFamily: fieldStyle.fontFamily || 'inherit',
    fontWeight: 'normal',
    lineHeight: '1.5', // قيمة متسقة
    opacity: '0.9',
  };

  // إنشاء معرف فريد لهذا الحقل
  const titleFieldId = `title-field-${field.id}-${Date.now()}`;

  return (
    <div 
      id={titleFieldId}
      className={`mb-4 ${isFormTitle ? 'codform-title' : ''}`}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      data-testid="title-field"
      data-title-align={alignment}
      data-has-bg="true"
      data-title-color={fieldStyle.color || '#ffffff'}
      data-bg-color={backgroundColor}
      data-font-family={fieldStyle.fontFamily || ''}
      data-field-type={field.type}
      data-font-size={titleFontSize}
      data-font-weight={fieldStyle.fontWeight || (isFormTitle ? 'bold' : 'medium')}
      data-desc-font-size={descriptionFontSize}
      data-desc-color={fieldStyle.descriptionColor || 'rgba(255, 255, 255, 0.9)'}
      data-desc-font-weight='normal'
    >
      <div className="codform-title-container" style={backgroundStyle}>
        <h3 
          className={isFormTitle ? "codform-form-title" : ""}
          style={titleStyle}
        >
          {field.label}
        </h3>
        
        {description && (
          <p 
            className="codform-title-description"
            style={descriptionStyle}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default TitleField;
