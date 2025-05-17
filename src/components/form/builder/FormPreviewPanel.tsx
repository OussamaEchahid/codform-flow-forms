
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
  refreshKey: number;
  floatingButton?: FloatingButtonConfig;
  hideFloatingButtonPreview?: boolean;
}

// إسترجاع اتجاه النموذج من localStorage
const getSavedDirection = (): 'ltr' | 'rtl' => {
  try {
    const savedDirection = localStorage.getItem('codform_direction');
    if (savedDirection === 'ltr' || savedDirection === 'rtl') {
      return savedDirection;
    }
  } catch (e) {
    console.error("Error accessing localStorage:", e);
  }
  return 'ltr'; // توجيه افتراضي
};

// حفظ اتجاه النموذج في localStorage
const saveDirection = (direction: 'ltr' | 'rtl'): void => {
  try {
    localStorage.setItem('codform_direction', direction);
  } catch (e) {
    console.error("Error saving direction to localStorage:", e);
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
  refreshKey,
  floatingButton,
  hideFloatingButtonPreview = false
}) => {
  const { language } = useI18n();
  
  // استخدم القيمة المحفوظة في localStorage أو اعتمد على اللغة الحالية
  const [direction, setDirection] = useState<'ltr' | 'rtl'>(() => {
    const savedDir = getSavedDirection();
    // إذا لم يتم تخزين قيمة، استخدم اللغة لتحديد الاتجاه
    return savedDir || (language === 'ar' ? 'rtl' : 'ltr');
  });
  
  const [internalRefreshKey, setInternalRefreshKey] = useState(Date.now());
  
  // إعادة ضبط الاتجاه عند تغيير اللغة
  useEffect(() => {
    const newDirection = language === 'ar' ? 'rtl' : 'ltr';
    setDirection(newDirection);
    saveDirection(newDirection);
  }, [language]);
  
  // آلية إعادة التحميل الأكثر فعالية
  const forceRefresh = useCallback(() => {
    // إنشاء مفتاح فريد حقًا من خلال دمج الطابع الزمني مع قيمة عشوائية
    const uniqueKey = Date.now() + Math.random() * 10000;
    setInternalRefreshKey(uniqueKey);
    
    // استخدم نمط تحديث مزدوج لضمان إعادة تركيب المكون بالكامل
    setTimeout(() => {
      const secondUniqueKey = Date.now() + Math.random() * 10000;
      setInternalRefreshKey(secondUniqueKey);
    }, 50);
  }, []);
  
  // إجبار التحديث عند تغيير أي خاصية لضمان تحديث المعاينة المباشرة على الفور
  useEffect(() => {
    forceRefresh();
  }, [fields, formStyle, formTitle, formDescription, refreshKey, JSON.stringify(fields), direction, forceRefresh]);
  
  // معالجة الحقول لتطبيع قيم الأيقونة - ضروري لعرض المعاينة
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
          // إذا كان مجرد رقم بدون وحدة، افترض أنه px
          updatedField.style.fontSize = `${updatedField.style.fontSize}px`;
        }
      }
      
      return updatedField;
    });
  }, [fields, internalRefreshKey]);

  // إنشاء معرف فريد لمكون المعاينة هذا
  const previewPanelId = `preview-panel-${internalRefreshKey}`;
  
  // استخدام لون خلفية متسق للمعاينة
  const previewBackgroundColor = "#F9FAFB";

  // معالجة تغيير الاتجاه مع تحديث أكثر فعالية
  const handleDirectionChange = (value: string) => {
    if (value === 'ltr' || value === 'rtl') {
      // تعيين اتجاه جديد
      setDirection(value as 'ltr' | 'rtl');
      
      // حفظ الاتجاه في localStorage للاستمرارية
      saveDirection(value as 'ltr' | 'rtl');
      
      // فرض تحديث مزدوج لإعادة تركيب المكون بالكامل
      forceRefresh();
      
      console.log(`تم تغيير الاتجاه إلى ${value} (محدود للمعاينة فقط)`);
    }
  };

  return (
    <div 
      id={previewPanelId} 
      style={{backgroundColor: previewBackgroundColor}} 
      className="bg-gray-50"
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
            <ToggleGroupItem value="ltr" aria-label="Left to right">
              <AlignLeft className="h-4 w-4" />
              <span className="sr-only">LTR</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="rtl" aria-label="Right to left">
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
          key={`preview-${internalRefreshKey}-${direction}`}
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
      
      {/* ملاحظة صغيرة حول محاذاة المعاينة / المتجر */}
      <div className="mt-2 text-xs text-gray-500 p-2 rounded">
        {language === 'ar' 
          ? 'تأكد من أن جميع العناصر في المعاينة تظهر بنفس الشكل في متجر Shopify'
          : 'Ensure all elements in the preview appear the same way in the Shopify store'}
      </div>
    </div>
  );
};

export default FormPreviewPanel;
