
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

    // If data is an object but doesn't have steps, wrap it in an array
    // This might be a single step
    if (typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length > 0) {
      // Check if the object might be a single step
      if (data.id && (data.fields || data.title)) {
        console.log('Data appears to be a single step, wrapping in array');
        return [data];
      }
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

// Export an alias of normalizeFormData as standardizeFormData
export const standardizeFormData = (
  elements: any[],
  formStyle: any = {},
  submitButtonText: string = 'إرسال الطلب'
): any => {
  // Create a standardized form structure with steps
  const formattedStep = {
    id: '1',
    title: 'خطوة 1',
    fields: elements,
    metadata: {
      formStyle: {
        ...formStyle,
        submitButtonText
      }
    }
  };
  
  return [formattedStep];
};

// Add the withRetry utility function for retrying operations
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
