import React, { useEffect, useState, useMemo } from 'react';
import { FormField, FloatingButtonConfig } from '@/lib/form-utils';
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
  
  // Update internal key only when refresh key increases
  useEffect(() => {
    if (refreshKey > internalRefreshKey) {
      setInternalRefreshKey(refreshKey);
    }
  }, [refreshKey, internalRefreshKey]);
  
  // Process all fields with deep cloning to prevent mutations - critical for form stability
  const processedFields = useMemo(() => {
    // Create deep copy of all fields to prevent mutations
    const clonedFields = deepCloneFields(fields);
    
    // Find existing title fields
    const titleFieldById = clonedFields.find(field => field.id === FORM_TITLE_ID);
    const titleFieldByType = clonedFields.find(field => field.type === 'form-title');
    
    // Determine which title field to use (prioritize by ID, then by type)
    const titleField = titleFieldById || titleFieldByType;
    
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
    
    // If we don't have any title field, create one
    if (!titleField) {
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
          showTitle: true,
          showDescription: true
        }
      };
      
      // Add the title field at the beginning
      filteredFields = [newTitleField, ...filteredFields];
    } 
    // If we have a title field but it doesn't have the standard ID
    else if (titleField && titleField.id !== FORM_TITLE_ID) {
      // Create a new title field with standard ID but preserve all other properties
      const standardizedTitle: FormField = {
        ...titleField,
        id: FORM_TITLE_ID,
        type: 'form-title',
        label: formTitle || titleField.label || '',
        helpText: formDescription || titleField.helpText || '',
      };
      
      // Replace the existing title field with the standardized one
      filteredFields = filteredFields.filter(field => field.id !== titleField.id);
      filteredFields = [standardizedTitle, ...filteredFields];
    }
    // If we have a title field with the standard ID, update its label and description
    else if (titleFieldById) {
      const titleIndex = filteredFields.findIndex(field => field.id === FORM_TITLE_ID);
      if (titleIndex !== -1) {
        filteredFields[titleIndex] = {
          ...filteredFields[titleIndex],
          label: formTitle || filteredFields[titleIndex].label || '',
          helpText: formDescription || filteredFields[titleIndex].helpText || '',
        };
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
    
    return filteredFields;
  }, [fields, language, formStyle.primaryColor, formTitle, formDescription]);

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
