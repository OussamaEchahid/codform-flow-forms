
import { FormStep } from '@/lib/form-utils';
import { Json } from '@/integrations/supabase/types';

/**
 * Convert FormStep[] to Json for Supabase storage
 */
export function formStepsToJson(formSteps: FormStep[]): Json {
  return formSteps as unknown as Json;
}

/**
 * Convert Json from Supabase to FormStep[]
 */
export function jsonToFormSteps(json: Json): FormStep[] {
  if (!json) {
    return [];
  }
  
  if (Array.isArray(json)) {
    // First cast to unknown, then to FormStep[] to avoid direct type assertion errors
    // We validate the structure before returning to ensure type safety
    const steps = json.map(step => {
      // Verify the step has the required FormStep properties
      if (typeof step === 'object' && step !== null && 
          'id' in step && 'title' in step && 'fields' in step) {
        return {
          id: String(step.id),
          title: String(step.title),
          fields: Array.isArray(step.fields) ? step.fields : []
        } as FormStep;
      }
      // Return a default step if structure doesn't match
      return {
        id: 'default-id',
        title: 'Default Step',
        fields: []
      } as FormStep;
    });
    
    return steps;
  }
  
  return [];
}
