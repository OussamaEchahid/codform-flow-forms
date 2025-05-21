
import React, { useEffect, useState, useMemo } from 'react';
import { FormField, FloatingButtonConfig, deepCloneField } from '@/lib/form-utils';
import FormPreview from '@/components/form/FormPreview';
import { useI18n } from '@/lib/i18n';

interface FormStyle {
  primaryColor: string;
  borderRadius: string;
  fontSize: string;
  buttonStyle: string;
  // إضافة خصائص نمط جديدة
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
}

interface FormPreviewPanelProps {
  formTitle: string;
  formDescription: string;
  currentStep: number;
  totalSteps: number;
  formStyle: FormStyle;
  fields: FormField[];
  onPreviousStep?: () => void;
  onNextStep?: () => void;
  refreshKey: number;
  floatingButton?: FloatingButtonConfig;
  hideFloatingButtonPreview?: boolean;
}

// معرف ثابت لعنوان النموذج - يجب أن يتطابق مع FormPreview
const FORM_TITLE_ID = 'form-title-static';

// تحسين دالة النسخ العميق مع دعم كامل لـ TypeScript
const deepCloneFields = (fields: FormField[]): FormField[] => {
  if (!fields) return [];
  
  return fields.map(field => {
    // إنشاء نسخة عميقة كاملة من الحقل
    const newField = deepCloneField(field);
    
    // التأكد من نسخ كائن النمط بشكل صحيح مع جميع الخصائص
    if (field.style) {
      newField.style = JSON.parse(JSON.stringify(field.style));
    }
    
    return newField;
  });
};

