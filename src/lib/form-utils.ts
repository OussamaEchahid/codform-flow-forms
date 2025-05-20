
import { ReactNode } from 'react';

// Extended the FormFieldStyle interface to include all properties
export interface FormFieldStyle {
  color?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontWeight?: string;
  fontSize?: string;
  descriptionColor?: string;
  descriptionFontSize?: string;
  borderRadius?: string;
  paddingY?: string;
  showTitle?: boolean;
  showDescription?: boolean;
  animation?: boolean;
  animationType?: 'pulse' | 'bounce' | 'shake';
  // Add any other style properties you need
  [key: string]: any;
}

// Add validationRules and settings to the FormField interface
export interface FormField {
  type: string;
  id: string;
  label?: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  icon?: string;
  style?: FormFieldStyle;
  options?: Array<{
    value: string;
    label: string;
  }>;
  defaultValue?: string | number | boolean;
  dependsOn?: string;
  showWhen?: any;
  displayFormat?: string;
  columns?: number;
  multipleCountLimit?: number;
  hideLabel?: boolean;
  step?: number;
  min?: number;
  max?: number;
  rows?: number;
  validationRules?: {
    [key: string]: any;
  };
  settings?: {
    [key: string]: any;
  };
}

export interface FormStep {
  id: string;
  title?: string;
  fields: FormField[];
}

export interface FloatingButtonConfig {
  enabled: boolean;
  text: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: string;
  borderWidth?: string;
  paddingY?: string;
  marginBottom?: string;
  showIcon?: boolean;
  icon?: string;
  animation?: string;
  position?: 'bottom' | 'top' | 'left' | 'right';
  showOnMobile?: boolean;
  showOnDesktop?: boolean;
}

// Helper functions for form utilities

/**
 * Deep clone form fields to prevent mutation issues
 */
export const deepCloneField = (field: FormField): FormField => {
  if (!field) return field;
  
  const newField: FormField = { ...field };
  
  // Always preserve the ID
  newField.id = field.id;
  
  // Deep clone style
  if (field.style) {
    newField.style = { ...field.style };
  }
  
  // Deep clone options
  if (field.options) {
    newField.options = field.options.map(opt => ({ ...opt }));
  }
  
  // Deep clone validation rules
  if (field.validationRules) {
    newField.validationRules = { ...field.validationRules };
  }
  
  // Deep clone settings
  if (field.settings) {
    newField.settings = { ...field.settings };
  }
  
  return newField;
};

/**
 * Deep clone a step including all its fields
 */
export const deepCloneStep = (step: FormStep): FormStep => {
  if (!step) return step;
  
  return {
    ...step,
    id: step.id,
    fields: step.fields?.map(field => deepCloneField(field)) || []
  };
};
