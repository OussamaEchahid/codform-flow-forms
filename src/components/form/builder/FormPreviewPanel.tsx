
import React, { useEffect, useState, useCallback } from 'react';
import { FormField, FloatingButtonConfig } from '@/lib/form-utils';
import FormPreview from '@/components/form/FormPreview';
import { useI18n } from '@/lib/i18n';
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
  
  // مفتاح تحديث داخلي لفرض إعادة الرسم عند الحاجة - يستخدم Date.now() لضمان قيمة فريدة في كل مرة
  const [internalRefreshKey, setInternalRefreshKey] = useState(Date.now());
  
  // دالة لإعادة الرسم بمفتاح جديد
  const forceRefresh = useCallback(() => {
    const newKey = Date.now() + Math.random();
    console.log(`إجبار إعادة الرسم بمفتاح جديد: ${newKey}`);
    setInternalRefreshKey(newKey);
  }, []);
  
  // إعادة تعيين الاتجاه عند تغيير اللغة
  useEffect(() => {
    const newDirection = language === 'ar' ? 'rtl' : 'ltr';
    setDirection(newDirection);
    saveDirection(newDirection);
  }, [language]);
  
  // تحديث عند تغير أي من الخصائص
  useEffect(() => {
    // فحص ما إذا كان هناك حقل عنوان وتسجيل لون خلفيته للتصحيح
    const titleField = fields.find(f => f.type === 'form-title' || f.type === 'title');
    if (titleField && titleField.style) {
      console.log(`FormPreviewPanel: حقل العنوان لديه لون خلفية: ${titleField.style.backgroundColor || 'غير محدد'}`);
    }
    
    // إعادة الرسم الإجبارية لضمان عرض التغييرات
    forceRefresh();
  }, [fields, formStyle, formTitle, formDescription, refreshKey, direction, forceRefresh]);
  
  // معالجة الحقول لتوحيد قيم الأيقونات وإعدادات النمط
  const processedFields = React.useMemo(() => {
    return fields.map(field => {
      const updatedField = { ...field };
      
      if (updatedField.icon === '') {
        updatedField.icon = 'none';
      }
      
      if (updatedField.icon && updatedField.icon !== 'none') {
        if (!updatedField.style) {
          updatedField.style = {};
        }
        
        updatedField.style.showIcon = updatedField.style?.showIcon !== undefined 
          ? updatedField.style.showIcon 
          : true;
      }
      
      if (updatedField.style?.fontSize && !updatedField.style.fontSize.includes('px')) {
        if (updatedField.style.fontSize.includes('rem')) {
          const remValue = parseFloat(updatedField.style.fontSize);
          updatedField.style.fontSize = `${remValue * 16}px`;
        } else if (!isNaN(parseFloat(updatedField.style.fontSize))) {
          updatedField.style.fontSize = `${updatedField.style.fontSize}px`;
        }
      }
      
      if (updatedField.type === 'form-title' || updatedField.type === 'title') {
        if (!updatedField.style) {
          updatedField.style = {};
        }
        // توحيد محاذاة النص للعناوين
        updatedField.style.textAlign = 'center';
        
        // تأكد من أن لون الخلفية محدد
        console.log(`FormPreviewPanel: معالجة حقل العنوان ${updatedField.id} مع لون خلفية: ${updatedField.style.backgroundColor || 'غير محدد'}`);
      }
      
      return updatedField;
    });
  }, [fields]);

  return (
    <div 
      id={`preview-panel-${internalRefreshKey}`} 
      style={{backgroundColor: "#F9FAFB"}} 
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
        style={{backgroundColor: "#F9FAFB"}}
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
      
      <div className="mt-2 text-xs text-gray-500 p-2 rounded">
        {language === 'ar' ? 'تاريخ التحديث: ' : 'Last update: '}
        {new Date().toLocaleTimeString()}
        {' - '}
        {language === 'ar' ? `مفتاح التحديث: ${internalRefreshKey.toString().substring(0, 6)}` : `Refresh key: ${internalRefreshKey.toString().substring(0, 6)}`}
      </div>
    </div>
  );
  
  // معالج تغيير الاتجاه
  function handleDirectionChange(value: string) {
    if (value === 'ltr' || value === 'rtl') {
      setDirection(value as 'ltr' | 'rtl');
      saveDirection(value as 'ltr' | 'rtl');
      forceRefresh(); // ضمان تحديث المعاينة
    }
  }
};

export default FormPreviewPanel;