const FormPreviewPanel: React.FC<FormPreviewPanelProps> = ({
  formTitle,
  formDescription,
  currentStep,
  totalSteps,
  formStyle,
  fields,
  onPreviousStep,
  onNextStep,
  refreshKey,
  floatingButton,
  hideFloatingButtonPreview = false
}) => {
  const { language } = useI18n();
  
  // استخدم مفتاح تحديث داخلي لمنع حلقات العرض
  const [internalRefreshKey, setInternalRefreshKey] = useState(0);
  
  // تحديث المفتاح الداخلي فقط عند زيادة مفتاح التحديث
  useEffect(() => {
    if (refreshKey > internalRefreshKey) {
      setInternalRefreshKey(refreshKey);
    }
  }, [refreshKey, internalRefreshKey]);
  
  // معالجة جميع الحقول مع نسخ عميق لمنع التعديلات - أمر بالغ الأهمية لاستقرار النموذج
  const processedFields = useMemo(() => {
    console.log("Processing fields for preview, original count:", fields?.length || 0);
    
    // إنشاء نسخة عميقة من جميع الحقول لمنع التعديلات
    const clonedFields = deepCloneFields(fields);
    
    // البحث عن حقول العنوان الموجودة - ضمان المراجع المستقرة
    const titleFieldById = clonedFields.find(field => field.id === FORM_TITLE_ID);
    const titleFieldByType = clonedFields.find(field => field.type === 'form-title' && field.id !== FORM_TITLE_ID);
    
    // تحديد حقل العنوان المراد استخدامه (الأولوية حسب المعرّف، ثم حسب النوع)
    const titleField = titleFieldById || titleFieldByType;
    
    console.log("Title field found:", titleField?.id, "Type:", titleField?.type, 
                "Style:", titleField?.style?.backgroundColor,
                "ShowTitle:", titleField?.style?.showTitle,
                "ShowDescription:", titleField?.style?.showDescription);
    
    // تصفية جميع حقول form-title لتجنب التكرار
    let filteredFields = clonedFields.filter(field => {
      // الاحتفاظ بالحقول غير العنوان
      if (field.type !== 'form-title') return true;
      
      // الاحتفاظ بحقل عنوان واحد فقط - الأولوية للحقل ذي المعرف القياسي
      if (field.id === FORM_TITLE_ID) return true;
      
      // إزالة جميع حقول form-title الأخرى
      return false;
    });
    
    // إذا لم يكن لدينا أي حقل عنوان، فأنشئ واحدًا مع أنماط محفوظة
    if (!titleField) {
      console.log("Creating new title field with default styles");
      const newTitleField: FormField = {
        type: 'form-title',
        id: FORM_TITLE_ID,
        label: formTitle || '',
        helpText: formDescription || '',
        style: {
          // استخدام primaryColor لخلفية العنوان
          backgroundColor: formStyle.primaryColor || '#9b87f5',
          color: '#ffffff',
          textAlign: language === 'ar' ? 'right' : 'center',
          fontSize: '24px',
          fontWeight: 'bold',
          descriptionColor: 'rgba(255, 255, 255, 0.9)',
          descriptionFontSize: '14px',
          borderRadius: formStyle.borderRadius, 
          paddingY: '16px',
          showTitle: true,
          showDescription: true
        }
      };
      
      // إضافة حقل العنوان في البداية
      filteredFields = [newTitleField, ...filteredFields];
    } 
    // إذا كان لدينا حقل عنوان ولكنه لا يحتوي على المعرف القياسي
    else if (titleField && titleField.id !== FORM_TITLE_ID) {
      // إنشاء حقل عنوان جديد بمعرف قياسي ولكن الحفاظ على جميع الخصائص الأخرى والنمط
      const standardizedTitle: FormField = {
        ...titleField,
        id: FORM_TITLE_ID,
        type: 'form-title',
        label: formTitle || titleField.label || '',
        helpText: formDescription || titleField.helpText || '',
        // تأكد من الحفاظ على جميع خصائص النمط عن طريق النسخ العميق
        style: JSON.parse(JSON.stringify(titleField.style || {}))
      };
      
      console.log("Standardizing title field, preserving styles:", 
                  standardizedTitle.style?.backgroundColor,
                  "ShowTitle:", standardizedTitle.style?.showTitle,
                  "ShowDescription:", standardizedTitle.style?.showDescription);
      
      // استبدال حقل العنوان الموجود بالحقل المعياري
      filteredFields = filteredFields.filter(field => field.id !== titleField.id);
      filteredFields = [standardizedTitle, ...filteredFields];
    }
    // إذا كان لدينا حقل عنوان بالمعرف القياسي، فقم بتحديث التسمية والوصف
    // لكن احتفظ بجميع إعدادات النمط لمنع فقدان النمط عند التحديث
    else if (titleFieldById) {
      const titleIndex = filteredFields.findIndex(field => field.id === FORM_TITLE_ID);
      if (titleIndex !== -1) {
        // عمل نسخة عميقة من النمط لمنع التعديلات
        const preservedStyle = JSON.parse(JSON.stringify(filteredFields[titleIndex].style || {}));
        
        console.log("Updating existing title field, preserving style:", 
                    preservedStyle.backgroundColor || "not set",
                    "formStyle primaryColor:", formStyle.primaryColor,
                    "ShowTitle:", preservedStyle.showTitle,
                    "ShowDescription:", preservedStyle.showDescription);
                    
        // إصلاح حاسم: إنشاء كائن جديد تمامًا لمنع مشاكل المرجعية
        filteredFields[titleIndex] = {
          type: 'form-title',
          id: FORM_TITLE_ID,
          label: formTitle || filteredFields[titleIndex].label || '',
          helpText: formDescription || filteredFields[titleIndex].helpText || '',
          // أساسي: الحفاظ على جميع خصائص النمط الموجودة
          style: preservedStyle
        };
      }
    }
    
    // إضافة زر إرسال افتراضي إذا لزم الأمر
    const hasSubmitButton = filteredFields.some(field => field.type === 'submit');
    
    if (!hasSubmitButton) {
      const submitButton: FormField = {
        type: 'submit',
        id: `submit-stable`,
        label: language === 'ar' ? 'إرسال الطلب' : 'Submit Order',
        style: {
          backgroundColor: formStyle.primaryColor || '#9b87f5',
          color: '#ffffff',
          fontSize: '18px',
          animation: true,
          animationType: 'pulse',
        },
      };
      filteredFields.push(submitButton);
    }
    
    console.log("Final processed fields count:", filteredFields.length);
    return filteredFields;
  }, [fields, language, formStyle.primaryColor, formStyle.backgroundColor, formStyle.borderRadius, formTitle, formDescription, formStyle.formDirection]);

  // تحضير نمط النموذج للمعاينة مع لون خلفية افتراضي
  // التأكد من أن لدينا جميع خصائص النمط المطلوبة مع القيم الافتراضية
  const previewFormStyle = {
    ...formStyle,
    backgroundColor: formStyle.backgroundColor || '#F9FAFB', // لون خلفية افتراضي
    borderRadius: formStyle.borderRadius || '1.5rem', // نصف قطر حدود كبير
    borderColor: formStyle.borderColor || '#9b87f5', // لون حدود افتراضي
    borderWidth: formStyle.borderWidth || '2px',     // عرض حدود افتراضي
  };

  return (
    <div>
      <h3 className={`text-lg font-medium mb-3 ${language === 'ar' ? 'text-right' : ''}`}>
        {language === 'ar' ? 'معاينة مباشرة' : 'Live Preview'}
      </h3>
      
      <div className="border rounded-lg p-3 bg-gray-50">
        <FormPreview 
          key={`preview-${internalRefreshKey}`}
          formTitle={formTitle}
          formDescription={formDescription}
          currentStep={currentStep}
          totalSteps={totalSteps}
          formStyle={previewFormStyle}
          fields={processedFields}
          floatingButton={floatingButton}
          hideFloatingButtonPreview={hideFloatingButtonPreview}
        >
          <div></div>
        </FormPreview>
      </div>
      
      <div className="mt-2 text-xs text-gray-500 p-2 rounded text-center">
        {language === 'ar' 
          ? 'المعاينة تعكس بدقة كيف سيظهر النموذج في متجر Shopify'
          : 'This preview accurately reflects how the form will appear in your Shopify store'}
      </div>
    </div>
  );
};

export default React.memo(FormPreviewPanel);
