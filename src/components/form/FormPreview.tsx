
import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { FormField } from '@/lib/form-utils';
import FormFieldComponent from './preview/FormField';
import FormWithQuantityOffers from './preview/FormWithQuantityOffers';

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
  formCountry?: string;
  formPhonePrefix?: string;
  productId?: string;
  formId?: string;
}

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
    formGap: '5px',
    formDirection: 'ltr',
    floatingLabels: false
  },
  fields = [],
  hideHeader = false,
  formCountry = 'SA',
  formPhonePrefix = '+966',
  productId,
  formId
}) => {
  const { language } = useI18n();
  
  // CRITICAL: Always ensure form background has a fixed default that is NOT tied to primaryColor
  const formBackgroundColor = formStyle.backgroundColor || '#F9FAFB';
  
  // Log to help debugging
  console.log('FormPreview: Form background color:', formBackgroundColor);
  console.log('FormPreview: Primary color (for titles, etc):', formStyle.primaryColor);
  console.log('FormPreview: Country and phone prefix:', formCountry, formPhonePrefix);
  
  // Process fields while preserving IDs and ensuring there's no duplication
  const sanitizedFields = useMemo(() => {
    const clonedFields = deepCloneFields(fields);
    
    // Update all fields with form direction if not specified
    const processedFields = clonedFields.map(field => {
      if (field.type === 'form-title') {
        console.log('PRESERVING FIELD STYLE AS-IS:', field.id, field.style);
      }
      
      // Update all fields with form direction if not specified
      if (formStyle.formDirection) {
        // Skip fields that already have explicit text alignment
        if (field.style?.textAlign) return field;
        
        // Only update specific field types that benefit from direction
        if (['text', 'textarea', 'email', 'phone'].includes(field.type)) {
          return {
            ...field,
            style: {
              ...field.style,
              textAlign: (formStyle.formDirection === 'rtl' ? 'right' : 'left') as 'right' | 'left'
            }
          };
        }
      }
      
      return field;
    });
    
    return processedFields;
  }, [fields, language, formTitle, formDescription, formStyle.primaryColor, formStyle.formDirection]);
  
  // Determine the form direction, prioritizing formStyle.formDirection, then language
  const formDirection = formStyle.formDirection || (language === 'ar' ? 'rtl' : 'ltr');
  // Ensure downstream components receive the effective direction
  const effectiveFormStyle = useMemo(() => ({ ...formStyle, formDirection }), [formStyle, formDirection]);
  
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
        display: 'flex',
        flexDirection: 'column',
      } as React.CSSProperties}
      data-form-preview-id="form-preview-stable"
      data-border-color={formStyle.borderColor}
      data-border-width={formStyle.borderWidth}
      data-border-radius={formStyle.borderRadius}
      data-primary-color={formStyle.primaryColor}
      data-form-background={formBackgroundColor}
      data-form-direction={formDirection}
      data-form-structure="main-container"
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
          gap: formStyle.formGap || '5px',
          backgroundColor: formBackgroundColor,
          display: 'flex',
          flexDirection: 'column',
        }}
        data-direction={formDirection}
        data-form-content="true"
        data-background-color={formBackgroundColor}
      >
        {sanitizedFields.length > 0 ? (
          <FormWithQuantityOffers
            fields={sanitizedFields}
            formStyle={effectiveFormStyle}
            formCountry={formCountry}
            formPhonePrefix={formPhonePrefix}
            productId={productId}
            formId={formId}
          />
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default React.memo(FormPreview);
