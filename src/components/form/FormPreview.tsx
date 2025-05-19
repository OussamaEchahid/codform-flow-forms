
import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { FormField, FloatingButtonConfig } from '@/lib/form-utils';
import FormFieldComponent from './preview/FormField';
import FloatingButton from './preview/FloatingButton';
import StableFormTitle from './preview/fields/StableFormTitle';

interface TitleFieldInfo {
  title: string;
  description?: string;
  backgroundColor?: string;
  textColor?: string;
  descriptionColor?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  fontSize?: string;
  descriptionFontSize?: string;
  borderRadius?: string;
  id?: string;
}

interface FormPreviewProps {
  formTitle: string;
  formDescription?: string;
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
  formStyle?: {
    primaryColor?: string;
    borderRadius?: string;
    fontSize?: string;
    buttonStyle?: string;
  };
  fields?: FormField[];
  hideHeader?: boolean;
  floatingButton?: FloatingButtonConfig;
  hideFloatingButtonPreview?: boolean;
  titleFieldInfo?: TitleFieldInfo;
}

const FormPreview: React.FC<FormPreviewProps> = ({
  formTitle,
  formDescription,
  currentStep,
  totalSteps,
  children,
  formStyle = {
    primaryColor: '#9b87f5',
    borderRadius: '0.5rem',
    fontSize: '16px',
    buttonStyle: 'rounded',
  },
  fields = [],
  hideHeader = false,
  floatingButton,
  hideFloatingButtonPreview = false,
  titleFieldInfo
}) => {
  const { language } = useI18n();
  
  // Process fields for display
  const sanitizedFields = useMemo(() => {
    // Update fields with default values
    const updatedFields = fields.map(field => {
      const updatedField = { ...field };
      
      // Set empty label for cart items and summary
      if ((field.type === 'cart-items' || field.type === 'cart-summary') && field.label === undefined) {
        updatedField.label = '';
      }
      
      // Handle icon properties
      if (field.icon === '') {
        updatedField.icon = 'none';
      }
      
      // Ensure style.showIcon is defined if icon exists
      if (field.icon && field.icon !== 'none') {
        if (!updatedField.style) {
          updatedField.style = {};
        }
        
        updatedField.style.showIcon = updatedField.style?.showIcon !== undefined 
          ? updatedField.style.showIcon 
          : true;
      }
      
      // Ensure basic style properties exist
      if (!updatedField.style) {
        updatedField.style = {};
      }
      
      // Normalize font sizes to pixels
      if (updatedField.style.fontSize && !updatedField.style.fontSize.includes('px')) {
        if (updatedField.style.fontSize.includes('rem')) {
          const remValue = parseFloat(updatedField.style.fontSize);
          updatedField.style.fontSize = `${remValue * 16}px`;
        } else if (!isNaN(parseFloat(updatedField.style.fontSize))) {
          updatedField.style.fontSize = `${updatedField.style.fontSize}px`;
        }
      }
      
      // Normalize label font size
      if (updatedField.style.labelFontSize && !updatedField.style.labelFontSize.includes('px')) {
        if (updatedField.style.labelFontSize.includes('rem')) {
          const remValue = parseFloat(updatedField.style.labelFontSize);
          updatedField.style.labelFontSize = `${remValue * 16}px`;
        } else if (!isNaN(parseFloat(updatedField.style.labelFontSize))) {
          updatedField.style.labelFontSize = `${updatedField.style.labelFontSize}px`;
        }
      } else if (!updatedField.style.labelFontSize) {
        updatedField.style.labelFontSize = '16px';
      }
      
      return updatedField;
    });
    
    // Check if there is already a submit button
    const hasSubmitButton = updatedFields.some(field => field.type === 'submit');
    
    let result = [...updatedFields];
    
    // Add default submit button if needed
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
      result.push(submitButton);
    }
    
    return result;
  }, [fields, language, formStyle.primaryColor]);
  
  // Get title field information
  const titleInfo = titleFieldInfo || {
    title: formTitle,
    description: formDescription,
    backgroundColor: formStyle.primaryColor,
    textColor: '#ffffff',
    descriptionColor: 'rgba(255, 255, 255, 0.9)',
    textAlign: language === 'ar' ? 'right' : 'left',
    fontSize: '24px',
    descriptionFontSize: '14px'
  };
  
  return (
    <div 
      className="rounded-lg border shadow-sm overflow-hidden bg-white codform-form"
      style={{
        fontSize: formStyle.fontSize,
        '--form-primary-color': formStyle.primaryColor,
        borderRadius: formStyle.borderRadius,
        backgroundColor: '#f5f5f5',
        padding: '20px',
      } as React.CSSProperties}
      data-form-preview-id="form-preview-stable"
      data-primary-color={formStyle.primaryColor}
      data-border-radius={formStyle.borderRadius}
      data-font-size={formStyle.fontSize}
      data-button-style={formStyle.buttonStyle}
    >
      {totalSteps > 1 && (
        <div className="px-4 py-2 bg-gray-50">
          <div className="flex items-center">
            <div className="flex-1 flex">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className="flex-1 flex items-center">
                  <div 
                    className={cn(
                      "h-2 flex-1",
                      i < currentStep ? "bg-[var(--form-primary-color)]" : "bg-gray-200"
                    )}
                  ></div>
                  <div 
                    className={cn(
                      "rounded-full h-5 w-5 flex items-center justify-center text-xs font-medium",
                      i + 1 === currentStep 
                        ? "bg-[var(--form-primary-color)] text-white" 
                        : i < currentStep 
                          ? "bg-[var(--form-primary-color)] text-white"
                          : "bg-gray-200 text-gray-600"
                    )}
                  >
                    {i + 1}
                  </div>
                  {i < totalSteps - 1 && (
                    <div 
                      className={cn(
                        "h-2 flex-1",
                        i + 1 < currentStep ? "bg-[var(--form-primary-color)]" : "bg-gray-200"
                      )}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div 
        className="codform-form-content" 
        style={{
          direction: language === 'ar' ? 'rtl' : 'ltr',
          padding: '0',
        }}
        data-direction={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Render the stable form title component */}
        <StableFormTitle
          title={titleInfo.title}
          description={titleInfo.description}
          backgroundColor={titleInfo.backgroundColor}
          textColor={titleInfo.textColor}
          descriptionColor={titleInfo.descriptionColor}
          textAlign={titleInfo.textAlign}
          fontSize={titleInfo.fontSize}
          descriptionFontSize={titleInfo.descriptionFontSize}
          borderRadius={formStyle.borderRadius}
          id={titleInfo.id}
        />
        
        {sanitizedFields.length > 0 ? (
          <div className="space-y-4">
            {sanitizedFields.map(field => (
              <FormFieldComponent 
                key={field.id} 
                field={field} 
                formStyle={formStyle}
              />
            ))}
          </div>
        ) : (
          children
        )}
      </div>

      {/* Show floating button if enabled and not hidden */}
      {floatingButton && floatingButton.enabled && !hideFloatingButtonPreview && (
        <FloatingButton config={floatingButton} isPreview={true} />
      )}
    </div>
  );
};

export default React.memo(FormPreview);
