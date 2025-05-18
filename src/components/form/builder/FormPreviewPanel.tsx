
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
  
  // إضافة وظيفة تسجيل للتغييرات
  useEffect(() => {
    console.log('FormPreviewPanel: Refreshing preview with new data', { 
      refreshKey,
      fieldsCount: fields.length,
      formTitle,
      formStyle
    });
    
    // رقم متتبع إضافي لقياس مدى استجابة المعاينة للتغييرات
    const updateTracker = `update-${Date.now()}`;
    console.log(`Preview refresh tracker: ${updateTracker}`);
    
    // تسجيل معلومات عن العنوان إذا كان موجوداً
    const titleField = fields.find(f => f.type === 'form-title');
    if (titleField) {
      console.log('Title field found:', { 
        id: titleField.id,
        label: titleField.label,
        backgroundColor: titleField.style?.backgroundColor,
        textColor: titleField.style?.color
      });
    }
    
    // تسجيل معلومات عن الحقول ذات الأيقونات
    const fieldsWithIcons = fields.filter(f => f.icon && f.icon !== 'none');
    if (fieldsWithIcons.length > 0) {
      console.log(`Fields with icons: ${fieldsWithIcons.length}`);
      fieldsWithIcons.forEach(f => {
        console.log(`Icon field: ${f.id}, type: ${f.type}, icon: ${f.icon}, showIcon: ${f.style?.showIcon !== false}`);
      });
    }
    
    setInternalRefreshKey(Date.now());
  }, [fields, formStyle, formTitle, formDescription, refreshKey]);
  
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
      if (updatedField.style?.fontSize && !updatedField.style.fontSize.includes('px')) {
        // تحويل rem إلى px للتناسق
        if (updatedField.style.fontSize.includes('rem')) {
          const remValue = parseFloat(updatedField.style.fontSize);
          updatedField.style.fontSize = `${remValue * 16}px`;
        } else if (!isNaN(parseFloat(updatedField.style.fontSize))) {
          // إذا كان رقمًا بدون وحدة، نفترض أنه بكسل
          updatedField.style.fontSize = `${updatedField.style.fontSize}px`;
        }
      }
      
      // إضافة سمة تتبع خاصة لتسهيل تحديد المشكلات
      updatedField.trackingId = `${field.id}-${Date.now()}`;
      
      return updatedField;
    });
  }, [fields, internalRefreshKey]);

  // إنشاء معرف فريد لمكون المعاينة هذا
  const previewPanelId = `preview-panel-${Date.now()}`;

  return (
    <div id={previewPanelId} data-preview-refresh-key={internalRefreshKey}>
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
