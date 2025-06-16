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
  onStyleChange?: (style: FormStyle) => void;
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
  onStyleChange
}) => {
  const { language } = useI18n();
  
  const [internalRefreshKey, setInternalRefreshKey] = useState(0);
  
  useEffect(() => {
    if (refreshKey > internalRefreshKey) {
      setInternalRefreshKey(refreshKey);
    }
  }, [refreshKey, internalRefreshKey]);
  
  // زر تغيير الاتجاه - منفصل عن لغة الموقع
  const toggleDirection = () => {
    const currentDirection = formStyle.formDirection || 'ltr';
    const newDirection: 'ltr' | 'rtl' = currentDirection === 'rtl' ? 'ltr' : 'rtl';
    
    const newFormStyle: FormStyle = {
      ...formStyle,
      formDirection: newDirection
    };
    
    if (onStyleChange) {
      onStyleChange(newFormStyle);
    }
    
    toast.success(language === 'ar' 
      ? `تم تغيير الاتجاه إلى ${newDirection === 'rtl' ? 'يمين-يسار' : 'يسار-يمين'}` 
      : `Direction changed to ${newDirection.toUpperCase()}`);
  };
  
  const processedFields = useMemo(() => {
    console.log("Processing fields for preview, original count:", fields?.length || 0);
    
    const clonedFields = deepCloneFields(fields);
    
    const hasSubmitButton = clonedFields.some(field => field.type === 'submit');
    
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
          borderRadius: '1.5rem',
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
  }, [fields, language, formStyle.primaryColor, formStyle.backgroundColor, formStyle.borderRadius, formStyle.formDirection]);

  const previewFormStyle = {
    ...formStyle,
    backgroundColor: formStyle.backgroundColor || '#ffffff',
    borderRadius: '1.5rem',
    borderColor: formStyle.borderColor || '#9b87f5',
    borderWidth: formStyle.borderWidth || '2px',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className={`text-lg font-medium ${language === 'ar' ? 'text-right' : ''}`}>
          {language === 'ar' ? 'معاينة مباشرة' : 'Live Preview'}
        </h3>
        
        {/* زر تغيير الاتجاه فوق المعاينة */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleDirection}
          className="bg-white shadow-md border-2 border-blue-200 hover:border-blue-400 transition-all flex items-center gap-2"
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span className="text-sm font-medium">
            {language === 'ar' ? 'تغيير الاتجاه' : 'Toggle Direction'}: {formStyle.formDirection?.toUpperCase() || 'LTR'}
          </span>
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
        <FormPreview 
          key={`preview-${internalRefreshKey}`}
          formTitle=""
          formDescription=""
          currentStep={currentStep}
          totalSteps={totalSteps}
          formStyle={previewFormStyle}
          fields={processedFields}
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
