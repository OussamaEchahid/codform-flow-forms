
import React, { useState, useMemo } from 'react';
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
}

// Constant ID for form title to prevent regeneration - must match FormPreviewPanel
const FORM_TITLE_ID = 'form-title-static';

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
}) => {
  const { language } = useI18n();
  
  // We don't process fields here anymore - we trust that FormPreviewPanel has already handled this
  // Just ensure we're not re-processing anything
  const sanitizedFields = useMemo(() => {
    // If fields array is empty, create default title and submit fields
    if (fields.length === 0) {
      const titleField: FormField = {
        type: 'form-title',
        id: FORM_TITLE_ID,
        label: formTitle,
        helpText: formDescription,
        style: {
          backgroundColor: formStyle.primaryColor || '#9b87f5',
          color: '#ffffff',
          textAlign: language === 'ar' ? 'right' : 'center',
          fontSize: '24px',
          fontWeight: 'bold',
          descriptionColor: 'rgba(255, 255, 255, 0.9)',
          descriptionFontSize: '14px',
          showTitle: true,
          showDescription: true
        },
      };
      
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
        },
      };
      
      return [titleField, submitButton];
    }
    
    // If we have fields, just make sure we preserve the form-title ID
    return fields.map(field => {
      if (field.type === 'form-title' && field.id !== FORM_TITLE_ID) {
        return { ...field, id: FORM_TITLE_ID };
      }
      return field;
    });
  }, [fields, language, formStyle.primaryColor, formTitle, formDescription]);
  
  return (
    <div 
      className="rounded-lg border shadow-sm overflow-hidden bg-white codform-form"
      style={{
        fontSize: formStyle.fontSize,
        '--form-primary-color': formStyle.primaryColor,
        borderRadius: formStyle.borderRadius,
        backgroundColor: '#f5f5f5',
        padding: '20px',
      } as React.CSSProperties}
      data-form-preview-id="form-preview-stable"
      data-primary-color={formStyle.primaryColor}
      data-border-radius={formStyle.borderRadius}
      data-font-size={formStyle.fontSize}
      data-button-style={formStyle.buttonStyle}
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
        className="codform-form-content" 
        style={{
          direction: language === 'ar' ? 'rtl' : 'ltr',
          padding: '0',
        }}
        data-direction={language === 'ar' ? 'rtl' : 'ltr'}
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

      {/* Show floating button if enabled and not hidden */}
      {floatingButton && floatingButton.enabled && !hideFloatingButtonPreview && (
        <FloatingButton config={floatingButton} isPreview={true} />
      )}
    </div>
  );
};

export default React.memo(FormPreview);
