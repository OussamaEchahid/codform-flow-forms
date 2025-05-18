
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
  
  // Add logging function for changes
  useEffect(() => {
    console.log('FormPreviewPanel: Refreshing preview with new data', { 
      refreshKey,
      fieldsCount: fields.length,
      formTitle,
      formStyle
    });
    
    // Additional tracking number to measure preview responsiveness
    const updateTracker = `update-${Date.now()}`;
    console.log(`Preview refresh tracker: ${updateTracker}`);
    
    // Log info about title if present
    const titleField = fields.find(f => f.type === 'form-title');
    if (titleField) {
      console.log('Title field found:', { 
        id: titleField.id,
        label: titleField.label,
        backgroundColor: titleField.style?.backgroundColor,
        textColor: titleField.style?.color
      });
    }
    
    // Log information about fields with icons
    const fieldsWithIcons = fields.filter(f => f.icon && f.icon !== 'none');
    if (fieldsWithIcons.length > 0) {
      console.log(`Fields with icons: ${fieldsWithIcons.length}`);
      fieldsWithIcons.forEach(f => {
        console.log(`Icon field: ${f.id}, type: ${f.type}, icon: ${f.icon}, showIcon: ${f.style?.showIcon !== false}`);
      });
    }
    
    setInternalRefreshKey(Date.now());
  }, [fields, formStyle, formTitle, formDescription, refreshKey]);
  
  // Process fields to normalize icon values - essential for preview display
  const processedFields = React.useMemo(() => {
    return fields.map(field => {
      // Create a new field object to avoid direct mutation issues
      const updatedField = { ...field };
      
      // Convert empty icon strings to 'none'
      if (updatedField.icon === '') {
        updatedField.icon = 'none';
      }
      
      // Ensure showIcon is handled properly
      if (updatedField.icon && updatedField.icon !== 'none') {
        if (!updatedField.style) {
          updatedField.style = {};
        }
        
        // Set showIcon to true by default unless explicitly set to false
        updatedField.style.showIcon = updatedField.style?.showIcon !== undefined 
          ? updatedField.style.showIcon 
          : true;
      }
      
      // Ensure font size uses consistent px units
      if (updatedField.style?.fontSize && !updatedField.style.fontSize.includes('px')) {
        // Convert rem to px for consistency
        if (updatedField.style.fontSize.includes('rem')) {
          const remValue = parseFloat(updatedField.style.fontSize);
          updatedField.style.fontSize = `${remValue * 16}px`;
        } else if (!isNaN(parseFloat(updatedField.style.fontSize))) {
          // If it's a number without unit, assume px
          updatedField.style.fontSize = `${updatedField.style.fontSize}px`;
        }
      }
      
      return updatedField;
    });
  }, [fields, internalRefreshKey]);

  // Create unique id for this preview panel
  const previewPanelId = `preview-panel-${Date.now()}`;

  return (
    <div id={previewPanelId} data-preview-refresh-key={internalRefreshKey}>
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
      
      {/* Add small comment to alert about preview/store display consistency */}
      <div className="mt-2 text-xs text-gray-500 p-2 rounded">
        {language === 'ar' 
          ? 'تأكد من أن جميع العناصر في المعاينة تظهر بنفس الشكل في متجر Shopify'
          : 'Ensure all elements in the preview appear the same way in the Shopify store'}
      </div>
    </div>
  );
};

export default FormPreviewPanel;
