
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

// Static constant to prevent recreation
const defaultFormStyle = {
  primaryColor: '#9b87f5',
  borderRadius: '0.5rem',
  fontSize: '1rem',
  buttonStyle: 'rounded',
};

// Custom comparison function to prevent unnecessary re-renders
const arePropsEqual = (prevProps: FormPreviewProps, nextProps: FormPreviewProps) => {
  // Only check properties that might change frequently
  return (
    prevProps.formTitle === nextProps.formTitle &&
    prevProps.formDescription === nextProps.formDescription &&
    prevProps.currentStep === nextProps.currentStep &&
    prevProps.totalSteps === nextProps.totalSteps &&
    JSON.stringify(prevProps.fields) === JSON.stringify(nextProps.fields) &&
    prevProps.submitButtonText === nextProps.submitButtonText &&
    JSON.stringify(prevProps.formStyle) === JSON.stringify(nextProps.formStyle)
  );
};

// Step indicators - memoized to prevent unnecessary re-renders
const StepIndicators = React.memo(({ 
  currentStep, 
  totalSteps, 
  primaryColor 
}: { 
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

// Separate submit button component
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

// Form content interface with required properties
interface FormContentProps {
  fields?: FormField[];
  children: React.ReactNode;
  formStyle: {
    primaryColor: string;
    borderRadius: string;
    fontSize: string;
    buttonStyle: string;
  };
  submitButtonText: string;
}

// Form content component - memoized to prevent unnecessary re-renders
const FormContent = React.memo(({ 
  fields, 
  children, 
  formStyle,
  submitButtonText
}: FormContentProps) => {
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

// Main FormPreview component with optimizations
const FormPreview = (props: FormPreviewProps) => {
  const {
    formTitle,
    formDescription,
    currentStep,
    totalSteps,
    children,
    formStyle: propFormStyle,
    fields = [],
    submitButtonText = 'إرسال الطلب',
  } = props;
  
  const { language } = useI18n();
  
  // Ensure formStyle always has all required properties by providing defaults
  const formStyle = React.useMemo(() => {
    return {
      primaryColor: propFormStyle?.primaryColor || defaultFormStyle.primaryColor,
      borderRadius: propFormStyle?.borderRadius || defaultFormStyle.borderRadius,
      fontSize: propFormStyle?.fontSize || defaultFormStyle.fontSize,
      buttonStyle: propFormStyle?.buttonStyle || defaultFormStyle.buttonStyle,
    };
  }, [propFormStyle]);
  
  // CSS variables - only recompute when relevant values change
  const cssVars = React.useMemo(() => {
    return {
      fontSize: formStyle.fontSize,
      '--form-primary-color': formStyle.primaryColor,
      borderRadius: formStyle.borderRadius,
    } as React.CSSProperties;
  }, [formStyle.fontSize, formStyle.primaryColor, formStyle.borderRadius]);
  
  // Using separate memoized components for performance
  return (
    <div 
      className="rounded-lg border shadow-sm overflow-hidden bg-white"
      style={cssVars}
    >
      <div 
        className="p-4 border-b" 
        style={{ 
          backgroundColor: formStyle.primaryColor,
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
        primaryColor={formStyle.primaryColor}
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

// Use memo for main component with custom comparison
export default React.memo(FormPreview, arePropsEqual);
