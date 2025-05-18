
import React, { useEffect, useState } from 'react';
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

// Helper function to convert rem to px
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
  const [internalRefreshKey, setInternalRefreshKey] = useState(Date.now());
  
  // فرض التحديث عند تغيير أي خاصية لضمان تحديث المعاينة المباشرة فورًا
  useEffect(() => {
    setInternalRefreshKey(Date.now());
  }, [fields, formStyle, formTitle, formDescription, refreshKey, JSON.stringify(fields)]);
  
  // معالجة الحقول لتطبيع قيم الأيقونة - ضروري لعرض المعاينة
  const processedFields = React.useMemo(() => {
    return fields.map(field => {
      // إنشاء كائن حقل جديد لتجنب مشاكل التغيير المباشر
      const updatedField = { ...field };
      
      // تحويل سلاسل الأيقونات الفارغة إلى 'none'
      if (updatedField.icon === '') {
        updatedField.icon = 'none';
      }
      
      // ضمان معالجة showIcon بشكل صحيح
      if (updatedField.icon && updatedField.icon !== 'none') {
        if (!updatedField.style) {
          updatedField.style = {};
        }
        
        // تعيين showIcon افتراضيًا إلى true ما لم يتم تعيينه صراحة إلى false
        updatedField.style.showIcon = updatedField.style?.showIcon !== undefined 
          ? updatedField.style.showIcon 
          : true;
      }
      
      // التأكد من أن حجم الخط يستخدم وحدات px المتسقة
      if (updatedField.style?.fontSize) {
        updatedField.style.fontSize = remToPx(updatedField.style.fontSize, '16px');
      }
      
      // التأكد من أن حجم خط الوصف يستخدم وحدات px المتسقة
      if (updatedField.style?.descriptionFontSize) {
        updatedField.style.descriptionFontSize = remToPx(updatedField.style.descriptionFontSize, '14px');
      }
      
      return updatedField;
    });
  }, [fields, internalRefreshKey]); // إضافة internalRefreshKey إلى التبعيات لضمان إعادة العرض

  // إنشاء معرف فريد لمكون المعاينة هذا
  const previewPanelId = `preview-panel-${Date.now()}`;

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
      
      {/* إضافة تعليق صغير للتنبيه حول ضرورة توافق المعاينة مع العرض في المتجر */}
      <div className="mt-2 text-xs text-gray-500 p-2 rounded">
        {language === 'ar' 
          ? 'تأكد من أن جميع العناصر في المعاينة تظهر بنفس الشكل في متجر Shopify'
          : 'Ensure all elements in the preview appear the same way in the Shopify store'}
      </div>
    </div>
  );
};

export default FormPreviewPanel;
