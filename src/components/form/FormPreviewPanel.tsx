
import React, { useEffect, useState, useMemo } from 'react';
import { FormField, deepCloneField } from '@/lib/form-utils';
import FormPreview from '@/components/form/FormPreview';
import { useI18n } from '@/lib/i18n';
import { useFormStore } from '@/hooks/useFormStore';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';

interface FormStyle {
  primaryColor: string;
  borderRadius: string;
  fontSize: string;
  buttonStyle: string;
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
  formCountry?: string;
  formPhonePrefix?: string;
}

const deepCloneFields = (fields: FormField[]): FormField[] => {
  if (!fields) return [];
  
  return fields.map(field => {
    const newField = deepCloneField(field);
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
  formCountry,
  formPhonePrefix
}) => {
  const { language } = useI18n();
  const { updateFormStyle } = useFormStore();
  
  const [internalRefreshKey, setInternalRefreshKey] = useState(0);
  
  useEffect(() => {
    if (refreshKey > internalRefreshKey) {
      setInternalRefreshKey(refreshKey);
    }
  }, [refreshKey, internalRefreshKey]);
  
  // زر تغيير الاتجاه - منفصل عن لغة الموقع
  const toggleDirection = () => {
    const currentDirection = formStyle.formDirection || 'ltr';
    const newDirection = currentDirection === 'rtl' ? 'ltr' : 'rtl';
    updateFormStyle({ formDirection: newDirection });
    toast.success(language === 'ar' 
      ? `تم تغيير الاتجاه إلى ${newDirection === 'rtl' ? 'يمين-يسار' : 'يسار-يمين'}` 
      : `Direction changed to ${newDirection.toUpperCase()}`);
  };
  
  const processedFields = useMemo(() => {
    console.log("Processing fields for preview, original count:", fields?.length || 0);
    console.log("Form country:", formCountry, "Phone prefix:", formPhonePrefix);
    
    const clonedFields = deepCloneFields(fields);
    
    const hasSubmitButton = clonedFields.some(field => field.type === 'submit');
    
    if (!hasSubmitButton) {
      const submitButton: FormField = {
        type: 'submit',
        id: `submit-stable`,
        label: language === 'ar' ? 'إرسال الطلب' : 'Submit Order',
        icon: 'shopping-cart',
        style: {
          backgroundColor: formStyle.primaryColor || '#9b87f5',
          showIcon: true,
          iconPosition: 'left',
          color: '#ffffff',
          fontSize: '18px',
          animation: true,
          animationType: 'pulse',
          borderRadius: '1.2rem',
        },
      };
      clonedFields.push(submitButton);
    }
    
    // تطبيق اتجاه النموذج بغض النظر عن لغة الموقع
    if (formStyle.formDirection) {
      return clonedFields.map(field => {
        if (field.style?.textAlign) return field;
        
        if (['text', 'textarea', 'email', 'phone'].includes(field.type)) {
          return {
            ...field,
            style: {
              ...field.style,
              textAlign: (formStyle.formDirection === 'rtl' ? 'right' : 'left') as 'right' | 'left'
            }
          };
        }
        
        return field;
      });
    }
    
    console.log("Final processed fields count:", clonedFields.length);
    return clonedFields;
  }, [fields, language, formStyle.primaryColor, formStyle.backgroundColor, formStyle.borderRadius, formStyle.formDirection, formCountry, formPhonePrefix]);

  const previewFormStyle = {
    ...formStyle,
    backgroundColor: formStyle.backgroundColor || '#ffffff',
    borderRadius: '1.2rem',
    borderColor: formStyle.borderColor || '#9b87f5',
    borderWidth: formStyle.borderWidth || '2px',
  };

  const { formState } = useFormStore();
  const popupButton = formState?.style?.popupButton;
  const isPopupEnabled = popupButton?.enabled;

  const getAnimationClass = (animation: string) => {
    switch (animation) {
      case 'pulse': return 'animate-pulse';
      case 'bounce': return 'animate-bounce';
      case 'shake': return 'animate-[shake_0.8s_infinite]';
      case 'wiggle': return 'animate-[wiggle_2s_ease-in-out_infinite]';
      case 'flash': return 'animate-[flash_2s_infinite]';
      default: return '';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className={`text-lg font-medium ${language === 'ar' ? 'text-right' : ''}`}>
          {language === 'ar' ? 'معاينة مباشرة' : 'Live Preview'}
        </h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleDirection}
          className="bg-white shadow-md border-2 border-blue-200 hover:border-blue-400 transition-all"
        >
          <ArrowLeftRight className="w-4 h-4 mr-2" />
          {language === 'ar' ? 'تغيير الاتجاه' : 'Toggle Direction'}: {formStyle.formDirection?.toUpperCase() || 'LTR'}
        </Button>
      </div>
      
      <div 
        className="rounded-xl p-6 shadow-sm"
        style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0'
        }}
        dir={formStyle.formDirection || 'ltr'}
      >
        {isPopupEnabled ? (
          // عرض زر النافذة المنبثقة فقط
          <div className="flex items-center justify-center min-h-[200px] bg-white rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <p className="text-gray-600 mb-4 text-sm">
                {language === 'ar' ? 'معاينة زر النافذة المنبثقة' : 'Popup Button Preview'}
              </p>
              <Button
                className={`inline-flex items-center gap-2 hover:scale-105 transition-transform ${getAnimationClass(popupButton.animation || 'none')}`}
                style={{
                  backgroundColor: popupButton.backgroundColor || '#9b87f5',
                  color: popupButton.textColor || '#ffffff',
                  borderRadius: popupButton.borderRadius || '8px',
                  fontSize: popupButton.fontSize || '16px',
                  padding: '12px 24px',
                  fontWeight: '600'
                }}
              >
                {popupButton.showIcon !== false && '🛒'}
                {popupButton.text || (language === 'ar' ? 'اطلب الآن' : 'Order Now')}
              </Button>
              <p className="text-xs text-gray-500 mt-3">
                {language === 'ar' ? 'الضغط على الزر سيفتح النموذج في نافذة منبثقة' : 'Clicking will open form in popup'}
              </p>
            </div>
          </div>
        ) : (
          // عرض النموذج العادي
          <FormPreview 
            key={`preview-${internalRefreshKey}`}
            formTitle=""
            formDescription=""
            currentStep={currentStep}
            totalSteps={totalSteps}
            formStyle={previewFormStyle}
            fields={processedFields}
            formCountry={formCountry}
            formPhonePrefix={formPhonePrefix}
          >
            <div></div>
          </FormPreview>
        )}
      </div>
      
      <div className="mt-2 text-xs text-gray-500 p-2 rounded text-center">
        {language === 'ar' 
          ? `المعاينة تستخدم ${formPhonePrefix || '+966'} كرمز للدولة`
          : `Preview uses ${formPhonePrefix || '+966'} as country code`}
      </div>
    </div>
  );
};

export default React.memo(FormPreviewPanel);
