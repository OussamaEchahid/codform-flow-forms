
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
  
  // استخدم قيم بكسل متسقة بدلاً من rem لضمان تطابق الحجم الدقيق
  const fontSize = isFormTitle ? '24px' : '20px'; // 1.5rem = 24px, 1.25rem = 20px
  const descriptionFontSize = '14px'; // 0.875rem = 14px
  
  // الحصول على لون الخلفية مع القيمة الافتراضية
  const backgroundColor = fieldStyle.backgroundColor || formStyle.primaryColor || '#9b87f5';
  
  // نمط الخلفية مع قيم بكسل ثابتة للبادينغ
  const backgroundStyle = {
    backgroundColor: backgroundColor,
    padding: '16px', // قيمة بكسل دقيقة لبادينغ متسق
    borderRadius: formStyle.borderRadius || '8px',
    width: '100%',
    boxSizing: 'border-box' as BoxSizing,
    marginBottom: '16px', // هامش سفلي متسق
  };

  // أنماط العنوان
  const titleStyle = {
    color: fieldStyle.color || '#ffffff',
    fontSize: fieldStyle.fontSize || fontSize,
    textAlign: alignment,
    fontWeight: fieldStyle.fontWeight || (isFormTitle ? 'bold' : 'medium'),
    fontFamily: fieldStyle.fontFamily || 'inherit',
    margin: '0',
    padding: '0',
    lineHeight: '1.3', // ارتفاع سطر متسق
  };

  // أنماط الوصف
  const descriptionStyle = {
    color: fieldStyle.descriptionColor || '#ffffff',
    fontSize: fieldStyle.descriptionFontSize || descriptionFontSize,
    margin: '8px 0 0 0', // هوامش متسقة
    padding: '0',
    textAlign: alignment,
    fontFamily: fieldStyle.fontFamily || 'inherit',
    fontWeight: 'normal', // تغيير من descriptionFontWeight إلى قيمة ثابتة
    lineHeight: '1.5', // ارتفاع سطر متسق للوصف
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
      data-font-size={fieldStyle.fontSize || fontSize}
      data-font-weight={fieldStyle.fontWeight || (isFormTitle ? 'bold' : 'medium')}
      data-desc-font-size={fieldStyle.descriptionFontSize || descriptionFontSize}
      data-desc-font-weight='normal'
    >
      <div style={backgroundStyle} className="codform-title-container">
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
