
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
    fields: formElements,
    // Always initialize metadata to prevent undefined errors
    metadata: {
      formStyle: {
        primaryColor: formStyle.primaryColor || '#9b87f5',
        borderRadius: formStyle.borderRadius || '0.5rem',
        fontSize: formStyle.fontSize || '1rem',
        buttonStyle: formStyle.buttonStyle || 'rounded',
        submitButtonText: submitButtonText || 'إرسال الطلب'
      }
    }
  };

  return [formStep];
}

/**
 * Transaction helper for form saves
 * Implements a retry mechanism with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 500
): Promise<T> {
  let retryCount = 0;
  let lastError: Error | null = null;
  
  while (retryCount <= maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Operation failed (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);
      
      retryCount++;
      
      if (retryCount > maxRetries) {
        break;
      }
      
      // Exponential backoff with jitter
      const delay = Math.pow(2, retryCount) * initialDelay + Math.floor(Math.random() * 200);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Operation failed after multiple retries');
}

/**
 * Safely check if an object is a promise
 */
export function isPromise<T>(value: any): value is Promise<T> {
  return Boolean(value && typeof value.then === 'function');
}
