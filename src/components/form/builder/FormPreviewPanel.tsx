
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

// Simple deep clone function that preserves field IDs
const deepCloneFields = (fields: FormField[]): FormField[] => {
  if (!fields) return [];
  
  return fields.map(field => {
    // Start with a complete copy of all first-level properties
    const newField = { ...field };
    
    // Always preserve the exact ID
    newField.id = field.id;
    
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
  
  // Use internal refresh key to prevent rendering loops
  const [internalRefreshKey, setInternalRefreshKey] = useState(0);
  
  // Update internal key only when refresh key increases
  useEffect(() => {
    if (refreshKey > internalRefreshKey) {
      setInternalRefreshKey(refreshKey);
    }
  }, [refreshKey]);
  
  // Process fields - separate form title from regular fields
  const processedFields = useMemo(() => {
    // Create deep copy of fields to prevent mutations
    let clonedFields = deepCloneFields(fields);
    
    // Check if fields exist
    if (!clonedFields || clonedFields.length === 0) {
      return [];
    }
    
    // Remove any form-title fields (handled separately)
    return clonedFields.filter(field => field.type !== 'form-title');
  }, [fields, internalRefreshKey]);

  // Extract title field information
  const titleFieldInfo = useMemo(() => {
    const titleField = fields.find(f => f.type === 'form-title');
    
    if (titleField) {
      return {
        title: titleField.label || formTitle,
        description: titleField.helpText || formDescription,
        backgroundColor: titleField.style?.backgroundColor || formStyle.primaryColor,
        textColor: titleField.style?.color || '#ffffff',
        descriptionColor: titleField.style?.descriptionColor || 'rgba(255, 255, 255, 0.9)',
        textAlign: titleField.style?.textAlign as 'left' | 'center' | 'right' | 'justify' | undefined,
        fontSize: titleField.style?.fontSize || '24px',
        descriptionFontSize: titleField.style?.descriptionFontSize || '14px',
        id: titleField.id
      };
    }
    
    return {
      title: formTitle,
      description: formDescription,
      backgroundColor: formStyle.primaryColor,
      textColor: '#ffffff',
      descriptionColor: 'rgba(255, 255, 255, 0.9)',
      textAlign: language === 'ar' ? 'right' : 'left' as 'left' | 'right',
      fontSize: '24px',
      descriptionFontSize: '14px'
    };
  }, [fields, formTitle, formDescription, formStyle.primaryColor, language]);

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
          titleFieldInfo={titleFieldInfo}
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
