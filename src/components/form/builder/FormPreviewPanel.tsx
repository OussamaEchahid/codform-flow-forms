
import React, { useEffect, useState } from 'react';
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
  const [formDirection, setFormDirection] = useState<'ltr' | 'rtl'>(language === 'ar' ? 'rtl' : 'ltr');
  
  // فرض التحديث عند تغيير أي خاصية لضمان تحديث المعاينة المباشرة فورًا
  useEffect(() => {
    setInternalRefreshKey(Date.now());
  }, [fields, formStyle, formTitle, formDescription, refreshKey, JSON.stringify(fields)]);
  
  // معالجة الحقول مع الحفاظ على محاذاة العناوين بغض النظر عن اتجاه النموذج
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
      
      // مهم جدًا: حقول العنوان تحتفظ بمحاذاتها الخاصة - لا تتأثر باتجاه النموذج
      if (updatedField.type === 'form-title' || updatedField.type === 'title') {
        if (!updatedField.style) {
          updatedField.style = {};
        }
        
        // فقط إذا لم تكن المحاذاة محددة بالفعل - استخدم افتراضي
        if (updatedField.style.textAlign === undefined) {
          updatedField.style.textAlign = language === 'ar' ? 'right' : 'left';
        }
        
        // لا تغير أبدًا محاذاة العنوان بناءً على اتجاه النموذج - حافظ على قيمة محاذاة العنوان المحددة
        // هذا تغيير مهم جدًا لحل المشكلة
        
        // ضمان تعيين لون الخلفية ولون النص
        updatedField.style.backgroundColor = updatedField.style.backgroundColor || '#9b87f5';
        updatedField.style.color = updatedField.style.color || '#ffffff';
        
        // ضمان تحديد أحجام الخط بوحدات بكسل
        if (updatedField.style.fontSize && !updatedField.style.fontSize.includes('px')) {
          updatedField.style.fontSize = `${updatedField.style.fontSize}px`;
        }
        
        if (updatedField.style.descriptionFontSize && !updatedField.style.descriptionFontSize.includes('px')) {
          updatedField.style.descriptionFontSize = `${updatedField.style.descriptionFontSize}px`;
        }
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
      
      return updatedField;
    });
  }, [fields, language, internalRefreshKey]); // إزالة formDirection من التبعيات

  // إنشاء معرف فريد لمكون المعاينة هذا
  const previewPanelId = `preview-panel-${Date.now()}`;

  return (
    <div id={previewPanelId}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {language === 'ar' ? 'اتجاه النموذج:' : 'Form Direction:'}
          </span>
          <ToggleGroup 
            type="single" 
            value={formDirection} 
            onValueChange={(value) => value && setFormDirection(value as 'ltr' | 'rtl')}
            className="border rounded-md"
          >
            <ToggleGroupItem value="ltr" aria-label="Left to right" title={language === 'ar' ? 'يسار إلى يمين' : 'Left to right'}>
              <AlignLeft className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="rtl" aria-label="Right to left" title={language === 'ar' ? 'يمين إلى يسار' : 'Right to left'}>
              <AlignRight className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <h3 className={`text-lg font-medium ${language === 'ar' ? 'text-right' : ''}`}>
          {language === 'ar' ? 'معاينة مباشرة' : 'Live Preview'}
        </h3>
      </div>
      
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
          direction={formDirection} // Pass the direction to FormPreview
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
