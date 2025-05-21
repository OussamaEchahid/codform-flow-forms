
import React, { useEffect, useState, useMemo } from 'react';
import { FormField, FloatingButtonConfig, deepCloneField } from '@/lib/form-utils';
import FormPreview from '@/components/form/FormPreview';
import { useI18n } from '@/lib/i18n';

interface FormStyle {
  primaryColor: string;
  borderRadius: string;
  fontSize: string;
  buttonStyle: string;
  // Add new style properties
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
    // Create a full deep copy of the field
    const newField = deepCloneField(field);
    
    // Ensure style object is properly cloned with all properties
    if (field.style) {
      newField.style = { ...field.style };
      
      // Explicitly preserve special properties that might be lost
      if ('showTitle' in field.style) {
        newField.style.showTitle = field.style.showTitle;
      }
      
      if ('showDescription' in field.style) {
        newField.style.showDescription = field.style.showDescription;
      }
      
      if ('borderRadius' in field.style) {
        newField.style.borderRadius = field.style.borderRadius;
      }
      
      if ('paddingY' in field.style) {
        newField.style.paddingY = field.style.paddingY;
      }

      // Preserve text alignment
      if ('textAlign' in field.style) {
        newField.style.textAlign = field.style.textAlign;
      }
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
    console.log("Processing fields for preview, original count:", fields?.length || 0);
    
    // Create deep copy of all fields to prevent mutations
    const clonedFields = deepCloneFields(fields);
    
    // Find existing title fields - ensure stable references
    const titleFieldById = clonedFields.find(field => field.id === FORM_TITLE_ID);
    const titleFieldByType = clonedFields.find(field => field.type === 'form-title' && field.id !== FORM_TITLE_ID);
    
    // Determine which title field to use (prioritize by ID, then by type)
    const titleField = titleFieldById || titleFieldByType;
    
    console.log("Title field found:", titleField?.id, "Type:", titleField?.type, 
                "Style:", titleField?.style?.backgroundColor,
                "ShowTitle:", titleField?.style?.showTitle,
                "ShowDescription:", titleField?.style?.showDescription);
    
    // Filter out all form-title fields to avoid duplicates
    let filteredFields = clonedFields.filter(field => {
      // Keep non-title fields
      if (field.type !== 'form-title') return true;
      
      // Keep only one title field - prioritize the one with standard ID
      if (field.id === FORM_TITLE_ID) return true;
      
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
          // Use primaryColor for title background
          backgroundColor: formStyle.primaryColor || '#9b87f5',
          color: '#ffffff',
          textAlign: language === 'ar' ? 'right' : 'center',
          fontSize: '24px',
          fontWeight: 'bold',
          descriptionColor: 'rgba(255, 255, 255, 0.9)',
          descriptionFontSize: '14px',
          borderRadius: formStyle.borderRadius, 
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
        // Make sure to preserve all style properties
        style: {
          ...(titleField.style || {}),
          // IMPORTANT: Prioritize the field's own backgroundColor, THEN primaryColor
          backgroundColor: titleField.style?.backgroundColor || formStyle.primaryColor,
          // Explicitly preserve critical properties
          showTitle: titleField.style?.showTitle !== undefined ? titleField.style.showTitle : true,
          showDescription: titleField.style?.showDescription !== undefined ? titleField.style.showDescription : true,
          borderRadius: titleField.style?.borderRadius || formStyle.borderRadius,
          paddingY: titleField.style?.paddingY || '16px',
          textAlign: titleField.style?.textAlign
        }
      };
      
      console.log("Standardizing title field, preserving styles:", 
                  standardizedTitle.style?.backgroundColor,
                  "ShowTitle:", standardizedTitle.style?.showTitle,
                  "ShowDescription:", standardizedTitle.style?.showDescription);
      
      // Replace the existing title field with the standardized one
      filteredFields = filteredFields.filter(field => field.id !== titleField.id);
      filteredFields = [standardizedTitle, ...filteredFields];
    }
    // If we have a title field with the standard ID, update its label and description
    // but preserve all style settings to prevent style loss on refresh
    else if (titleFieldById) {
      const titleIndex = filteredFields.findIndex(field => field.id === FORM_TITLE_ID);
      if (titleIndex !== -1) {
        // Make a deep copy of the style to prevent mutations
        const preservedStyle = JSON.parse(JSON.stringify(filteredFields[titleIndex].style || {}));
        
        console.log("Updating existing title field, preserving style:", 
                    preservedStyle.backgroundColor || "not set",
                    "formStyle primaryColor:", formStyle.primaryColor,
                    "ShowTitle:", preservedStyle.showTitle,
                    "ShowDescription:", preservedStyle.showDescription);
                    
        // CRITICAL FIX: Create a brand new object to prevent reference issues
        filteredFields[titleIndex] = {
          type: 'form-title',
          id: FORM_TITLE_ID,
          label: formTitle || filteredFields[titleIndex].label || '',
          helpText: formDescription || filteredFields[titleIndex].helpText || '',
          // Critical: Preserve all existing style properties
          style: {
            ...preservedStyle,
            // IMPORTANT: Prioritize the field's existing backgroundColor, THEN primaryColor
            backgroundColor: preservedStyle.backgroundColor || formStyle.primaryColor || '#9b87f5',
            // Explicitly preserve these critical properties with their original values
            showTitle: preservedStyle.showTitle !== undefined ? preservedStyle.showTitle : true,
            showDescription: preservedStyle.showDescription !== undefined ? preservedStyle.showDescription : true,
            borderRadius: preservedStyle.borderRadius || formStyle.borderRadius,
            paddingY: preservedStyle.paddingY || '16px',
            textAlign: preservedStyle.textAlign
          }
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
    
    console.log("Final processed fields count:", filteredFields.length);
    return filteredFields;
  }, [fields, language, formStyle.primaryColor, formStyle.backgroundColor, formStyle.borderRadius, formTitle, formDescription, formStyle.formDirection]);

  // Prepare form style for preview with default background color
  // Make sure we have all required style properties with defaults
  const previewFormStyle = {
    ...formStyle,
    backgroundColor: formStyle.backgroundColor || '#F9FAFB', // Default background color
    borderRadius: formStyle.borderRadius || '1.5rem', // Large border radius
    borderColor: formStyle.borderColor || '#9b87f5', // Default border color
    borderWidth: formStyle.borderWidth || '2px',     // Default border width
  };

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
          formStyle={previewFormStyle}
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
