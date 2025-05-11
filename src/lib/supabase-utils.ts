
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
  if (Array.isArray(json)) {
    return json as FormStep[];
  }
  return [];
}
