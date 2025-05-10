
import { FormField } from '@/lib/form-utils';

/**
 * Utilities for form data validation and conversion
 */

/**
 * Validates form elements array to ensure all elements have proper structure
 */
export function validateFormElements(elements: any[]): FormField[] {
  if (!Array.isArray(elements)) {
    console.error('Form elements is not an array:', elements);
    return [];
  }
  
  return elements.filter(element => {
    // Ensure each element has at least id and type
    if (!element || !element.id || !element.type) {
      console.warn('Skipping invalid form element:', element);
      return false;
    }
    return true;
  }).map(element => {
    // Ensure each element has required properties with defaults
    return {
      id: element.id,
      type: element.type,
      label: element.label || `Field ${element.id}`,
      required: element.required ?? false,
      ...element // Preserve other properties
    };
  });
}

/**
 * Safe JSON parser with error handling
 */
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch (e) {
    console.error('Error parsing JSON:', e);
    return fallback;
  }
}

/**
 * Creates a normalized form data structure
 */
export function normalizeFormData(formData: any) {
  // Ensure data.fields exists and is an array
  if (!formData.data) {
    formData.data = { fields: [] };
  } else if (Array.isArray(formData.data)) {
    // Handle case where data is a direct array
    formData.data = { fields: formData.data };
  } else if (!formData.data.fields && !formData.data.steps) {
    // Create fields array if neither fields nor steps exist
    formData.data.fields = [];
  }
  
  // Normalize fields if they exist
  if (formData.data.fields) {
    formData.data.fields = validateFormElements(formData.data.fields);
  }
  
  // Normalize steps if they exist
  if (formData.data.steps && Array.isArray(formData.data.steps)) {
    formData.data.steps = formData.data.steps.map(step => ({
      ...step,
      fields: step.fields ? validateFormElements(step.fields) : []
    }));
  }
  
  return formData;
}

/**
 * Creates a fingerprint of form data for change detection
 */
export function createFormFingerprint(formData: any): string {
  try {
    const relevantData = {
      title: formData.title,
      description: formData.description,
      elements: Array.isArray(formData.data?.fields) ? 
        formData.data.fields.map((f: any) => ({ id: f.id, type: f.type, label: f.label })) : 
        [],
      style: {
        primaryColor: formData.primaryColor,
        fontSize: formData.fontSize,
        borderRadius: formData.borderRadius,
        buttonStyle: formData.buttonStyle
      }
    };
    
    return JSON.stringify(relevantData);
  } catch (e) {
    console.error('Error creating form fingerprint:', e);
    return Math.random().toString();
  }
}

/**
 * Validates form style properties
 */
export function validateFormStyle(style: any) {
  return {
    primaryColor: style?.primaryColor || '#9b87f5',
    fontSize: style?.fontSize || '1rem',
    borderRadius: style?.borderRadius || '0.5rem',
    buttonStyle: style?.buttonStyle || 'rounded'
  };
}
