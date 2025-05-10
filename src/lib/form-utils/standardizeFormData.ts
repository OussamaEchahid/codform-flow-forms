/**
 * Utility function to normalize form data structures
 * This handles different data structures that might exist in the database
 */
export const normalizeFormData = (data: any): any[] => {
  // Safety check for null or undefined data
  if (!data) {
    console.log('Form data is null or undefined, returning empty array');
    return [];
  }

  try {
    console.log('normalizeFormData input:', data);
    
    // If data is already an array, and it looks like steps, return it
    if (Array.isArray(data)) {
      console.log('Data is already an array with', data.length, 'items');
      
      // Check if this looks like a steps array
      if (data.length > 0 && (data[0].fields !== undefined || data[0].id !== undefined || data[0].title !== undefined)) {
        console.log('Data appears to be a steps array, keeping its structure');
        return data;
      }
      
      // Otherwise, it might be a direct fields array, wrap it in a step
      console.log('Array data appears to be fields, wrapping in step structure');
      return [{
        id: '1',
        title: 'Default Step',
        fields: data
      }];
    }

    // If data has steps property and it's an array, return that
    if (data.steps && Array.isArray(data.steps)) {
      console.log('Found data.steps array with', data.steps.length, 'steps');
      return data.steps;
    }

    // Handle settings structure - check for settings.steps
    if (data.settings && data.settings.steps && Array.isArray(data.settings.steps)) {
      console.log('Found data.settings.steps array with', data.settings.steps.length, 'steps');
      return data.settings.steps;
    }

    // Handle when data is directly the form fields array
    if (data.fields && Array.isArray(data.fields)) {
      console.log('Found direct fields array with', data.fields.length, 'fields, creating step structure');
      return [{
        id: '1',
        title: 'Default Step',
        fields: data.fields
      }];
    }
    
    // If data might be a single field, wrap it accordingly
    if (data.type && data.id && !Array.isArray(data)) {
      console.log('Data appears to be a single field, wrapping in step and fields structure');
      return [{
        id: '1',
        title: 'Default Step',
        fields: [data]
      }];
    }

    // If data is an object but doesn't have steps, check various structures
    if (typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length > 0) {
      // Check if the object might be a single step
      if (data.id && (data.fields || data.title)) {
        console.log('Data appears to be a single step, wrapping in array');
        return [data];
      }

      // Check if data has title but no fields, treat as a step with empty fields
      if (data.title) {
        console.log('Found object with title but no fields, creating step with empty fields');
        return [{
          id: data.id || '1',
          title: data.title,
          fields: []
        }];
      }
      
      // Check if data might have nested form data
      for (const key of Object.keys(data)) {
        if (data[key] && typeof data[key] === 'object') {
          if (Array.isArray(data[key]) && data[key].length > 0) {
            console.log(`Found potential nested data in '${key}' property, checking it`);
            
            // Check if the array items have fields or title properties
            if (data[key][0] && (data[key][0].fields || data[key][0].title)) {
              console.log(`Found nested steps array in '${key}' property`);
              return data[key];
            }
          }
        }
      }

      // Last resort - treat as generic object with unknown structure
      console.log('Converting generic object to step structure');
      return [{
        id: '1',
        title: 'Form Step',
        fields: []
      }];
    }

    // Default fallback: create a default step structure
    console.log('Unable to determine data structure, creating default step');
    return [{
      id: '1',
      title: 'First Step',
      fields: []
    }];
  } catch (error) {
    console.error('Error normalizing form data:', error);
    // Always return something valid in case of errors
    return [{
      id: '1',
      title: 'First Step',
      fields: []
    }];
  }
};

/**
 * Standardize form data format for consistency across the application
 * Creates a unified format with settings and steps
 */
export const standardizeFormData = (
  elements: any[] = [],
  formStyle: any = {},
  submitButtonText: string = 'إرسال الطلب'
): any => {
  // First normalize any elements to ensure they're in the right format
  let normalizedSteps;
  
  if (elements && elements.length > 0) {
    try {
      normalizedSteps = normalizeFormData(elements);
      console.log('Normalized steps:', normalizedSteps);
    } catch (error) {
      console.error('Error normalizing elements:', error);
      normalizedSteps = [{
        id: '1',
        title: 'خطوة 1',
        fields: []
      }];
    }
  } else {
    normalizedSteps = [{
      id: '1',
      title: 'خطوة 1',
      fields: []
    }];
  }
  
  // Detailed logging for troubleshooting
  console.log('standardizeFormData input:', { 
    elementsLength: elements?.length || 0,
    formStyle,
    submitButtonText
  });
  
  // Create a standardized form structure that matches our expected format
  return {
    settings: {
      formStyle: {
        ...formStyle,
        submitButtonText
      }
    },
    steps: normalizedSteps
  };
};

