
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { FormField, FloatingButtonConfig, deepCloneField } from '@/lib/form-utils';
import FormPreview from '@/components/form/FormPreview';
import { useI18n } from '@/lib/i18n';

interface FormStyle {
  primaryColor: string;
  borderRadius: string;
  fontSize: string;
  buttonStyle: string;
}

interface FormPreviewPanelProps {
  formTitle: string;
  formDescription: string;
  currentStep: number;
  totalSteps: number;
  formStyle: FormStyle;
  fields: FormField[];
  onPreviousStep?: () => void;
  onNextStep?: () => void;
  refreshKey: number;
  floatingButton?: FloatingButtonConfig;
  hideFloatingButtonPreview?: boolean;
}

// Constant ID for form title - must match FormPreview
const FORM_TITLE_ID = 'form-title-static';

// Improved deep clone function with proper TypeScript support
const deepCloneFields = (fields: FormField[]): FormField[] => {
  if (!fields) return [];
  
  return fields.map(field => deepCloneField(field));
};

const FormPreviewPanel: React.FC<FormPreviewPanelProps> = ({
  formTitle,
  formDescription,
  currentStep,
  totalSteps,
  formStyle,
  fields,
  onPreviousStep,
  onNextStep,
  refreshKey,
  floatingButton,
  hideFloatingButtonPreview = false
}) => {
  const { language } = useI18n();
  
  // Use internal refresh key to prevent rendering loops
  const [internalRefreshKey, setInternalRefreshKey] = useState(0);
  const processingRef = useRef(false);
  const [processedFields, setProcessedFields] = useState<FormField[]>([]);
  
  // Update internal key only when refresh key increases
  useEffect(() => {
    if (refreshKey > internalRefreshKey) {
      setInternalRefreshKey(refreshKey);
    }
  }, [refreshKey, internalRefreshKey]);
  
  // Process all fields with deep cloning to prevent mutations - critical for form stability
  // Using useCallback to avoid recreating this function on every render
  const processFields = useCallback((inputFields: FormField[]) => {
    // Guard against recursive processing
    if (processingRef.current) {
      console.log("Preventing recursive field processing");
      return inputFields;
    }
    
    processingRef.current = true;
    
    try {
      console.log("Processing fields for preview, original count:", inputFields?.length || 0);
      
      // Create deep copy of all fields to prevent mutations
      const clonedFields = deepCloneFields(inputFields);
      
      // Find existing title fields
      const titleFieldById = clonedFields.find(field => field.id === FORM_TITLE_ID);
      const titleFieldByType = clonedFields.find(field => field.type === 'form-title');
      
      // Determine which title field to use (prioritize by ID, then by type)
      const titleField = titleFieldById || titleFieldByType;
      
      // Log the title field being used
      if (titleField) {
        console.log("Title field found:", titleField.id, "Type:", titleField.type);
      } else {
        console.log("No title field found, will create one");
      }
      
      // Filter out all form-title fields to avoid duplicates
      let filteredFields = clonedFields.filter(field => {
        // Keep non-title fields
        if (field.type !== 'form-title') return true;
        
        // Keep only one title field - prioritize the one with standard ID
        if (field.id === FORM_TITLE_ID) return true;
        
        // Keep only if we don't have a title field with standard ID yet
        if (!titleFieldById && field === titleFieldByType) return true;
        
        // Remove all other form-title fields
        return false;
      });
      
      // If we don't have any title field, create one with preserved styles
      if (!titleField) {
        console.log("Creating new title field with default styles");
        const newTitleField: FormField = {
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
            borderRadius: formStyle.borderRadius || '8px',
            paddingY: '16px',
            showTitle: true,
            showDescription: true
          }
        };
        
        // Add the title field at the beginning
        filteredFields = [newTitleField, ...filteredFields];
      } 
      // If we have a title field but it doesn't have the standard ID
      else if (titleField && titleField.id !== FORM_TITLE_ID) {
        // Create a new title field with standard ID but preserve all other properties and style
        const standardizedTitle: FormField = {
          ...titleField,
          id: FORM_TITLE_ID,
          type: 'form-title',
          label: formTitle || titleField.label || '',
          helpText: formDescription || titleField.helpText || '',
        };
        
        console.log("Standardizing title field");
        
        // Replace the existing title field with the standardized one
        filteredFields = filteredFields.filter(field => field.id !== titleField.id);
        filteredFields = [standardizedTitle, ...filteredFields];
      }
      // If we have a title field with the standard ID, update its label and description
      // but preserve all style settings to prevent style loss on refresh
      else if (titleFieldById) {
        const titleIndex = filteredFields.findIndex(field => field.id === FORM_TITLE_ID);
        if (titleIndex !== -1) {
          // Create a fresh object with complete deep copy
          const updatedTitleField: FormField = {
            ...deepCloneField(filteredFields[titleIndex]),
            label: formTitle || filteredFields[titleIndex].label || '',
            helpText: formDescription || filteredFields[titleIndex].helpText || '',
          };
          
          // Ensure all style properties are preserved
          updatedTitleField.style = {
            ...updatedTitleField.style,
            // Apply defaults only if properties are missing
            backgroundColor: updatedTitleField.style?.backgroundColor || formStyle.primaryColor || '#9b87f5',
            borderRadius: updatedTitleField.style?.borderRadius || formStyle.borderRadius || '8px',
            paddingY: updatedTitleField.style?.paddingY || '16px',
            showTitle: typeof updatedTitleField.style?.showTitle === 'boolean' ? updatedTitleField.style.showTitle : true,
            showDescription: typeof updatedTitleField.style?.showDescription === 'boolean' ? updatedTitleField.style.showDescription : true
          };
          
          // Replace the title field
          filteredFields[titleIndex] = updatedTitleField;
        }
      }
      
      // Add default submit button if needed
      const hasSubmitButton = filteredFields.some(field => field.type === 'submit');
      
      if (!hasSubmitButton) {
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
        filteredFields.push(submitButton);
      }
      
      console.log("Final processed fields count:", filteredFields.length);
      return filteredFields;
    } finally {
      processingRef.current = false;
    }
  }, [formTitle, formDescription, formStyle, language]);
  
  // Use a stable useEffect to process fields only when dependencies change
  useEffect(() => {
    const result = processFields(fields);
    setProcessedFields(result);
  }, [fields, formTitle, formDescription, formStyle, language, processFields, internalRefreshKey]);

  return (
    <div>
      <h3 className={`text-lg font-medium mb-3 ${language === 'ar' ? 'text-right' : ''}`}>
        {language === 'ar' ? 'معاينة مباشرة' : 'Live Preview'}
      </h3>
      
      <div className="border rounded-lg p-3 bg-gray-50">
        <FormPreview 
          key={`preview-${internalRefreshKey}`}
          formTitle={formTitle}
          formDescription={formDescription}
          currentStep={currentStep}
          totalSteps={totalSteps}
          formStyle={formStyle}
          fields={processedFields}
          floatingButton={floatingButton}
          hideFloatingButtonPreview={hideFloatingButtonPreview}
        >
          <div></div>
        </FormPreview>
      </div>
      
      <div className="mt-2 text-xs text-gray-500 p-2 rounded text-center">
        {language === 'ar' 
          ? 'المعاينة تعكس بدقة كيف سيظهر النموذج في متجر Shopify'
          : 'This preview accurately reflects how the form will appear in your Shopify store'}
      </div>
    </div>
  );
};

export default React.memo(FormPreviewPanel);
