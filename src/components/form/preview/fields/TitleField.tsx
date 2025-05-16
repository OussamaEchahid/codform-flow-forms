
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
  
  // تحديد الاتجاه النصي (RTL/LTR) بوضوح
  const isRTL = language === 'ar';
  
  // نمط الخلفية مع قيم بكسل ثابتة للبادينغ والتأكيد بواسطة !important
  const backgroundStyle = {
    backgroundColor: backgroundColor + " !important",
    padding: '16px !important', // قيمة بكسل دقيقة لبادينغ متسق
    borderRadius: (formStyle.borderRadius || '8px') + " !important",
    width: '100% !important',
    boxSizing: 'border-box' as BoxSizing,
    marginBottom: '16px !important', // هامش سفلي متسق
    display: 'block !important'
  };

  // أنماط العنوان مع تأكيد !important
  const titleStyle = {
    color: (fieldStyle.color || '#ffffff') + " !important",
    fontSize: (fieldStyle.fontSize || fontSize) + " !important",
    textAlign: alignment + " !important",
    fontWeight: (fieldStyle.fontWeight || (isFormTitle ? 'bold' : 'medium')) + " !important",
    fontFamily: (fieldStyle.fontFamily || 'inherit') + " !important",
    margin: '0 !important',
    padding: '0 !important',
    lineHeight: '1.3 !important', // ارتفاع سطر متسق
    direction: isRTL ? 'rtl' : 'ltr'
  };

  // أنماط الوصف مع تأكيد !important
  const descriptionStyle = {
    color: (fieldStyle.descriptionColor || '#ffffff') + " !important",
    fontSize: (fieldStyle.descriptionFontSize || descriptionFontSize) + " !important",
    margin: '8px 0 0 0 !important', // هوامش متسقة
    padding: '0 !important',
    textAlign: alignment + " !important",
    fontFamily: (fieldStyle.fontFamily || 'inherit') + " !important",
    fontWeight: 'normal !important', // تغيير من descriptionFontWeight إلى قيمة ثابتة
    lineHeight: '1.5 !important', // ارتفاع سطر متسق للوصف
    direction: isRTL ? 'rtl' : 'ltr'
  };

  // إنشاء معرف فريد لهذا الحقل
  const titleFieldId = `title-field-${field.id}-${Date.now()}`;

  return (
    <div 
      id={titleFieldId}
      className={`mb-4 ${isFormTitle ? 'codform-title' : ''}`}
      dir={isRTL ? 'rtl' : 'ltr'}
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
