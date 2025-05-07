
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { FormField } from '@/lib/form-utils';
import FormFieldComponent from './preview/FormField';
import { useFormStore } from '@/hooks/useFormStore';

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
  submitButtonText?: string;
  formLanguage?: 'ar' | 'en' | 'fr';
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
  submitButtonText,
  formLanguage = 'ar',
}) => {
  const { language } = useI18n();
  const [key, setKey] = useState(0);
  const { formState } = useFormStore();
  
  // Get default submit button text based on form language
  const getDefaultSubmitButtonText = (lang: 'ar' | 'en' | 'fr') => {
    // First check translations if available
    const translations = formState.translations?.[lang];
    if (translations?.submitButtonText) {
      return translations.submitButtonText;
    }
    
    // Default fallback values per language
    switch (lang) {
      case 'ar':
        return 'إرسال الطلب';
      case 'en':
        return 'Submit';
      case 'fr':
        return 'Soumettre';
      default:
        return 'إرسال الطلب';
    }
  };

  // تحديد اتجاه النص بناءً على اللغة المحددة
  const isRTL = formLanguage === 'ar';
  const textDirection = isRTL ? 'rtl' : 'ltr';
  
  // تحديث المفتاح عند تغيير أي من الخصائص
  useEffect(() => {
    setKey(prevKey => prevKey + 1);
  }, [formStyle, formTitle, formDescription, currentStep, totalSteps, fields, submitButtonText, formLanguage]);
  
  // ترجمات زر الإرسال حسب اللغة
  const getSubmitButtonText = () => {
    if (submitButtonText) return submitButtonText;
    return getDefaultSubmitButtonText(formLanguage);
  };
  
  // استخدام العنوان الافتراضي بناءً على اللغة إذا لم يتم توفير عنوان
  const getFormTitle = () => {
    if (formTitle) return formTitle;
    
    // Get title from translations if available
    const translations = formState.translations?.[formLanguage];
    if (translations?.title) {
      return translations.title;
    }
    
    // Default fallback titles
    switch (formLanguage) {
      case 'ar':
        return 'نموذج جديد';
      case 'en':
        return 'New Form';
      case 'fr':
        return 'Nouveau Formulaire';
      default:
        return formTitle || 'نموذج جديد';
    }
  };
  
  // استخدام الوصف الافتراضي بناءً على اللغة إذا لم يتم توفير وصف
  const getFormDescription = () => {
    if (formDescription) return formDescription;
    
    // Get description from translations if available
    const translations = formState.translations?.[formLanguage];
    if (translations?.description) {
      return translations.description;
    }
    
    return '';
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
      <div 
        className="p-4 border-b" 
        style={{ 
          backgroundColor: formStyle.primaryColor || '#9b87f5',
          color: 'white',
          borderRadius: `${formStyle.borderRadius} ${formStyle.borderRadius} 0 0`,
        }}
      >
        <h2 className={cn("text-xl font-medium", isRTL ? "text-right" : "text-left")}>{getFormTitle()}</h2>
        {getFormDescription() && <p className={cn("text-sm opacity-90", isRTL ? "text-right" : "text-left")}>{getFormDescription()}</p>}
      </div>
      
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
          direction: textDirection,
        }}
      >
        {fields && fields.length > 0 ? (
          <div className="space-y-4">
            {fields.map(field => (
              <FormFieldComponent 
                key={field.id} 
                field={field} 
                formStyle={formStyle}
                formLanguage={formLanguage}
              />
            ))}
            
            <button
              className="w-full py-2 px-4 text-white font-medium"
              style={{
                backgroundColor: formStyle.primaryColor || '#9b87f5',
                borderRadius: formStyle.buttonStyle === 'rounded' ? '9999px' : 
                              formStyle.buttonStyle === 'pill' ? '9999px' : '0.375rem',
              }}
            >
              {getSubmitButtonText()}
            </button>
          </div>
        ) : (
          <div dir={textDirection}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormPreview;
