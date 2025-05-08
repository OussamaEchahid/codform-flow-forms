
import { FormField, FormStep } from '@/lib/form-utils';
import { FormStyle } from '@/hooks/useFormEditor';

/**
 * Ensures that form data is properly structured before saving
 * Prevents infinite update loops by standardizing the data structure
 */
export function standardizeFormData(
  formElements: FormField[],
  formStyle: FormStyle,
  submitButtonText: string
): FormStep[] {
  // Create a standard form step structure
  const formStep: FormStep = {
    id: '1',
    title: 'Main Step',
    fields: formElements
  };

  // Ensure metadata exists and is properly structured
  if (!formStep.metadata) {
    formStep.metadata = {};
  }
  
  // Store style properties in the metadata
  formStep.metadata.formStyle = {
    primaryColor: formStyle.primaryColor,
    borderRadius: formStyle.borderRadius,
    fontSize: formStyle.fontSize,
    buttonStyle: formStyle.buttonStyle,
    submitButtonText: submitButtonText
  };

  return [formStep];
}

/**
 * Transaction helper for form saves
 * Implements a retry mechanism with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let retryCount = 0;
  
  while (true) {
    try {
      return await operation();
    } catch (error) {
      retryCount++;
      console.error(`Operation failed (attempt ${retryCount}):`, error);
      
      if (retryCount >= maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      const delay = Math.pow(2, retryCount) * 500;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
