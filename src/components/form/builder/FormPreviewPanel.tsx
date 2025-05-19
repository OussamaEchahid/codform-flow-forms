
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

// Deep clone function to preserve all field properties exactly
const deepCloneFields = (fields: FormField[]): FormField[] => {
  if (!fields) return [];
  
  return fields.map(field => {
    const newField = { ...field };
    
    // Deep clone style object if it exists
    if (field.style) {
      newField.style = { ...field.style };
    }
    
    // Deep clone options array if it exists
    if (field.options && Array.isArray(field.options)) {
      newField.options = field.options.map(option => ({ ...option }));
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
  
  // Use a stable internalRefreshKey that doesn't update with every props change
  const [internalRefreshKey, setInternalRefreshKey] = useState(0);
  
  // Only update the internal refresh key when refreshKey increases
  useEffect(() => {
    if (refreshKey > internalRefreshKey) {
      setInternalRefreshKey(refreshKey);
    }
    // We intentionally omit refreshKey from dependencies to prevent infinite loops
  }, [refreshKey]);
  
  // Use useMemo with stable dependencies to prevent unnecessary recalculations
  const processedFields = useMemo(() => {
    // Make a deep copy of fields to prevent unintended mutations
    const clonedFields = deepCloneFields(fields);
    
    // Check if fields are empty or undefined
    if (!clonedFields || clonedFields.length === 0) {
      return [];
    }
    
    return clonedFields.map(field => {
      if (!field || !field.id) {
        console.warn("Encountered invalid field:", field);
        return field;
      }
      
      // Preserve the original field ID - critical for drag and drop stability
      const originalId = field.id;
      const updatedField = { ...field, id: originalId };
      
      // Convert empty icons to 'none'
      if (updatedField.icon === '') {
        updatedField.icon = 'none';
      }
      
      // Handle icons properly
      if (updatedField.icon && updatedField.icon !== 'none') {
        if (!updatedField.style) {
          updatedField.style = {};
        }
        
        // Set showIcon to true by default unless explicitly set to false
        updatedField.style.showIcon = updatedField.style?.showIcon !== undefined 
          ? updatedField.style.showIcon 
          : true;
      }
      
      // Special handling for title fields
      if (updatedField.type === 'form-title' || updatedField.type === 'title') {
        if (!updatedField.style) {
          updatedField.style = {};
        }
        
        // Ensure text alignment is set
        if (!updatedField.style.textAlign) {
          updatedField.style.textAlign = language === 'ar' ? 'right' : 'left';
        }
        
        // Ensure background color and text color - preserve original values if available
        if (!updatedField.style.backgroundColor) {
          updatedField.style.backgroundColor = '#9b87f5';
        }
        
        if (!updatedField.style.color) {
          updatedField.style.color = '#ffffff';
        }
        
        // Preserve font sizes if already set
        if (!updatedField.style.fontSize) {
          updatedField.style.fontSize = updatedField.type === 'form-title' ? '24px' : '20px';
        } else if (!updatedField.style.fontSize.includes('px')) {
          // Convert to pixels if needed
          if (updatedField.style.fontSize.includes('rem')) {
            const remValue = parseFloat(updatedField.style.fontSize);
            updatedField.style.fontSize = `${remValue * 16}px`;
          } else if (!isNaN(parseFloat(updatedField.style.fontSize))) {
            // If a number without unit, assume pixels
            updatedField.style.fontSize = `${updatedField.style.fontSize}px`;
          }
        }
        
        if (!updatedField.style.descriptionFontSize) {
          updatedField.style.descriptionFontSize = '14px';
        } else if (!updatedField.style.descriptionFontSize.includes('px')) {
          // Convert to pixels if needed
          if (updatedField.style.descriptionFontSize.includes('rem')) {
            const remValue = parseFloat(updatedField.style.descriptionFontSize);
            updatedField.style.descriptionFontSize = `${remValue * 16}px`;
          } else if (!isNaN(parseFloat(updatedField.style.descriptionFontSize))) {
            updatedField.style.descriptionFontSize = `${updatedField.style.descriptionFontSize}px`;
          }
        }
      }
      
      return updatedField;
    });
  }, [fields, language, internalRefreshKey]);

  // Create a stable ID for this preview panel instance
  const previewPanelId = useMemo(() => `preview-panel-${Math.floor(Math.random() * 1000)}`, []);

  return (
    <div id={previewPanelId}>
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