/**
 * Utility function for retrying failed operations with exponential backoff
 */
export const withRetry = async (
  operation: () => Promise<any>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<any> => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      retries++;
      console.error(`Operation failed (attempt ${retries}/${maxRetries}):`, error);
      
      if (retries >= maxRetries) {
        throw error;
      }
      
      // Wait with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, retries - 1)));
    }
  }
};

/**
 * Function to ensure a form has an ID
 * This helps prevent forms from disappearing due to missing IDs
 */
export const ensureFormId = (form: any): any => {
  if (!form) return null;
  
  // If form has no ID, generate a warning - this shouldn't happen but we'll handle it
  if (!form.id) {
    console.warn('Form missing ID, this may cause issues with display and updates', form);
    return {
      ...form,
      id: `generated-${Math.random().toString(36).substring(2, 9)}` // Add a temporary ID
    };
  }
  
  return form;
};

/**
 * Function to help debug form data issues
 * Provides detailed validation information without rejecting forms
 */
export const debugFormData = (form: any): { isValid: boolean, issues: string[] } => {
  const issues: string[] = [];
  
  if (!form) {
    issues.push('Form is null or undefined');
    return { isValid: false, issues };
  }
  
  if (!form.id) {
    issues.push('Form is missing an ID');
  }
  
  if (!form.title) {
    issues.push('Form is missing a title');
  }
  
  if (!form.data) {
    issues.push('Form is missing data object');
  } else {
    // Check for valid data structure
    try {
      normalizeFormData(form.data);
    } catch (error) {
      issues.push(`Error normalizing form data: ${error}`);
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

/**
 * Enhance form data with any missing fields
 * Useful for fixing incomplete form data
 */
export const enhanceFormData = (form: any): any => {
  if (!form) return null;
  
  const enhanced = { ...form };
  
  // Ensure basic properties exist
  if (!enhanced.id) {
    enhanced.id = `generated-${Math.random().toString(36).substring(2, 9)}`;
  }
  
  if (!enhanced.title) {
    enhanced.title = 'نموذج بدون عنوان';
  }
  
  if (!enhanced.description) {
    enhanced.description = '';
  }
  
  // Ensure data is properly structured
  if (!enhanced.data) {
    enhanced.data = standardizeFormData([], {}, 'إرسال الطلب');
  } else if (typeof enhanced.data !== 'object') {
    enhanced.data = standardizeFormData([], {}, 'إرسال الطلب');
  } else {
    // Try to ensure data structure is valid
    try {
      const normalized = normalizeFormData(enhanced.data);
      enhanced.data = standardizeFormData(normalized, enhanced.formStyle || {}, enhanced.submitbuttontext || 'إرسال الطلب');
    } catch (error) {
      console.error('Error enhancing form data:', error);
      enhanced.data = standardizeFormData([], {}, 'إرسال الطلب');
    }
  }
  
  // Ensure style properties
  if (!enhanced.primaryColor) enhanced.primaryColor = '#9b87f5';
  if (!enhanced.borderRadius) enhanced.borderRadius = '0.5rem';
  if (!enhanced.fontSize) enhanced.fontSize = '1rem';
  if (!enhanced.buttonStyle) enhanced.buttonStyle = 'rounded';
  if (!enhanced.submitbuttontext) enhanced.submitbuttontext = 'إرسال الطلب';
  
  return enhanced;
};

/**
 * Extract all fields from a form data structure, regardless of format
 * This is useful when you need a flat list of all fields
 */
export const extractFormFields = (formData: any): any[] => {
  if (!formData) return [];
  
  try {
    // If formData is already an array of fields, return it
    if (Array.isArray(formData) && formData.length > 0) {
      // If the first item has a fields property, assume it's a steps array
      if (formData[0].fields) {
        return formData.flatMap(step => step.fields || []);
      }
      // Otherwise assume it's already a fields array
      return formData;
    }
    
    // If formData has a steps property, extract fields from it
    if (formData.steps && Array.isArray(formData.steps)) {
      return formData.steps.flatMap(step => step.fields || []);
    }
    
    // If formData has a settings.steps property, extract fields from it
    if (formData.settings && formData.settings.steps && Array.isArray(formData.settings.steps)) {
      return formData.settings.steps.flatMap(step => step.fields || []);
    }
    
    // If formData has a direct fields property, return it
    if (formData.fields && Array.isArray(formData.fields)) {
      return formData.fields;
    }
    
    // Otherwise, return an empty array
    return [];
  } catch (error) {
    console.error('Error extracting form fields:', error);
    return [];
  }
};
