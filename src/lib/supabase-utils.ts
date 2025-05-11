
import { FormStep, FormField } from '@/lib/form-utils';
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
        
        // Process fields array to ensure each field has the required FormField properties
        const processedFields: FormField[] = Array.isArray(step.fields) 
          ? step.fields.map(field => {
              if (typeof field === 'object' && field !== null && 
                  'id' in field && 'type' in field && 'label' in field) {
                // Return a properly typed FormField with all required properties
                return {
                  id: String(field.id),
                  type: String(field.type),
                  label: String(field.label),
                  placeholder: field.placeholder ? String(field.placeholder) : undefined,
                  required: typeof field.required === 'boolean' ? field.required : false,
                  options: Array.isArray(field.options) ? field.options.map(String) : undefined,
                  style: field.style || undefined,
                  content: field.content ? String(field.content) : undefined,
                  helpText: field.helpText ? String(field.helpText) : undefined,
                  disabled: typeof field.disabled === 'boolean' ? field.disabled : undefined,
                  whatsappNumber: field.whatsappNumber ? String(field.whatsappNumber) : undefined,
                  message: field.message ? String(field.message) : undefined
                } as FormField;
              }
              // Return a default field if structure doesn't match
              return {
                id: `default-field-${Math.random().toString(36).substring(2, 9)}`,
                type: 'text',
                label: 'Default Field'
              } as FormField;
            })
          : [];
          
        return {
          id: String(step.id),
          title: String(step.title),
          fields: processedFields
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
