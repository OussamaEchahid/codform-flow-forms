
import React, { useEffect, useState, useCallback } from 'react';
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

// Get form direction from localStorage with fallback
const getSavedDirection = (): 'ltr' | 'rtl' => {
  try {
    const savedDirection = localStorage.getItem('codform_direction');
    if (savedDirection === 'ltr' || savedDirection === 'rtl') {
      return savedDirection;
    }
  } catch (e) {
    console.error("Error accessing localStorage:", e);
  }
  return 'ltr'; // Default direction
};

// Save form direction to localStorage
const saveDirection = (direction: 'ltr' | 'rtl'): void => {
  try {
    localStorage.setItem('codform_direction', direction);
    console.log(`Direction saved to localStorage: ${direction}`);
  } catch (e) {
    console.error("Error saving direction to localStorage:", e);
  }
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
  
  // Use saved value from localStorage or default based on language
  const [direction, setDirection] = useState<'ltr' | 'rtl'>(() => {
    const savedDir = getSavedDirection();
    // If no saved value, use language to determine direction
    return savedDir || (language === 'ar' ? 'rtl' : 'ltr');
  });
  
  // Internal refresh key to force re-render when needed
  const [internalRefreshKey, setInternalRefreshKey] = useState(Date.now());
  
  // Reset direction when language changes
  useEffect(() => {
    const newDirection = language === 'ar' ? 'rtl' : 'ltr';
    setDirection(newDirection);
    saveDirection(newDirection);
  }, [language]);
  
  // More effective refresh mechanism
  const forceRefresh = useCallback(() => {
    // Create a truly unique key by combining timestamp with random value
    const uniqueKey = Date.now() + Math.random();
    setInternalRefreshKey(uniqueKey);
    console.log(`FormPreview forced refresh with key: ${uniqueKey}`);
  }, []);
  
  // Force refresh on any prop change to ensure live preview updates immediately
  useEffect(() => {
    forceRefresh();
  }, [fields, formStyle, formTitle, formDescription, refreshKey, direction, forceRefresh]);
  
  // Process fields to normalize icon values - necessary for preview
  const processedFields = React.useMemo(() => {
    return fields.map(field => {
      // Create a new field object to avoid direct mutation issues
      const updatedField = { ...field };
      
      // Convert empty icon strings to 'none'
      if (updatedField.icon === '') {
        updatedField.icon = 'none';
      }
      
      // Make sure showIcon is processed correctly
      if (updatedField.icon && updatedField.icon !== 'none') {
        if (!updatedField.style) {
          updatedField.style = {};
        }
        
        // Set showIcon to true by default if icon exists and not explicitly set to false
        updatedField.style.showIcon = updatedField.style?.showIcon !== undefined 
          ? updatedField.style.showIcon 
          : true;
      }
      
      // For title fields, make sure the background color is preserved
      if ((updatedField.type === 'form-title' || updatedField.type === 'title') && updatedField.style) {
        // Log the background color for debugging
        console.log(`Title field ${updatedField.id} background in panel: ${updatedField.style.backgroundColor || 'not set'}`);
      }
      
      // Make sure font size uses consistent px units
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
      
      // For title fields, force text-align to center for consistency with store
      if (updatedField.type === 'form-title' || updatedField.type === 'title') {
        if (!updatedField.style) {
          updatedField.style = {};
        }
        updatedField.style.textAlign = 'center';
      }
      
      return updatedField;
    });
  }, [fields]);

  // Create unique ID for this preview panel
  const previewPanelId = `preview-panel-${internalRefreshKey}`;
  
  // Use consistent background color for preview
  const previewBackgroundColor = "#F9FAFB";

  // Handle direction change with more effective update
  const handleDirectionChange = (value: string) => {
    if (value === 'ltr' || value === 'rtl') {
      // Set new direction
      setDirection(value as 'ltr' | 'rtl');
      
      // Save direction to localStorage for persistence
      saveDirection(value as 'ltr' | 'rtl');
      
      // Log the direction change
      console.log(`Form direction changed to: ${value}`);
      
      // Force a refresh to rebuild component completely
      forceRefresh();
    }
  };

  return (
    <div 
      id={previewPanelId} 
      style={{backgroundColor: previewBackgroundColor}} 
      className="bg-gray-50"
      data-direction={direction}
    >
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
      
      <div 
        className="border rounded-lg p-3 bg-gray-50"
        style={{backgroundColor: previewBackgroundColor}}
      >
        <FormPreview 
          key={`preview-${internalRefreshKey}`}
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
      
      {/* Debugging info */}
      <div className="mt-2 text-xs bg-gray-100 p-2 rounded border border-gray-200">
        <p>
          {language === 'ar' 
            ? `الاتجاه الحالي: ${direction} - مفتاح التحديث: ${internalRefreshKey.toString().substring(0, 8)}`
            : `Current direction: ${direction} - Refresh key: ${internalRefreshKey.toString().substring(0, 8)}`}
        </p>
      </div>
    </div>
  );
};

export default FormPreviewPanel;
