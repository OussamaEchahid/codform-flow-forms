
import React, { useEffect, useState } from 'react';
import { FormField, FloatingButtonConfig } from '@/lib/form-utils';
import FormPreview from '@/components/form/FormPreview';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AlignLeft, AlignRight } from 'lucide-react'; 

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
  const [direction, setDirection] = useState<'ltr' | 'rtl'>(language === 'ar' ? 'rtl' : 'ltr');
  const [internalRefreshKey, setInternalRefreshKey] = useState(Date.now());
  
  // Force refresh when any prop changes to ensure live preview updates immediately
  useEffect(() => {
    setInternalRefreshKey(Date.now());
  }, [fields, formStyle, formTitle, formDescription, refreshKey, JSON.stringify(fields), direction]);
  
  // Process fields to normalize icon values - necessary for preview display
  const processedFields = React.useMemo(() => {
    return fields.map(field => {
      // Create a new field object to avoid direct mutation issues
      const updatedField = { ...field };
      
      // Convert empty icon strings to 'none'
      if (updatedField.icon === '') {
        updatedField.icon = 'none';
      }
      
      // Ensure showIcon is properly handled
      if (updatedField.icon && updatedField.icon !== 'none') {
        if (!updatedField.style) {
          updatedField.style = {};
        }
        
        // Set showIcon to true by default if icon exists and not explicitly set to false
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
          // If just a number without unit, assume it's px
          updatedField.style.fontSize = `${updatedField.style.fontSize}px`;
        }
      }
      
      return updatedField;
    });
  }, [fields, internalRefreshKey]);

  // Create a unique ID for this preview component
  const previewPanelId = `preview-panel-${Date.now()}`;
  
  // Use consistent background color for preview
  const previewBackgroundColor = "#F9FAFB";

  // Handle direction change without changing language
  const handleDirectionChange = (value: string) => {
    if (value === 'ltr' || value === 'rtl') {
      setDirection(value);
      // Force more aggressive refresh when direction changes
      setInternalRefreshKey(Date.now() + 1000);
    }
  };

  return (
    <div id={previewPanelId} style={{backgroundColor: previewBackgroundColor}} className="bg-gray-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className={`text-lg font-medium ${language === 'ar' ? 'text-right' : ''}`}>
          {language === 'ar' ? 'معاينة مباشرة' : 'Live Preview'}
        </h3>
        
        <div className="direction-controls">
          <ToggleGroup 
            type="single" 
            value={direction} 
            onValueChange={handleDirectionChange} 
            variant="outline"
            className="border rounded"
          >
            <ToggleGroupItem value="ltr" aria-label="Left to right">
              <AlignLeft className="h-4 w-4" />
              <span className="sr-only">LTR</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="rtl" aria-label="Right to left">
              <AlignRight className="h-4 w-4" />
              <span className="sr-only">RTL</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      
      <div className="border rounded-lg p-3 bg-gray-50" style={{backgroundColor: previewBackgroundColor}}>
        <FormPreview 
          key={`preview-${internalRefreshKey}-${direction}`}
          formTitle={formTitle}
          formDescription={formDescription}
          currentStep={currentStep}
          totalSteps={totalSteps}
          formStyle={formStyle}
          fields={processedFields}
          formDirection={direction}
          floatingButton={floatingButton}
          hideFloatingButtonPreview={hideFloatingButtonPreview}
        >
          <div></div>
        </FormPreview>
      </div>
      
      {/* Add small note about preview/store alignment */}
      <div className="mt-2 text-xs text-gray-500 p-2 rounded">
        {language === 'ar' 
          ? 'تأكد من أن جميع العناصر في المعاينة تظهر بنفس الشكل في متجر Shopify'
          : 'Ensure all elements in the preview appear the same way in the Shopify store'}
      </div>
    </div>
  );
};

export default FormPreviewPanel;
