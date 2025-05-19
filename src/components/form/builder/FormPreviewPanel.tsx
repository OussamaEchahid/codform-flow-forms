
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
  const [internalRefreshKey, setInternalRefreshKey] = useState(0);
  
  // Use the refresh key passed from parent but don't trigger cascading updates
  useEffect(() => {
    // Only update on significant changes
    setInternalRefreshKey(prevKey => prevKey + 1);
  }, [refreshKey]);
  
  // Process fields with proper ID preservation using useMemo to prevent recreation
  const processedFields = useMemo(() => {
    return fields.map(field => {
      // Create a new field object to avoid direct mutation issues
      const updatedField = { ...field };
      
      // Preserve the original ID - extremely important for drag and drop stability
      updatedField.id = field.id;
      
      // Convert empty icon strings to 'none'
      if (updatedField.icon === '') {
        updatedField.icon = 'none';
      }
      
      // Ensure icon handling is processed correctly
      if (updatedField.icon && updatedField.icon !== 'none') {
        if (!updatedField.style) {
          updatedField.style = {};
        }
        
        // Set showIcon to true by default unless explicitly set to false
        updatedField.style.showIcon = updatedField.style?.showIcon !== undefined 
          ? updatedField.style.showIcon 
          : true;
      }
      
      // Special processing for title fields
      if (updatedField.type === 'form-title' || updatedField.type === 'title') {
        if (!updatedField.style) {
          updatedField.style = {};
        }
        
        // Ensure text alignment is set
        if (!updatedField.style.textAlign) {
          updatedField.style.textAlign = language === 'ar' ? 'right' : 'left';
        }
        
        // Ensure background and text color
        updatedField.style.backgroundColor = updatedField.style.backgroundColor || '#9b87f5';
        updatedField.style.color = updatedField.style.color || '#ffffff';
        
        // Ensure font sizes have px units
        if (updatedField.style.fontSize && !updatedField.style.fontSize.includes('px')) {
          if (updatedField.style.fontSize.includes('rem')) {
            const remValue = parseFloat(updatedField.style.fontSize);
            updatedField.style.fontSize = `${remValue * 16}px`;
          } else if (!isNaN(parseFloat(updatedField.style.fontSize))) {
            // If it's a number without unit, assume pixels
            updatedField.style.fontSize = `${updatedField.style.fontSize}px`;
          }
        }
        
        if (updatedField.style.descriptionFontSize && !updatedField.style.descriptionFontSize.includes('px')) {
          if (updatedField.style.descriptionFontSize.includes('rem')) {
            const remValue = parseFloat(updatedField.style.descriptionFontSize);
            updatedField.style.descriptionFontSize = `${remValue * 16}px`;
          } else if (!isNaN(parseFloat(updatedField.style.descriptionFontSize))) {
            updatedField.style.descriptionFontSize = `${updatedField.style.descriptionFontSize}px`;
          }
        } else if (!updatedField.style.descriptionFontSize) {
          updatedField.style.descriptionFontSize = '14px';
        }
      }
      
      return updatedField;
    });
  }, [fields, language]); // Remove internalRefreshKey dependency to avoid unnecessary recalculation

  // Create a stable ID for this preview panel component
  const previewPanelId = `preview-panel-${refreshKey}`;

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

export default FormPreviewPanel;
