
import { cn } from '@/lib/utils';

export type FormFieldType = 
  'text' | 
  'email' | 
  'tel' | 
  'number' | 
  'textarea' | 
  'select' | 
  'checkbox' | 
  'radio' | 
  'date' | 
  'time' | 
  'datetime-local' | 
  'file' | 
  'hidden' | 
  'image' | 
  'color' | 
  'range' | 
  'url' | 
  'month' | 
  'week' | 
  'password' |
  'title' |
  'html' |
  'step' |
  'submit' |
  'whatsapp' |
  'cart-items' |
  'cart-summary' |
  'shipping-options';

export interface FormField {
  id: string;
  type: FormFieldType;
  label?: string;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  defaultValue?: string;
  helpText?: string;
  name?: string;
  isStep?: boolean;
  stepId?: string;
  stepIndex?: number;
  [key: string]: any;
}

export interface FormStep {
  id: string;
  title: string;
  fields: FormField[];
}

export interface FormData {
  id: string;
  title: string;
  description?: string | null;
  data: FormStep[];
  primaryColor: string;
  borderRadius: string;
  fontSize: string;
  buttonStyle: string;
  is_published?: boolean;
  shop_id?: string | null;
  product_id?: string | null;
}

export const formatCurrency = (amount: number, locale = 'ar-SA', currency = 'SAR') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Basic validation: at least 8 digits, can include +, -, (), and spaces
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
};

export const generateFormFieldClassName = (field: FormField) => {
  return cn(
    "codform-field",
    field.className,
    field.type === 'hidden' && "hidden"
  );
};

export const loadForm = async (formId: string, productId?: string): Promise<FormData> => {
  try {
    // Build the URL with the optional productId parameter
    let url = `/api/forms/${formId}`;
    if (productId) {
      url += `?productId=${encodeURIComponent(productId)}`;
    }
    
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`Failed to load form: ${res.status}`);
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error loading form:", error);
    throw error;
  }
};

export const extractFormSections = (form: FormData): Array<{ title: string; fields: FormField[] }> => {
  // If there's no data or data is not an array with fields property, return empty array
  if (!form || !form.data || !Array.isArray(form.data)) {
    return [];
  }

  // Map each step in the form data to a section
  return form.data.map(step => ({
    title: step.title || '',
    fields: step.fields || []
  }));
};
