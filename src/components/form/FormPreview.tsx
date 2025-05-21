
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
  };
  fields?: FormField[];
  hideHeader?: boolean;
  floatingButton?: FloatingButtonConfig;
  hideFloatingButtonPreview?: boolean;
}

// Constant ID for form title to prevent regeneration
const FORM_TITLE_ID = 'form-title-static';

// Improved deep clone function with proper TypeScript support
const deepCloneFields = (fields: FormField[]): FormField[] => {
  if (!fields) return [];
  
  return fields.map(field => {
    // Create a deep copy of the field to prevent mutations
    const newField: FormField = JSON.parse(JSON.stringify(field));
    
    // Explicitly preserve the ID to ensure stability
    newField.id = field.id;
    
    return newField;
  });
};

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
    borderColor: '#9b87f5',
    borderWidth: '2px',
    backgroundColor: '#F9FAFB',
    paddingTop: '20px',
    paddingBottom: '20px',
    paddingLeft: '20px',
    paddingRight: '20px',
    formGap: '16px',
    formDirection: 'ltr',
    floatingLabels: false
  },
  fields = [],
  hideHeader = false,
  floatingButton,
  hideFloatingButtonPreview = false,
}) => {
  const { language } = useI18n();
  
  // Always enforce default backgroundColor for the form
  const formBackgroundColor = formStyle.backgroundColor || '#F9FAFB';

  // Process fields while preserving IDs and ensuring there's no duplication
  const sanitizedFields = useMemo(() => {
    const clonedFields = deepCloneFields(fields);
    const hasTitleField = clonedFields.some(field => field.id === FORM_TITLE_ID);
    const existingTitleField = clonedFields.find(field => field.type === 'form-title');
    
    if (clonedFields.length === 0 || (!hasTitleField && !existingTitleField)) {
      const fieldsToCreate = [];
      
      if (!hasTitleField && !existingTitleField) {
        const titleField: FormField = {
          type: 'form-title',
          id: FORM_TITLE_ID,
          label: formTitle || '',
          helpText: formDescription || '',
          style: {
            // Important - Use a standalone color that doesn't reference formStyle 
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
        fieldsToCreate.push(titleField);
      }
      
      if (clonedFields.length === 0) {
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
        fieldsToCreate.push(submitButton);
      }
      
      if (clonedFields.length > 0) {
        return [...fieldsToCreate, ...clonedFields];
      }
      
      return fieldsToCreate;
    }
    
    // Update all fields with form direction if not specified
    if (formStyle.formDirection) {
      return clonedFields.map(field => {
        // Skip fields that already have explicit text alignment
        if (field.style?.textAlign) return field;
        
        // Only update specific field types that benefit from direction
        if (['text', 'textarea', 'email', 'phone', 'form-title'].includes(field.type)) {
          return {
            ...field,
            style: {
              ...field.style,
              textAlign: formStyle.formDirection === 'rtl' ? 'right' : 'left'
            }
          };
        }
        
        return field;
      });
    }
    
    return clonedFields;
  }, [fields, language, formTitle, formDescription, formStyle.primaryColor, formStyle.formDirection]);
  
  // Determine the form direction, prioritizing formStyle.formDirection, then language
  const formDirection = formStyle.formDirection || (language === 'ar' ? 'rtl' : 'ltr');
  
  return (
    <div 
      className="rounded-lg border shadow-sm overflow-hidden codform-form"
      style={{
        fontSize: formStyle.fontSize,
        '--form-primary-color': formStyle.primaryColor,
        borderRadius: formStyle.borderRadius,
        backgroundColor: formBackgroundColor,
        border: `${formStyle.borderWidth || '2px'} solid ${formStyle.borderColor || '#9b87f5'}`,
        padding: '0',
      } as React.CSSProperties}
      data-form-preview-id="form-preview-stable"
      data-border-color={formStyle.borderColor}
      data-border-width={formStyle.borderWidth}
      data-border-radius={formStyle.borderRadius}
      data-primary-color={formStyle.primaryColor}
      data-form-direction={formDirection}
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
          direction: formDirection,
          padding: `${formStyle.paddingTop || '20px'} ${formStyle.paddingRight || '20px'} ${formStyle.paddingBottom || '20px'} ${formStyle.paddingLeft || '20px'}`,
          gap: formStyle.formGap || '16px',
          backgroundColor: formBackgroundColor,
        }}
        data-direction={formDirection}
      >
        {sanitizedFields.length > 0 ? (
          <div className="space-y-4" style={{ gap: formStyle.formGap || '16px' }}>
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

      {floatingButton && floatingButton.enabled && !hideFloatingButtonPreview && (
        <FloatingButton config={floatingButton} isPreview={true} />
      )}
    </div>
  );
};

export default React.memo(FormPreview);
