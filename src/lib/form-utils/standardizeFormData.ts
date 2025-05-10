
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
    // If data is already an array, return it (but verify it's a valid array)
    if (Array.isArray(data)) {
      console.log('Data is already an array, returning as is');
      return data;
    }

    // If data has steps property and it's an array, return that
    if (data.steps && Array.isArray(data.steps)) {
      console.log('Found data.steps array, returning it');
      return data.steps;
    }

    // IMPROVED: Handle settings structure - check for settings.steps
    if (data.settings && data.settings.steps && Array.isArray(data.settings.steps)) {
      console.log('Found data.settings.steps array, returning it');
      return data.settings.steps;
    }

    // NEW: Handle when data is directly the form fields array
    if (data.fields && Array.isArray(data.fields)) {
      console.log('Found direct fields array, creating step structure');
      return [{
        id: '1',
        title: 'Default Step',
        fields: data.fields
      }];
    }

    // If data is an object but doesn't have steps, wrap it in an array
    // This might be a single step
    if (typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length > 0) {
      // Check if the object might be a single step
      if (data.id && (data.fields || data.title)) {
        console.log('Data appears to be a single step, wrapping in array');
        return [data];
      }

      // NEW: More flexible handling - if data has title but no fields, treat as a step with empty fields
      if (data.title) {
        console.log('Found object with title but no fields, creating step with empty fields');
        return [{
          id: data.id || '1',
          title: data.title,
          fields: []
        }];
      }

      // NEW: Last resort - treat as generic object with unknown structure
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
  const normalizedSteps = elements.length > 0 ? normalizeFormData(elements) : [{
    id: '1',
    title: 'خطوة 1',
    fields: []
  }];
  
  // IMPROVED: More detailed logging for troubleshooting
  console.log('standardizeFormData - input:', { 
    elementsLength: elements?.length || 0,
    formStyle,
    submitButtonText
  });
  console.log('standardizeFormData - normalized:', normalizedSteps);
  
  // Create a standardized form structure that matches our expected format
  // This structure should be used consistently across the application
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
 * NEW: Function to ensure a form has an ID
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
 * NEW: Function to help debug form data issues
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
