
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
  direction?: 'ltr' | 'rtl'; // أضفنا خاصية الاتجاه ولكن سنتجاهلها في هذا المكون
}

// Define valid text alignment options
type TextAlign = 'left' | 'center' | 'right' | 'justify';
// Define valid box-sizing values
type BoxSizing = 'border-box' | 'content-box' | 'initial' | 'inherit';

// Helper function to convert rem units to px units for consistency
const convertRemToPx = (remValue: string): string => {
  if (remValue.endsWith('rem')) {
    // Extract numeric value from rem
    const numValue = parseFloat(remValue.replace('rem', ''));
    // Convert rem to px (1rem = 16px typically)
    return `${Math.round(numValue * 16)}px`;
  }
  return remValue;
};

// Helper function to ensure value ends with px
const ensurePixelUnit = (value: string): string => {
  if (!value) return '';
  
  // If it's just a number, add "px"
  if (!isNaN(Number(value))) {
    return `${value}px`;
  }
  
  // If it ends with rem, convert to px
  if (value.endsWith('rem')) {
    return convertRemToPx(value);
  }
  
  // If it already ends with px, return as is
  if (value.endsWith('px')) {
    return value;
  }
  
  // In other cases, add px
  return `${value}px`;
};

// Helper function to ensure we always have consistent style properties
const ensureStyleDefaults = (field: FormField): FormField => {
  const style = field.style || {};
  
  // استخدام محاذاة النص مباشرة من نمط الحقل، وليس بناءً على الاتجاه
  // هذه هي النقطة الرئيسية: حقل العنوان يحتفظ بمحاذاته الخاصة بغض النظر عن اتجاه النموذج
  const textAlignment = style.textAlign || 'left';
  
  // إنشاء حقل جديد بخصائص نمط مضمونة
  return {
    ...field,
    style: {
      ...style,
      backgroundColor: style.backgroundColor || '#9b87f5',
      color: style.color || '#ffffff',
      descriptionColor: style.descriptionColor || 'rgba(255, 255, 255, 0.9)',
      fontSize: style.fontSize || '24px',
      descriptionFontSize: style.descriptionFontSize || '14px',
      fontWeight: style.fontWeight || 'bold',
      textAlign: textAlignment // استخدام خاصية textAlign الخاصة بالحقل
    }
  };
};

const TitleField: React.FC<TitleFieldProps> = ({ field, formStyle, direction }) => {
  const { language } = useI18n();
  
  // تطبيق الإعدادات الافتراضية لضمان الاتساق
  // مهم: نحن نتجاهل وسيط الاتجاه هنا تمامًا!
  const safeField = ensureStyleDefaults(field);
  const fieldStyle = safeField.style || {};
  
  // استخراج الوصف من الحقل
  const description = field.helpText || '';
  
  // الحصول على محاذاة النص مباشرة من نمط الحقل، وليس بناءً على الاتجاه
  const alignment: TextAlign = (fieldStyle.textAlign as TextAlign) || 'left';
  
  // استخدام قيم بكسل دقيقة بدلاً من rem للحصول على حجم متسق عبر البيئات
  const isFormTitle = field.type === 'form-title';
  
  // إعداد حجم الخط مع ضمان وحدات px
  let titleFontSize = isFormTitle ? '24px' : '20px'; // قيمة افتراضية
  if (fieldStyle.fontSize) {
    // ضمان تحويل وحدات rem إلى px والحفاظ على وحدات px
    titleFontSize = ensurePixelUnit(fieldStyle.fontSize);
  }
  
  // إعداد حجم خط الوصف مع ضمان وحدات px
  let descriptionFontSize = '14px'; // قيمة افتراضية
  if (fieldStyle.descriptionFontSize) {
    descriptionFontSize = ensurePixelUnit(fieldStyle.descriptionFontSize);
  }
  
  // الحصول على لون الخلفية مع القيمة الافتراضية
  const backgroundColor = fieldStyle.backgroundColor || formStyle.primaryColor || '#9b87f5';
  
  // نمط الخلفية مع قيم بكسل ثابتة للاتساق
  const backgroundStyle = {
    backgroundColor: backgroundColor,
    padding: '16px', // قيم دقيقة للاتساق بين المعاينة والمتجر
    borderRadius: formStyle.borderRadius || '8px',
    width: '100%',
    boxSizing: 'border-box' as BoxSizing,
    marginBottom: '16px', // قيم دقيقة للاتساق بين المعاينة والمتجر
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
    margin: '6px 0 0 0', // قيمة دقيقة للاتساق
    padding: '0',
    textAlign: alignment as React.CSSProperties['textAlign'],
    fontFamily: fieldStyle.fontFamily || 'inherit',
    fontWeight: 'normal',
    lineHeight: '1.5', // قيمة متسقة
    opacity: '0.9',
  };

  // إنشاء معرف فريد لهذا الحقل
  const titleFieldId = `title-field-${field.id}-${Date.now()}`;

  // مهم: يتم تحديد السمة "dir" لحقل العنوان الآن بواسطة قيمة المحاذاة
  // بدلاً من اتجاه النموذج الأصلي
  const titleDirection = alignment === 'right' ? 'rtl' : 'ltr';

  return (
    <div 
      id={titleFieldId}
      className={`mb-4 ${isFormTitle ? 'codform-title' : ''}`}
      dir={titleDirection} // استخدام اتجاه العنوان الخاص به بناءً على محاذاته
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
