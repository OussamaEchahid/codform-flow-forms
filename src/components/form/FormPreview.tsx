
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { FormField } from '@/lib/form-utils';
import FormFieldComponent from './preview/FormField';

interface FormPreviewProps {
  formTitle: string;
  formDescription?: string;
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
  formStyle?: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
    buttonStyle?: string;
  };
  fields?: FormField[];
  hideHeader?: boolean; // إضافة خيار لإخفاء الترويسة
}

const FormPreview: React.FC<FormPreviewProps> = ({
  formTitle,
  formDescription,
  currentStep,
  totalSteps,
  children,
  formStyle = {
    primaryColor: '#9b87f5',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    buttonStyle: 'rounded',
  },
  fields = [],
  hideHeader = false, // افتراضيًا، يتم عرض الترويسة
}) => {
  const { language } = useI18n();
  const [key] = useState(0);
  
  // تنظيف الحقول: الاحتفاظ فقط بحقل عنوان نموذج واحد والتأكد من وجود زر إرسال
  const sanitizedFields = React.useMemo(() => {
    // الخطوة 1: إزالة حقول عنوان النموذج المكررة (الاحتفاظ فقط بالأول)
    const uniqueFields: FormField[] = [];
    let foundTitle = false;
    
    fields.forEach(field => {
      // إذا لم تكن عنوان نموذج أو لم نجد عنوان بعد، أضفها
      if (field.type !== 'form-title' || !foundTitle) {
        uniqueFields.push(field);
        
        // تحديد أننا وجدنا حقل عنوان
        if (field.type === 'form-title') {
          foundTitle = true;
          hideHeader = true; // إخفاء الترويسة إذا كان هناك حقل form-title
        }
      }
    });
    
    // الخطوة 2: التحقق مما إذا كان هناك زر إرسال موجود
    const hasSubmitButton = uniqueFields.some(field => field.type === 'submit');
    
    // الخطوة 3: إذا لم يكن هناك زر إرسال موجود، أضف واحدًا افتراضيًا
    if (!hasSubmitButton) {
      const submitButton: FormField = {
        type: 'submit',
        id: `submit-${Date.now()}`,
        label: language === 'ar' ? 'إرسال الطلب' : 'Submit Order',
        style: {
          backgroundColor: formStyle.primaryColor || '#9b87f5',
          color: '#ffffff',
          fontSize: '1rem',
        },
      };
      uniqueFields.push(submitButton);
    }
    
    return uniqueFields;
  }, [fields, language, formStyle.primaryColor, hideHeader]);
  
  // إنشاء محتوى الترويسة - يظهر فقط إذا لم يكن هناك حقل form-title موجود وإذا كان hideHeader=false
  const headerContent = () => {
    // أظهر الترويسة فقط إذا لم يكن لدينا حقل عنوان نموذج قابل للتحرير وإذا كان hideHeader=false
    if (!hideHeader && !sanitizedFields.some(field => field.type === 'form-title')) {
      return (
        <div 
          className="p-4 border-b" 
          style={{ 
            backgroundColor: formStyle.primaryColor || '#9b87f5',
            color: 'white',
            borderRadius: `${formStyle.borderRadius} ${formStyle.borderRadius} 0 0`,
          }}
        >
          <h2 className={cn("text-xl font-medium", language === 'ar' ? "text-right" : "text-left")}>{formTitle}</h2>
          {formDescription && <p className={cn("text-sm opacity-90", language === 'ar' ? "text-right" : "text-left")}>{formDescription}</p>}
        </div>
      );
    }
    return null;
  };
  
  return (
    <div 
      key={key}
      className="rounded-lg border shadow-sm overflow-hidden bg-white"
      style={{
        fontSize: formStyle.fontSize,
        '--form-primary-color': formStyle.primaryColor,
        borderRadius: formStyle.borderRadius,
      } as React.CSSProperties}
    >
      {headerContent()}
      
      {totalSteps > 1 && (
        <div className="px-4 py-2 bg-gray-50">
          <div className="flex items-center">
            <div className="flex-1 flex">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className="flex-1 flex items-center">
                  <div 
                    className={cn(
                      "h-2 flex-1",
                      i < currentStep ? "bg-[var(--form-primary-color)]" : "bg-gray-200"
                    )}
                  ></div>
                  <div 
                    className={cn(
                      "rounded-full h-5 w-5 flex items-center justify-center text-xs font-medium",
                      i + 1 === currentStep 
                        ? "bg-[var(--form-primary-color)] text-white" 
                        : i < currentStep 
                          ? "bg-[var(--form-primary-color)] text-white"
                          : "bg-gray-200 text-gray-600"
                    )}
                  >
                    {i + 1}
                  </div>
                  {i < totalSteps - 1 && (
                    <div 
                      className={cn(
                        "h-2 flex-1",
                        i + 1 < currentStep ? "bg-[var(--form-primary-color)]" : "bg-gray-200"
                      )}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div 
        className="p-4" 
        style={{
          borderRadius: `0 0 ${formStyle.borderRadius} ${formStyle.borderRadius}`,
          direction: language === 'ar' ? 'rtl' : 'ltr',
        }}
      >
        {sanitizedFields.length > 0 ? (
          <div className="space-y-4">
            {sanitizedFields.map(field => (
              <FormFieldComponent 
                key={field.id} 
                field={field} 
                formStyle={formStyle}
              />
            ))}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default FormPreview;
