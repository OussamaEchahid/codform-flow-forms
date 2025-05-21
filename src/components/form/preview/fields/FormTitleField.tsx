
import React from 'react';
import { FormField } from '@/lib/form-utils';
import { useI18n } from '@/lib/i18n';

interface FormTitleFieldProps {
  field: FormField;
  formStyle: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
    buttonStyle?: string;
    borderColor?: string;
    borderWidth?: string;
    backgroundColor?: string;
    paddingTop?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    paddingRight?: string;
    formGap?: string;
    formDirection?: 'ltr' | 'rtl';
    floatingLabels?: boolean;
  };
}

const FormTitleField: React.FC<FormTitleFieldProps> = ({ field, formStyle }) => {
  const { language } = useI18n();
  
  // استخراج خصائص النمط مع قيم افتراضية، مع إعطاء الأولوية لأنماط الحقل المحددة
  const styles = field.style || {};
  
  // التحقق من إظهار العنوان والوصف
  const showTitle = styles.showTitle !== undefined ? !!styles.showTitle : true;
  const showDescription = styles.showDescription !== undefined ? !!styles.showDescription : true;
  
  // إذا كان كل من العنوان والوصف مخفيين، لا تعرض أي شيء
  if (showTitle === false && showDescription === false) {
    return null;
  }
  
  // استخدم دائمًا لون خلفية الحقل نفسه للحصول على تناسق
  // هذا يمنع الخطأ حيث تختفي خلفية العنوان في المتجر
  const titleBackgroundColor = styles.backgroundColor || formStyle.primaryColor || '#9b87f5';

  // استخراج جميع خصائص النمط مع القيم الافتراضية
  const {
    color = '#ffffff',
    fontSize = '24px',
    fontWeight = 'bold',
    descriptionColor = 'rgba(255, 255, 255, 0.9)',
    descriptionFontSize = '14px',
    borderRadius = styles.borderRadius || formStyle.borderRadius || '8px',
    paddingY = styles.paddingY || '16px',
    textAlign: styleTextAlign,
  } = styles;

  // تحديد محاذاة النص بناءً على formStyle.formDirection ونمط الحقل واللغة
  let effectiveTextAlign;
  
  // إذا كان للحقل محاذاة نص صريحة، استخدمها أولاً
  if (styleTextAlign) {
    effectiveTextAlign = styleTextAlign;
  } 
  // وإلا، استخدم اتجاه النموذج إذا كان متاحًا
  else if (formStyle.formDirection) {
    effectiveTextAlign = formStyle.formDirection === 'rtl' ? 'right' : 'left';
  }
  // القيمة الافتراضية بناءً على اللغة
  else {
    effectiveTextAlign = language === 'ar' ? 'right' : 'center';
  }

  // تعيين الاتجاه من اليمين إلى اليسار/من اليسار إلى اليمين الصحيح بناءً على إعدادات النموذج
  const direction = formStyle.formDirection || (language === 'ar' ? 'rtl' : 'ltr');

  return (
    <div 
      className="form-title-container mb-6" 
      style={{
        backgroundColor: titleBackgroundColor, 
        borderRadius,
        padding: `${paddingY} 16px`,
        marginTop: '0',
        textAlign: effectiveTextAlign as any,
        border: 'none', 
        overflow: 'hidden',
        direction,
        boxShadow: styles.boxShadow || 'none',
        width: '100%',
      }}
      dir={direction}
      data-form-title="true"
      data-text-align={effectiveTextAlign}
      data-direction={direction}
      data-title-bg-color={titleBackgroundColor}
      data-show-title={showTitle ? 'true' : 'false'}
      data-show-description={showDescription ? 'true' : 'false'}
    >
      {showTitle && (
        <h1 
          style={{
            color: color,
            fontSize,
            fontWeight,
            margin: '0',
            padding: '0'
          }}
        >
          {field.label || ''}
        </h1>
      )}
      
      {showDescription && field.helpText && (
        <p 
          style={{
            color: descriptionColor,
            fontSize: descriptionFontSize,
            margin: (showTitle ? '8px 0 0 0' : '0'),
            padding: '0'
          }}
        >
          {field.helpText}
        </p>
      )}
    </div>
  );
};

// تحسين: تحديث مقارنة React.memo لمنع مشكلة تكرار الحقول
// استخدام مقارنة عميقة لكائنات النمط
export default React.memo(FormTitleField, (prevProps, nextProps) => {
  const prevField = prevProps.field;
  const nextField = nextProps.field;

  // التحقق من تطابق المعرفات
  if (prevField.id !== nextField.id) return false;
  
  // مقارنة خصائص الحقل الأساسية
  if (prevField.label !== nextField.label) return false;
  if (prevField.helpText !== nextField.helpText) return false;
  
  // مقارنة عميقة لكائنات النمط للتقاط جميع تغييرات النمط
  const prevStyle = JSON.stringify(prevField.style || {});
  const nextStyle = JSON.stringify(nextField.style || {});
  if (prevStyle !== nextStyle) return false;
  
  // التحقق من تغييرات اتجاه النموذج التي تؤثر على محاذاة النص
  if (prevProps.formStyle.formDirection !== nextProps.formStyle.formDirection) return false;

  // مقارنة عميقة لكائنات نمط النموذج التي قد تؤثر على عرض العنوان
  const relevantPrevFormStyle = JSON.stringify({
    borderRadius: prevProps.formStyle.borderRadius,
    primaryColor: prevProps.formStyle.primaryColor,
  });
  
  const relevantNextFormStyle = JSON.stringify({
    borderRadius: nextProps.formStyle.borderRadius,
    primaryColor: nextProps.formStyle.primaryColor,
  });
  
  if (relevantPrevFormStyle !== relevantNextFormStyle) return false;
  
  // إذا وصلنا إلى هنا، اعتبر المكونات متساوية (لا حاجة لإعادة العرض)
  return true;
});
