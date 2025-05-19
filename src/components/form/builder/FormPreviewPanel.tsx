
import React, { useEffect, useState, useRef } from 'react';
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
  const [internalRefreshKey, setInternalRefreshKey] = useState(Date.now());
  const [formDirection, setFormDirection] = useState<'ltr' | 'rtl'>(language === 'ar' ? 'rtl' : 'ltr');
  const previousFieldsRef = useRef<string>('');
  
  // Update internal refresh key when props change to ensure preview updates
  useEffect(() => {
    setInternalRefreshKey(Date.now());
  }, [fields, formStyle, formTitle, formDescription, refreshKey, JSON.stringify(fields)]);
  
  // Process fields to maintain title alignment regardless of form direction
  const processedFields = React.useMemo(() => {
    const currentFieldsJson = JSON.stringify(fields);
    
    // Only reprocess if fields have changed
    if (previousFieldsRef.current === currentFieldsJson) {
      return fields;
    }
    
    previousFieldsRef.current = currentFieldsJson;
    
    return fields.map(field => {
      // Create a new field object to avoid direct mutations
      const updatedField = { ...field };
      
      // Initialize style if it doesn't exist
      if (!updatedField.style) {
        updatedField.style = {};
      }
      
      // Handle empty icon strings
      if (updatedField.icon === '') {
        updatedField.icon = 'none';
      }
      
      // Set showIcon properly if field has an icon
      if (updatedField.icon && updatedField.icon !== 'none') {
        updatedField.style.showIcon = updatedField.style?.showIcon !== undefined 
          ? updatedField.style.showIcon 
          : true;
      }
      
      // CRITICAL: Title fields maintain their own alignment independent of form direction
      if (updatedField.type === 'form-title' || updatedField.type === 'title') {
        // Ensure title style exists
        if (!updatedField.style) {
          updatedField.style = {};
        }
        
        // Set default text alignment if not already specified
        if (updatedField.style.textAlign === undefined) {
          updatedField.style.textAlign = language === 'ar' ? 'right' : 'left';
        }
        
        // Flag to indicate this field should ignore form direction
        updatedField.style.ignoreFormDirection = true;
        
        // Set background and text colors with defaults
        updatedField.style.backgroundColor = updatedField.style.backgroundColor || '#9b87f5';
        updatedField.style.color = updatedField.style.color || '#ffffff';
        
        // Ensure font sizes use pixel units
        if (updatedField.style.fontSize && !updatedField.style.fontSize.includes('px')) {
          updatedField.style.fontSize = `${updatedField.style.fontSize}px`;
        }
        
        if (updatedField.style.descriptionFontSize && !updatedField.style.descriptionFontSize.includes('px')) {
          updatedField.style.descriptionFontSize = `${updatedField.style.descriptionFontSize}px`;
        }
      }
      
      // Ensure font size uses px units for consistency
      if (updatedField.style?.fontSize && !updatedField.style.fontSize.includes('px')) {
        if (updatedField.style.fontSize.includes('rem')) {
          const remValue = parseFloat(updatedField.style.fontSize);
          updatedField.style.fontSize = `${remValue * 16}px`;
        } else if (!isNaN(parseFloat(updatedField.style.fontSize))) {
          updatedField.style.fontSize = `${updatedField.style.fontSize}px`;
        }
      }
      
      return updatedField;
    });
  }, [fields, language, internalRefreshKey]);

  // Create unique ID for this preview panel
  const previewPanelId = `preview-panel-${Date.now()}`;

  return (
    <div id={previewPanelId}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <span className="text-sm text-muted-foreground">
            {language === 'ar' ? 'اتجاه النموذج:' : 'Form Direction:'}
          </span>
          <ToggleGroup 
            type="single" 
            value={formDirection} 
            onValueChange={(value) => value && setFormDirection(value as 'ltr' | 'rtl')}
            className="border rounded-md"
          >
            <ToggleGroupItem value="ltr" aria-label="Left to right" title={language === 'ar' ? 'يسار إلى يمين' : 'Left to right'}>
              <AlignLeft className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="rtl" aria-label="Right to left" title={language === 'ar' ? 'يمين إلى يسار' : 'Right to left'}>
              <AlignRight className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <h3 className={`text-lg font-medium ${language === 'ar' ? 'text-right' : ''}`}>
          {language === 'ar' ? 'معاينة مباشرة' : 'Live Preview'}
        </h3>
      </div>
      
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
          direction={formDirection}
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
