
import React, { useEffect, useState, useCallback } from 'react';
import { FormField, FloatingButtonConfig } from '@/lib/form-utils';
import FormPreview from '@/components/form/FormPreview';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AlignLeft, AlignRight } from 'lucide-react'; 

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
  refreshKey?: number;
  floatingButton?: FloatingButtonConfig;
  hideFloatingButtonPreview?: boolean;
}

// الحصول على اتجاه النموذج من التخزين المحلي مع الاعتماد على القيمة الافتراضية
const getSavedDirection = (): 'ltr' | 'rtl' => {
  try {
    const savedDirection = localStorage.getItem('codform_direction');
    if (savedDirection === 'ltr' || savedDirection === 'rtl') {
      return savedDirection;
    }
  } catch (e) {
    console.error("خطأ في الوصول إلى التخزين المحلي:", e);
  }
  return 'ltr'; // الاتجاه الافتراضي
};

// حفظ اتجاه النموذج في التخزين المحلي
const saveDirection = (direction: 'ltr' | 'rtl'): void => {
  try {
    localStorage.setItem('codform_direction', direction);
    console.log(`تم حفظ الاتجاه في التخزين المحلي: ${direction}`);
  } catch (e) {
    console.error("خطأ في حفظ الاتجاه في التخزين المحلي:", e);
  }
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
  refreshKey = 0,
  floatingButton,
  hideFloatingButtonPreview = false
}) => {
  const { language } = useI18n();
  
  // استخدام القيمة المحفوظة من التخزين المحلي أو القيمة الافتراضية بناءً على اللغة
  const [direction, setDirection] = useState<'ltr' | 'rtl'>(() => {
    const savedDir = getSavedDirection();
    // إذا لم تكن هناك قيمة محفوظة، استخدم اللغة لتحديد الاتجاه
    return savedDir || (language === 'ar' ? 'rtl' : 'ltr');
  });
  
  // مفتاح تحديث داخلي لفرض إعادة الرسم عند الحاجة
  const [internalRefreshKey, setInternalRefreshKey] = useState(Date.now());
  
  // إعادة تعيين الاتجاه عند تغيير اللغة
  useEffect(() => {
    const newDirection = language === 'ar' ? 'rtl' : 'ltr';
    setDirection(newDirection);
    saveDirection(newDirection);
  }, [language]);
  
  // آلية تحديث أكثر فعالية
  const forceRefresh = useCallback(() => {
    // إنشاء مفتاح فريد حقًا من خلال الجمع بين الطابع الزمني وقيمة عشوائية
    const uniqueKey = Date.now() + Math.random();
    setInternalRefreshKey(uniqueKey);
    console.log(`تم فرض تحديث المعاينة بمفتاح: ${uniqueKey}`);
  }, []);
  
  // فرض التحديث عند تغيير أي خاصية لضمان تحديث المعاينة المباشرة على الفور
  useEffect(() => {
    forceRefresh();
  }, [fields, formStyle, formTitle, formDescription, refreshKey, direction, forceRefresh]);
  
  // معالجة الحقول لتطبيع قيم الأيقونات - ضروري للمعاينة
  const processedFields = React.useMemo(() => {
    return fields.map(field => {
      // إنشاء كائن حقل جديد لتجنب مشاكل التعديل المباشر
      const updatedField = { ...field };
      
      // تحويل سلاسل الأيقونات الفارغة إلى 'none'
      if (updatedField.icon === '') {
        updatedField.icon = 'none';
      }
      
      // التأكد من معالجة showIcon بشكل صحيح
      if (updatedField.icon && updatedField.icon !== 'none') {
        if (!updatedField.style) {
          updatedField.style = {};
        }
        
        // تعيين showIcon إلى true افتراضيًا إذا كانت الأيقونة موجودة ولم يتم تعيينها صراحةً إلى false
        updatedField.style.showIcon = updatedField.style?.showIcon !== undefined 
          ? updatedField.style.showIcon 
          : true;
      }
      
      // التأكد من أن حجم الخط يستخدم وحدات px متسقة
      if (updatedField.style?.fontSize && !updatedField.style.fontSize.includes('px')) {
        // تحويل rem إلى px للاتساق
        if (updatedField.style.fontSize.includes('rem')) {
          const remValue = parseFloat(updatedField.style.fontSize);
          updatedField.style.fontSize = `${remValue * 16}px`;
        } else if (!isNaN(parseFloat(updatedField.style.fontSize))) {
          // إذا كان مجرد رقم بدون وحدة، فافترض أنه بوحدة px
          updatedField.style.fontSize = `${updatedField.style.fontSize}px`;
        }
      }
      
      // بالنسبة لحقول العنوان، فرض محاذاة النص إلى الوسط للاتساق مع المتجر
      if (updatedField.type === 'form-title' || updatedField.type === 'title') {
        if (!updatedField.style) {
          updatedField.style = {};
        }
        updatedField.style.textAlign = 'center';
      }
      
      // تسجيل تغييرات لون الخلفية لتصحيح الأخطاء
      if (updatedField.type === 'form-title' || updatedField.type === 'title') {
        console.log(`لون خلفية حقل العنوان: ${updatedField.style?.backgroundColor || 'غير محدد'}`);
      }
      
      return updatedField;
    });
  }, [fields]);

  // إنشاء معرف فريد لهذه اللوحة
  const previewPanelId = `preview-panel-${internalRefreshKey}`;
  
  // استخدام لون خلفية متسق للمعاينة
  const previewBackgroundColor = "#F9FAFB";

  // معالج تغيير الاتجاه مع تحديث أكثر فعالية
  const handleDirectionChange = (value: string) => {
    if (value === 'ltr' || value === 'rtl') {
      // تعيين الاتجاه الجديد
      setDirection(value as 'ltr' | 'rtl');
      
      // حفظ الاتجاه في التخزين المحلي للاستمرارية
      saveDirection(value as 'ltr' | 'rtl');
      
      // تسجيل تغيير الاتجاه
      console.log(`تم تغيير اتجاه النموذج إلى: ${value}`);
      
      // فرض تحديث لإعادة بناء المكون بالكامل
      forceRefresh();
    }
  };

  return (
    <div 
      id={previewPanelId} 
      style={{backgroundColor: previewBackgroundColor}} 
      className="bg-gray-50"
      data-direction={direction}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className={`text-lg font-medium ${language === 'ar' ? 'text-right' : ''}`}>
          {language === 'ar' ? 'معاينة مباشرة' : 'Live Preview'}
        </h3>
        
        <div className="direction-controls">
          <ToggleGroup 
            type="single" 
            value={direction} 
            onValueChange={handleDirectionChange} 
            variant="outline"
            className="border rounded"
          >
            <ToggleGroupItem value="ltr" aria-label="من اليسار إلى اليمين">
              <AlignLeft className="h-4 w-4" />
              <span className="sr-only">LTR</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="rtl" aria-label="من اليمين إلى اليسار">
              <AlignRight className="h-4 w-4" />
              <span className="sr-only">RTL</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      
      <div 
        className="border rounded-lg p-3 bg-gray-50"
        style={{backgroundColor: previewBackgroundColor}}
      >
        <FormPreview 
          key={`preview-${internalRefreshKey}`}
          formTitle={formTitle}
          formDescription={formDescription}
          currentStep={currentStep}
          totalSteps={totalSteps}
          formStyle={formStyle}
          fields={processedFields}
          formDirection={direction}
          floatingButton={floatingButton}
          hideFloatingButtonPreview={hideFloatingButtonPreview}
        >
          <div></div>
        </FormPreview>
      </div>
      
      {/* معلومات تصحيح الأخطاء */}
      <div className="mt-2 text-xs bg-gray-100 p-2 rounded border border-gray-200">
        <p>
          {language === 'ar' 
            ? `الاتجاه الحالي: ${direction} - مفتاح التحديث: ${internalRefreshKey.toString().substring(0, 8)}`
            : `Current direction: ${direction} - Refresh key: ${internalRefreshKey.toString().substring(0, 8)}`}
        </p>
      </div>
      
      {/* ملاحظة صغيرة حول محاذاة المعاينة/المتجر */}
      <div className="mt-2 text-xs text-gray-500 p-2 rounded">
        {language === 'ar' 
          ? 'تأكد من أن جميع العناصر في المعاينة تظهر بنفس الشكل في متجر Shopify'
          : 'Ensure all elements in the preview appear the same way in the Shopify store'}
      </div>
    </div>
  );
};

export default FormPreviewPanel;
