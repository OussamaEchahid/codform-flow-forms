
import React from 'react';
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
  submitButtonText?: string;
}

// ثابت من الخارج لضمان عدم إعادة التصيير
const defaultFormStyle = {
  primaryColor: '#9b87f5',
  borderRadius: '0.5rem',
  fontSize: '1rem',
  buttonStyle: 'rounded',
};

// دالة مقارنة مخصصة للتحقق من تغيير الخصائص
const arePropsEqual = (prevProps: FormPreviewProps, nextProps: FormPreviewProps) => {
  // فحص فقط الخصائص التي يمكن أن تتغير بشكل متكرر
  return (
    prevProps.formTitle === nextProps.formTitle &&
    prevProps.formDescription === nextProps.formDescription &&
    prevProps.currentStep === nextProps.currentStep &&
    prevProps.fields === nextProps.fields &&
    prevProps.submitButtonText === nextProps.submitButtonText &&
    JSON.stringify(prevProps.formStyle) === JSON.stringify(nextProps.formStyle)
  );
};

// تقسيم المكونات إلى مكونات فرعية لتحسين الأداء
const StepIndicators = React.memo(({ currentStep, totalSteps, primaryColor }: { 
  currentStep: number;
  totalSteps: number;
  primaryColor: string;
}) => {
  if (totalSteps <= 1) return null;
  
  return (
    <div className="px-4 py-2 bg-gray-50">
      <div className="flex items-center">
        <div className="flex-1 flex">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex-1 flex items-center">
              <div 
                className={cn(
                  "h-2 flex-1",
                  i < currentStep ? `bg-[${primaryColor}]` : "bg-gray-200"
                )}
              ></div>
              <div 
                className={cn(
                  "rounded-full h-5 w-5 flex items-center justify-center text-xs font-medium",
                  i + 1 === currentStep 
                    ? `bg-[${primaryColor}] text-white` 
                    : i < currentStep 
                      ? `bg-[${primaryColor}] text-white`
                      : "bg-gray-200 text-gray-600"
                )}
              >
                {i + 1}
              </div>
              {i < totalSteps - 1 && (
                <div 
                  className={cn(
                    "h-2 flex-1",
                    i + 1 < currentStep ? `bg-[${primaryColor}]` : "bg-gray-200"
                  )}
                ></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

StepIndicators.displayName = 'StepIndicators';

// مكون زر الإرسال منفصل
const SubmitButton = React.memo(({ 
  text, 
  style 
}: { 
  text: string; 
  style: { 
    primaryColor: string;
    buttonStyle: string;
  }
}) => {
  return (
    <button
      className="w-full py-2 px-4 text-white font-medium"
      style={{
        backgroundColor: style.primaryColor,
        borderRadius: style.buttonStyle === 'rounded' ? '9999px' : 
                     style.buttonStyle === 'pill' ? '9999px' : '0.375rem',
      }}
      type="button"
    >
      {text}
    </button>
  );
});

SubmitButton.displayName = 'SubmitButton';

// مكون محتوى النموذج
const FormContent = React.memo(({ 
  fields, 
  children, 
  formStyle,
  submitButtonText
}: { 
  fields?: FormField[];
  children: React.ReactNode;
  formStyle: typeof defaultFormStyle;
  submitButtonText: string;
}) => {
  if (!fields || fields.length === 0) {
    return <>{children}</>;
  }
  
  return (
    <div className="space-y-4">
      {fields.map(field => (
        <FormFieldComponent 
          key={field.id} 
          field={field} 
          formStyle={formStyle}
        />
      ))}
      
      <SubmitButton 
        text={submitButtonText} 
        style={{
          primaryColor: formStyle.primaryColor,
          buttonStyle: formStyle.buttonStyle
        }} 
      />
    </div>
  );
});

FormContent.displayName = 'FormContent';

// المكون الرئيسي
const FormPreview = (props: FormPreviewProps) => {
  const {
    formTitle,
    formDescription,
    currentStep,
    totalSteps,
    children,
    formStyle = defaultFormStyle,
    fields = [],
    submitButtonText = 'إرسال الطلب',
  } = props;
  
  const { language } = useI18n();
  
  // متغيرات CSS - ثابتة فقط عند تغيير القيم ذات الصلة
  const cssVars = React.useMemo(() => {
    return {
      fontSize: formStyle.fontSize,
      '--form-primary-color': formStyle.primaryColor,
      borderRadius: formStyle.borderRadius,
    } as React.CSSProperties;
  }, [formStyle.fontSize, formStyle.primaryColor, formStyle.borderRadius]);
  
  // استخدام المكونات الفرعية المنفصلة لتحسين الأداء
  return (
    <div 
      className="rounded-lg border shadow-sm overflow-hidden bg-white"
      style={cssVars}
    >
      <div 
        className="p-4 border-b" 
        style={{ 
          backgroundColor: formStyle.primaryColor || defaultFormStyle.primaryColor,
          color: 'white',
          borderRadius: `${formStyle.borderRadius} ${formStyle.borderRadius} 0 0`,
        }}
      >
        <h2 className={cn("text-xl font-medium", language === 'ar' ? "text-right" : "text-left")}>
          {formTitle}
        </h2>
        {formDescription && (
          <p className={cn("text-sm opacity-90", language === 'ar' ? "text-right" : "text-left")}>
            {formDescription}
          </p>
        )}
      </div>
      
      <StepIndicators 
        currentStep={currentStep}
        totalSteps={totalSteps}
        primaryColor={formStyle.primaryColor || defaultFormStyle.primaryColor}
      />
      
      <div 
        className="p-4" 
        style={{
          borderRadius: `0 0 ${formStyle.borderRadius} ${formStyle.borderRadius}`,
          direction: language === 'ar' ? 'rtl' : 'ltr',
        }}
      >
        <FormContent
          fields={fields}
          formStyle={formStyle}
          submitButtonText={submitButtonText}
        >
          {children}
        </FormContent>
      </div>
    </div>
  );
};

// استخدام memo للمكون الرئيسي مع دالة مقارنة مخصصة
export default React.memo(FormPreview, arePropsEqual);
