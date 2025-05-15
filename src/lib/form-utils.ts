
import { z } from 'zod';

// Define the possible field types
export type FormFieldType = 
  | "text" 
  | "textarea" 
  | "select" 
  | "checkbox" 
  | "radio" 
  | "number" 
  | "date" 
  | "time" 
  | "email" 
  | "tel" 
  | "url" 
  | "password" 
  | "hidden" 
  | "file" 
  | "image" 
  | "color" 
  | "range" 
  | "month" 
  | "week" 
  | "datetime-local" 
  | "submit" 
  | "reset" 
  | "button" 
  | "step" 
  | "whatsapp-button" 
  | "cart-items" 
  | "cart-summary" 
  | "shipping-options" 
  | "html-content" 
  | "countdown" 
  | "title" 
  | "subtotal" 
  | "phone" 
  | "form-title" 
  | "text/html";

// Define the form field structure
export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  defaultValue?: string | string[];
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  step?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  multiple?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  size?: number;
  cols?: number;
  rows?: number;
  className?: string;
  style?: {
    [key: string]: string;
  };
  conditionalDisplay?: {
    dependsOn: string;
    showWhen: string | string[];
  };
  validations?: Array<{
    type: string;
    message: string;
    value?: any;
  }>;
  isStep?: boolean;
  stepIndex?: number;
  stepId?: string;
  stepTitle?: string;
}

// Define the form step structure
export interface FormStep {
  id: string;
  title: string;
  fields: FormField[];
  showProgressBar?: boolean;
  showStepNumbers?: boolean;
  showStepTitles?: boolean;
}

// Define the form submission structure
export interface FormSubmission {
  id?: string;
  formId: string;
  data: Record<string, any>;
  createdAt?: string;
  status?: string;
}

// Define floating button configuration
export interface FloatingButtonConfig {
  enabled: boolean;
  text: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: string;
  borderWidth?: string;
  paddingY?: string;
  marginBottom?: string;
  showIcon?: boolean;
  icon?: string;
  animation?: string;
}

// Function to create a default empty field
export function createEmptyField(type: FormFieldType = 'text'): FormField {
  return {
    id: crypto.randomUUID(),
    type,
    label: 'New Field',
    placeholder: '',
    required: false,
  };
}

// Function to create a default form
export function createDefaultForm(): FormStep[] {
  return [
    {
      id: '1',
      title: 'Customer Information',
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Full Name',
          required: true,
          placeholder: 'Enter your full name'
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email',
          required: true,
          placeholder: 'Enter your email address'
        },
        {
          id: 'phone',
          type: 'tel',
          label: 'Phone',
          required: true,
          placeholder: 'Enter your phone number'
        }
      ]
    }
  ];
}

// Form templates for users to start with
export const formTemplates = [
  {
    id: 1,
    title: 'Cash on Delivery Form',
    description: 'A simple form to collect customer information for cash on delivery orders.',
    primaryColor: '#9b87f5',
    data: [
      {
        id: '1',
        title: 'Customer Information',
        fields: [
          {
            id: 'name',
            type: 'text',
            label: 'Full Name',
            required: true,
            placeholder: 'Enter your full name'
          },
          {
            id: 'phone',
            type: 'tel',
            label: 'Phone Number',
            required: true,
            placeholder: 'Enter your phone number'
          },
          {
            id: 'address',
            type: 'textarea',
            label: 'Address',
            required: true,
            placeholder: 'Enter your full address'
          }
        ]
      }
    ]
  },
  {
    id: 2,
    title: 'Contact Form',
    description: 'A basic contact form to collect customer inquiries.',
    primaryColor: '#6adbb8',
    data: [
      {
        id: '1',
        title: 'Contact Details',
        fields: [
          {
            id: 'name',
            type: 'text',
            label: 'Your Name',
            required: true,
            placeholder: 'Enter your name'
          },
          {
            id: 'email',
            type: 'text',
            label: 'Your Email',
            required: true,
            placeholder: 'Enter your email address'
          },
          {
            id: 'message',
            type: 'textarea',
            label: 'Message',
            required: true,
            placeholder: 'Enter your message'
          }
        ]
      }
    ]
  }
];
