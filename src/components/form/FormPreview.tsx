import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { FormField, FloatingButtonConfig } from '@/lib/form-utils';
import FormFieldComponent from './preview/FormField';
import FloatingButton from './preview/FloatingButton';

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
  hideHeader?: boolean;
  floatingButton?: FloatingButtonConfig;
  hideFloatingButtonPreview?: boolean;
  formDirection?: 'ltr' | 'rtl';
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
    fontSize: '16px',
    buttonStyle: 'rounded',
  },
  fields = [],
  hideHeader = false,
  floatingButton,
  hideFloatingButtonPreview = false,
  formDirection,
}) => {
  const { language } = useI18n();
  
  // Use the formDirection prop if provided, otherwise fall back to language-based direction
  const direction = formDirection || (language === 'ar' ? 'rtl' : 'ltr');
  
  // Improve field processing for consistent display
  const sanitizedFields = React.useMemo(() => {
    // استخدام الوظائف المحسنة من form-utils
    import { prepareFieldStyleForStore, createDefaultTitleField, normalizeFontSize } from '@/lib/form-utils';
    
    // ضمان أن حقول العربة الخاصة بالبنود والملخص لها تسميات فارغة افتراضيًا
    const updatedFields = fields.map(field => {
      // استخدام وظيفة prepareFieldStyleForStore من form-utils
      return prepareFieldStyleForStore(field);
    });
    
    // إذا كان هناك بالفعل حقل عنوان نموذج، استخدمه
    if (updatedFields.some(field => field.type === 'form-title')) {
      return updatedFields;
    }
    
    // إذا لم يكن هناك حقل عنوان نموذج، أضف واحدًا في البداية بأحجام بكسل محددة
    const formTitleField = createDefaultTitleField(formTitle, formDescription);
    
    // التحقق مما إذا كان هناك بالفعل زر إرسال
    const hasSubmitButton = updatedFields.some(field => field.type === 'submit');
    
    let result = [formTitleField, ...updatedFields.filter(f => f.type !== 'form-title')];
    
    // إذا لم يكن هناك زر إرسال، أضف واحدًا
    if (!hasSubmitButton) {
      const submitButton = createDefaultSubmitButton(language === 'ar' ? 'إرسال الطلب' : 'Submit Order');
      result.push(submitButton);
    }
    
    // ضمان أن حجم الخط للنموذج بأكمله هو بتنسيق px
    const formFontSize = normalizeFontSize(formStyle.fontSize || '16px');
    
    return result;
  }, [fields, formTitle, formDescription, language, formStyle.primaryColor, formStyle.fontSize]);
  
  // Create unique ID for this form
  const formId = React.useMemo(() => `form-preview-${Date.now()}`, []);
  
  // Use consistent background color for form
  const formBackgroundColor = "#F9FAFB";
  
  // Direction class for the form
  const dirClass = direction === 'rtl' ? 'rtl' : 'ltr';
  
  // Log current form direction
  console.log(`FormPreview rendering with direction: ${direction}`);
  
  return (
    <div 
      className={`rounded-lg border shadow-sm overflow-hidden codform-form ${dirClass}`}
      style={{
        fontSize: formStyle.fontSize,
        backgroundColor: formBackgroundColor,
        '--form-primary-color': formStyle.primaryColor,
        borderRadius: formStyle.borderRadius,
      } as React.CSSProperties}
      data-form-preview-id={formId}
      data-direction={direction}
      dir={direction}
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
        className={`p-3 ${dirClass}`} 
        style={{
          borderRadius: `0 0 ${formStyle.borderRadius} ${formStyle.borderRadius}`,
          direction: direction,
          backgroundColor: formBackgroundColor
        }}
        dir={direction}
      >
        {sanitizedFields.length > 0 ? (
          <div className="space-y-2" style={{backgroundColor: 'transparent'}}>
            {sanitizedFields.map(field => (
              <FormFieldComponent 
                key={`${field.id}-${Date.now()}`}
                field={field} 
                formStyle={formStyle}
                formDirection={direction}
              />
            ))}
          </div>
        ) : (
          children
        )}
      </div>

      {/* Show floating button if enabled and not hidden for preview */}
      {floatingButton && floatingButton.enabled && !hideFloatingButtonPreview && (
        <FloatingButton config={floatingButton} isPreview={true} />
      )}
      
      {/* Debugging information (hidden from user but useful for development) */}
      <div style={{ display: 'none' }} data-debug-info>
        Direction: {direction}
        Form ID: {formId}
        Fields count: {sanitizedFields.length}
      </div>
    </div>
  );
};

export default FormPreview;
