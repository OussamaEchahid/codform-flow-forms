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

// Improved deep clone function with proper TypeScript support
const deepCloneFields = (fields: FormField[]): FormField[] => {
  if (!fields) return [];
  
  return fields.map(field => {
    // Create a complete copy of all properties
    const newField: FormField = { ...field };
    
    // Always preserve the exact ID to maintain field identity
    newField.id = field.id;
    
    // Deep clone style object if it exists
    if (field.style) {
      newField.style = { ...field.style };
    }
    
    // Deep clone options array if it exists
    if (field.options && Array.isArray(field.options)) {
      newField.options = field.options.map(option => ({ ...option }));
    }
    
    // Deep clone validation rules if they exist
    if (field.validationRules) {
      newField.validationRules = { ...field.validationRules };
    }
    
    // Deep clone any other nested objects that might exist
    if (field.settings) {
      newField.settings = { ...field.settings };
    }
    
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
  },
  fields = [],
  hideHeader = false,
  floatingButton,
  hideFloatingButtonPreview = false,
}) => {
  const { language } = useI18n();
  
  // Process fields while preserving IDs and ensuring there's no duplication
  const sanitizedFields = useMemo(() => {
    // Deep clone to prevent mutations - critical for stability
    const clonedFields = deepCloneFields(fields);
    
    // Check if we already have a form-title field with the correct ID
    const hasTitleField = clonedFields.some(field => field.id === FORM_TITLE_ID);
    const existingTitleField = clonedFields.find(field => field.type === 'form-title');
    
    // If fields array is empty or doesn't have a title field, create default title and submit fields
    if (clonedFields.length === 0 || (!hasTitleField && !existingTitleField)) {
      const fieldsToCreate = [];
      
      // Only create a title field if we don't have one
      if (!hasTitleField && !existingTitleField) {
        const titleField: FormField = {
          type: 'form-title',
          id: FORM_TITLE_ID,
          label: formTitle || '',
          helpText: formDescription || '',
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
        fieldsToCreate.push(titleField);
      }
      
      // Add the submit button if needed
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
      
      // If we had fields but just needed to add a title, combine them
      if (clonedFields.length > 0) {
        return [...fieldsToCreate, ...clonedFields];
      }
      
      // Otherwise return just the new fields
      return fieldsToCreate;
    }
    
    // Critical fix: If we have an existing form-title but not with the standard ID,
    // preserve its properties but assign the static ID
    if (!hasTitleField && existingTitleField) {
      // First remove all form-title fields to avoid duplicates
      const fieldsWithoutTitle = clonedFields.filter(field => field.type !== 'form-title');
      
      // Create a new title field with stable ID but preserve all other properties
      const standardizedTitle: FormField = {
        ...existingTitleField,
        id: FORM_TITLE_ID,
        label: formTitle || existingTitleField.label || '',
        helpText: formDescription || existingTitleField.helpText || '',
      };
      
      // Return fields with standardized title at the beginning
      return [standardizedTitle, ...fieldsWithoutTitle];
    }
    
    // For cases where title field exists with correct ID
    return clonedFields.map(field => {
      // If it's the title field with the correct ID, update label and helpText
      if (field.type === 'form-title' && field.id === FORM_TITLE_ID) {
        return {
          ...field,
          label: formTitle || field.label || '',
          helpText: formDescription || field.helpText || ''
        };
      }
      // Keep all other fields unchanged
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
