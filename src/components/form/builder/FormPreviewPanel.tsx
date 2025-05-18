
import React, { useEffect, useState } from 'react';
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

// CRITICAL: Convert rem to px with same exact algorithm as store implementation
const remToPx = (value: string | undefined, defaultValue: string): string => {
  if (!value) return defaultValue;
  
  if (value.includes('rem')) {
    const remValue = parseFloat(value);
    return `${Math.round(remValue * 16)}px`;
  }
  
  if (!value.includes('px') && !isNaN(parseFloat(value))) {
    return `${value}px`;
  }
  
  return value;
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
  const [internalRefreshKey, setInternalRefreshKey] = useState(Date.now());
  
  // Force update when any property changes to ensure live preview updates instantly
  useEffect(() => {
    setInternalRefreshKey(Date.now());
  }, [fields, formStyle, formTitle, formDescription, refreshKey, JSON.stringify(fields)]);
  
  // Process fields to normalize icon values and ensure consistent styling with store display
  const processedFields = React.useMemo(() => {
    return fields.map(field => {
      // Create new field object to avoid direct mutation issues
      const updatedField = { ...field };
      
      // Convert empty icon strings to 'none'
      if (updatedField.icon === '') {
        updatedField.icon = 'none';
      }
      
      // Ensure showIcon is properly processed
      if (updatedField.icon && updatedField.icon !== 'none') {
        if (!updatedField.style) {
          updatedField.style = {};
        }
        
        // Set showIcon to true by default unless explicitly set to false
        updatedField.style.showIcon = updatedField.style?.showIcon !== undefined 
          ? updatedField.style.showIcon 
          : true;
      }
      
      // CRITICAL: Convert all font size units to px for exact store matching
      if (updatedField.style?.fontSize) {
        updatedField.style.fontSize = remToPx(updatedField.style.fontSize, '16px');
      }
      
      // Ensure description font size uses consistent px units
      if (updatedField.style?.descriptionFontSize) {
        updatedField.style.descriptionFontSize = remToPx(updatedField.style.descriptionFontSize, '14px');
      }
      
      // Special handling for title fields to ensure consistent styles with store implementation
      if (updatedField.type === 'form-title' || updatedField.type === 'title') {
        if (!updatedField.style) {
          updatedField.style = {};
        }
        
        // Set explicit font weights if not defined
        if (!updatedField.style.fontWeight) {
          updatedField.style.fontWeight = updatedField.type === 'form-title' ? 'bold' : 'medium';
        }
        
        // Set consistent text alignment if not defined
        if (!updatedField.style.textAlign) {
          updatedField.style.textAlign = language === 'ar' ? 'right' : 'left';
        }
        
        // Ensure color is explicitly set for store consistency
        if (!updatedField.style.color) {
          updatedField.style.color = '#ffffff';
        }
        
        // Ensure background color is explicitly set
        if (!updatedField.style.backgroundColor && formStyle.primaryColor) {
          updatedField.style.backgroundColor = formStyle.primaryColor;
        }
      }
      
      return updatedField;
    });
  }, [fields, internalRefreshKey, language, formStyle.primaryColor]); 

  // Create unique id for this preview component
  const previewPanelId = `preview-panel-${Date.now()}`;

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
      
      {/* Add diagnostic note */}
      <div className="mt-2 text-xs text-gray-500 p-2 rounded">
        {language === 'ar' 
          ? 'تأكد من أن جميع العناصر في المعاينة تظهر بنفس الشكل في متجر Shopify'
          : 'Ensure all elements in the preview appear the same way in the Shopify store'}
      </div>
    </div>
  );
};

export default FormPreviewPanel;
