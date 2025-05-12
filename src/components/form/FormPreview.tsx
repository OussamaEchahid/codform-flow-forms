
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
    borderColor?: string;
    borderWidth?: string;
    backgroundColor?: string;
    paddingTop?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    paddingRight?: string;
    elementGap?: string;
    direction?: 'ltr' | 'rtl';
  };
  fields?: FormField[];
  hideHeader?: boolean;
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
    borderColor: '#e2e8f0',
    borderWidth: '1px',
    backgroundColor: '#ffffff',
    paddingTop: '1rem',
    paddingBottom: '1rem',
    paddingLeft: '1rem',
    paddingRight: '1rem',
    elementGap: '1rem',
    direction: 'ltr',
  },
  fields = [],
  hideHeader = false,
}) => {
  const { language } = useI18n();
  const [key] = useState(0);
  
  // Use form direction or language-based direction
  const direction = formStyle.direction || (language === 'ar' ? 'rtl' : 'ltr');
  
  // تنظيف الحقول وإظهار عنوان النموذج بشكل صحيح
  const sanitizedFields = React.useMemo(() => {
    // إذا كان هناك form-title موجود، نستخدمه
    if (fields.some(field => field.type === 'form-title')) {
      return fields;
    }
    
    // إذا لم يكن هناك form-title، نضيف واحدًا في البداية
    const formTitleField: FormField = {
      type: 'form-title',
      id: `form-title-${Date.now()}`,
      label: formTitle,
      helpText: formDescription,
      style: {
        color: '#ffffff',
        textAlign: direction === 'rtl' ? 'right' : 'left',
        fontWeight: 'bold',
        fontSize: '1.5rem',
        descriptionColor: '#ffffff',
        descriptionFontSize: '0.875rem',
        backgroundColor: formStyle.primaryColor || '#9b87f5', 
      }
    };
    
    // تحقق مما إذا كان هناك زر إرسال موجود بالفعل
    const hasSubmitButton = fields.some(field => field.type === 'submit');
    
    let result = [formTitleField, ...fields.filter(f => f.type !== 'form-title')];
    
    // إذا لم يكن هناك زر إرسال، نضيف واحدًا
    if (!hasSubmitButton) {
      const submitButton: FormField = {
        type: 'submit',
        id: `submit-${Date.now()}`,
        label: language === 'ar' ? 'إرسال الطلب' : 'Submit Order',
        style: {
          backgroundColor: formStyle.primaryColor || '#9b87f5',
          color: '#ffffff',
          fontSize: formStyle.fontSize || '1.2rem',
          animation: true,
          animationType: 'pulse',
        },
      };
      result.push(submitButton);
    }
    
    return result;
  }, [fields, formTitle, formDescription, language, formStyle, direction]);
  
  // Element gap styling as CSS variable
  const elementGapStyle = {
    '--element-gap': formStyle.elementGap || '1rem'
  } as React.CSSProperties;
  
  return (
    <div 
      key={key}
      className="rounded-lg border shadow-sm overflow-hidden"
      style={{
        fontSize: formStyle.fontSize,
        '--form-primary-color': formStyle.primaryColor,
        borderRadius: formStyle.borderRadius,
        borderColor: formStyle.borderColor,
        borderWidth: formStyle.borderWidth,
        backgroundColor: formStyle.backgroundColor || 'white',
        ...elementGapStyle
      } as React.CSSProperties}
    >
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
        className="codform-content"
        style={{
          borderRadius: `0 0 ${formStyle.borderRadius} ${formStyle.borderRadius}`,
          direction: direction,
          padding: `${formStyle.paddingTop} ${formStyle.paddingRight} ${formStyle.paddingBottom} ${formStyle.paddingLeft}`,
        }}
      >
        {sanitizedFields.length > 0 ? (
          <div className="space-y-4" style={{ gap: formStyle.elementGap || '1rem' }}>
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
