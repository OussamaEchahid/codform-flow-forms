
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

// Convert rem to px for consistent styling
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
  
  // استخراج الوصف من الحقل نفسه
  const description = field.helpText || '';
  
  // التحقق مما إذا كان يجب إظهار العنوان والوصف
  const showTitle = fieldStyle.showTitle !== false;
  const showDescription = fieldStyle.showDescription !== false;
  
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
  const defaultTitleSize = isFormTitle ? '24px' : '20px';
  const defaultDescSize = '14px';
  
  // تحويل جميع قيم الأحجام إلى بكسل
  const fontSize = remToPx(fieldStyle.fontSize, defaultTitleSize);
  const descriptionFontSize = remToPx(fieldStyle.descriptionFontSize, defaultDescSize);
  
  // الحصول على لون الخلفية مع القيمة الافتراضية
  const backgroundColor = fieldStyle.backgroundColor || formStyle.primaryColor || '#9b87f5';
  
  // نمط الخلفية مع قيم بكسل ثابتة للبادينغ
  const backgroundStyle = {
    backgroundColor: backgroundColor,
    padding: '16px', // Exact padding to match between preview and store
    borderRadius: formStyle.borderRadius || '8px',
    width: '100%',
    boxSizing: 'border-box' as BoxSizing,
    marginBottom: '16px', // Exact margin to match between preview and store
    textAlign: alignment as React.CSSProperties['textAlign'],
  };

  // أنماط العنوان
  const titleStyle = {
    color: fieldStyle.color || '#ffffff',
    fontSize: fontSize,
    textAlign: alignment as React.CSSProperties['textAlign'],
    fontWeight: fieldStyle.fontWeight || (isFormTitle ? 'bold' : 'medium'),
    fontFamily: fieldStyle.fontFamily || 'inherit',
    margin: '0',
    padding: '0',
    lineHeight: '1.3', // Consistent line height
    display: 'block',
  };

  // أنماط الوصف
  const descriptionStyle = {
    color: fieldStyle.descriptionColor || '#ffffff',
    fontSize: descriptionFontSize,
    margin: '6px 0 0 0', // Consistent margin
    padding: '0',
    textAlign: alignment as React.CSSProperties['textAlign'],
    fontFamily: fieldStyle.fontFamily || 'inherit',
    fontWeight: 'normal',
    lineHeight: '1.5', // Consistent line height
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
      data-font-size={fontSize}
      data-font-weight={fieldStyle.fontWeight || (isFormTitle ? 'bold' : 'medium')}
      data-desc-font-size={descriptionFontSize}
      data-desc-color={fieldStyle.descriptionColor || '#ffffff'}
      data-desc-font-weight='normal'
      data-show-title={showTitle.toString()}
      data-show-description={showDescription.toString()}
    >
      <div 
        className="codform-title-container" 
        style={backgroundStyle}
      >
        {showTitle && (
          <h3 
            className={isFormTitle ? "codform-form-title" : ""}
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
    </div>
  );
};

export default TitleField;
