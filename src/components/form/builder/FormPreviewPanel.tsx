
import React, { useEffect, useState, useMemo } from 'react';
import { FormField, FloatingButtonConfig } from '@/lib/form-utils';
import FormPreview from '@/components/form/FormPreview';
import { useI18n } from '@/lib/i18n';

interface FormStyle {
  primaryColor: string;
  borderRadius: string;
  fontSize: string;
  buttonStyle: string;
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
  
  // استخدام قيمة ثابتة لمفتاح التحديث الداخلي لتجنب التحديثات المتكررة
  const [internalRefreshKey, setInternalRefreshKey] = useState(0);
  
  // منع التحديث المتكرر - فقط تحديث عند التغييرات الهامة
  useEffect(() => {
    // تثبيت القيمة من خلال استخدام الدالة التالية للتأكد من عدم تحديث القيمة بشكل متكرر
    setInternalRefreshKey(prevKey => Math.max(refreshKey, prevKey));
    // إزالة refreshKey من التبعيات لمنع التحديثات المتكررة
  }, []);
  
  // استخدام useMemo لتجنب إعادة معالجة الحقول في كل تحديث
  const processedFields = useMemo(() => {
    // فحص إذا كانت الحقول فارغة أو غير معرفة
    if (!fields || fields.length === 0) {
      return [];
    }
    
    return fields.map(field => {
      if (!field || !field.id) {
        console.warn("Encountered invalid field:", field);
        return field;
      }
      
      // إنشاء نسخة جديدة من الحقل لتجنب مشاكل التعديل المباشر
      const updatedField = { ...field };
      
      // الحفاظ على معرف الحقل الأصلي - مهم جداً لاستقرار السحب والإفلات
      updatedField.id = field.id;
      
      // تحويل الأيقونات الفارغة إلى 'none'
      if (updatedField.icon === '') {
        updatedField.icon = 'none';
      }
      
      // معالجة الأيقونات بطريقة صحيحة
      if (updatedField.icon && updatedField.icon !== 'none') {
        if (!updatedField.style) {
          updatedField.style = {};
        }
        
        // تعيين showIcon إلى true بشكل افتراضي ما لم يتم تعيينه بشكل صريح إلى false
        updatedField.style.showIcon = updatedField.style?.showIcon !== undefined 
          ? updatedField.style.showIcon 
          : true;
      }
      
      // معالجة خاصة لحقول العنوان
      if (updatedField.type === 'form-title' || updatedField.type === 'title') {
        if (!updatedField.style) {
          updatedField.style = {};
        }
        
        // ضمان تعيين محاذاة النص
        if (!updatedField.style.textAlign) {
          updatedField.style.textAlign = language === 'ar' ? 'right' : 'left';
        }
        
        // ضمان لون الخلفية والنص
        updatedField.style.backgroundColor = updatedField.style.backgroundColor || '#9b87f5';
        updatedField.style.color = updatedField.style.color || '#ffffff';
        
        // ضمان أن أحجام الخطوط لها وحدات بيكسل
        if (updatedField.style.fontSize && !updatedField.style.fontSize.includes('px')) {
          if (updatedField.style.fontSize.includes('rem')) {
            const remValue = parseFloat(updatedField.style.fontSize);
            updatedField.style.fontSize = `${remValue * 16}px`;
          } else if (!isNaN(parseFloat(updatedField.style.fontSize))) {
            // إذا كان رقماً بدون وحدة، نفترض البيكسل
            updatedField.style.fontSize = `${updatedField.style.fontSize}px`;
          }
        }
        
        if (updatedField.style.descriptionFontSize && !updatedField.style.descriptionFontSize.includes('px')) {
          if (updatedField.style.descriptionFontSize.includes('rem')) {
            const remValue = parseFloat(updatedField.style.descriptionFontSize);
            updatedField.style.descriptionFontSize = `${remValue * 16}px`;
          } else if (!isNaN(parseFloat(updatedField.style.descriptionFontSize))) {
            updatedField.style.descriptionFontSize = `${updatedField.style.descriptionFontSize}px`;
          }
        } else if (!updatedField.style.descriptionFontSize) {
          updatedField.style.descriptionFontSize = '14px';
        }
      }
      
      return updatedField;
    });
  }, [fields, language]);

  // إنشاء معرف ثابت لمكون لوحة المعاينة هذا
  const previewPanelId = useMemo(() => `preview-panel-${Math.floor(Math.random() * 1000)}`, []);

  return (
    <div id={previewPanelId}>
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
          formStyle={formStyle}
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

export default FormPreviewPanel;
